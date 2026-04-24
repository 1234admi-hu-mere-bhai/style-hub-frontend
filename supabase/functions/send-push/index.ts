import webpush from "npm:web-push";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

function getBearerToken(authHeader: string | null): string {
  return authHeader?.replace(/^Bearer\s+/i, "").trim() ?? "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Auth: allow either authenticated user OR service-role (for backend triggers)
    const authHeader = req.headers.get("Authorization");
    const token = getBearerToken(authHeader);
    const apikey = req.headers.get("apikey")?.trim() ?? "";
    const isServiceRole = token === serviceRoleKey || apikey === serviceRoleKey;

    if (!isServiceRole) {
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: userError } = await userClient.auth.getUser(token);
      if (userError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // category: orders | offers | wishlist | cart_reminders | flash_sales | new_arrivals | announcements
    // dedupeKey: optional — prevents same notification firing twice for same user
    const { title, message, url, tag, userId, category, dedupeKey } = await req.json();

    // Get VAPID keys
    const { data: config } = await adminClient
      .from("push_config")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (!config) {
      return new Response(JSON.stringify({ error: "Push not configured. No VAPID keys found." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const privateKeyJwk = JSON.parse(config.private_key) as JsonWebKey & { d?: string };
    if (!privateKeyJwk.d) {
      return new Response(JSON.stringify({ error: "Push not configured. Invalid private key format." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    webpush.setVapidDetails(config.subject, config.public_key, privateKeyJwk.d);

    // Get subscriptions (scoped to user if userId provided)
    let subQuery = adminClient.from("push_subscriptions").select("*");
    if (userId) {
      subQuery = subQuery.eq("user_id", userId);
    }
    const { data: rawSubscriptions } = await subQuery;

    let subscriptions: PushSubscriptionRow[] = (rawSubscriptions || []) as PushSubscriptionRow[];

    // Per-user category preference filtering
    if (category && subscriptions.length > 0) {
      const userIds = [...new Set(subscriptions.map((s: any) => s.user_id))];
      const { data: prefs } = await adminClient
        .from("notification_preferences")
        .select("*")
        .in("user_id", userIds);

      const allowedUserIds = new Set<string>();
      for (const uid of userIds) {
        const pref = (prefs || []).find((p: any) => p.user_id === uid);
        const allowed = pref ? pref[category] !== false : true; // default ON
        if (allowed) allowedUserIds.add(uid as string);
      }
      subscriptions = subscriptions.filter((s: any) => allowedUserIds.has(s.user_id));
    }

    // Dedupe: skip users who already got this notification
    if (dedupeKey && subscriptions.length > 0) {
      const userIds = [...new Set(subscriptions.map((s: any) => s.user_id))];
      const { data: alreadySent } = await adminClient
        .from("push_send_log")
        .select("user_id")
        .eq("dedupe_key", dedupeKey)
        .in("user_id", userIds);
      const skipSet = new Set((alreadySent || []).map((r: any) => r.user_id));
      subscriptions = subscriptions.filter((s: any) => !skipSet.has(s.user_id));
    }

    if (subscriptions.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No eligible subscribers" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.stringify({
      title,
      message,
      url: url || "/notifications",
      tag: tag || "muffigout",
      dedupeKey: dedupeKey || null,
    });

    let sent = 0;
    let failed = 0;
    const deliveredUserIds = new Set<string>();

    console.log(`Sending push to ${subscriptions.length} subscriber(s)`);

    for (const sub of subscriptions) {
      try {
        console.log(`Sending to endpoint: ${sub.endpoint.substring(0, 80)}...`);
        const response = await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        }, payload, {
          TTL: 86400,
          urgency: "high",
        });

        const responseText = typeof response.body === "string" ? response.body : "";
        console.log(`Push response for ${sub.id}: status=${response.statusCode}, body=${responseText}`);

        if (response.statusCode === 201 || response.statusCode === 200) {
          sent++;
          deliveredUserIds.add(sub.user_id);
        } else if (response.statusCode === 404 || response.statusCode === 410) {
          // Subscription expired, remove it
          await adminClient
            .from("push_subscriptions")
            .delete()
            .eq("id", sub.id);
          failed++;
        } else {
          console.error(`Push failed for ${sub.id}: ${response.statusCode} ${responseText}`);
          failed++;
        }
      } catch (err) {
        const statusCode = typeof err === "object" && err && "statusCode" in err
          ? Number((err as { statusCode: number }).statusCode)
          : null;
        const body = typeof err === "object" && err && "body" in err
          ? String((err as { body?: string }).body ?? "")
          : "";

        if (statusCode === 404 || statusCode === 410) {
          await adminClient.from("push_subscriptions").delete().eq("id", sub.id);
        }

        console.error(`Push error for ${sub.id}:`, err, body);
        failed++;
      }
    }

    // Log dedupe entries for users who received it (best-effort)
    if (dedupeKey) {
      try {
        const rows = [...deliveredUserIds].map((uid) => ({
          user_id: uid,
          category: category || 'announcements',
          dedupe_key: dedupeKey,
        }));
        if (rows.length > 0) {
          await adminClient.from('push_send_log').upsert(rows, { onConflict: 'user_id,dedupe_key', ignoreDuplicates: true });
        }
      } catch (e) {
        console.error('push_send_log insert failed:', e);
      }
    }

    return new Response(JSON.stringify({ sent, failed, total: subscriptions.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
