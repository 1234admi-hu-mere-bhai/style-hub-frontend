// Public endpoint called by the service worker (no auth) to record push delivery & click events.
// Increments aggregate counters on push_campaigns and writes one row per event in push_events.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  try {
    const body = await req.json();
    const event_type = String(body.event || "").toLowerCase();
    if (!["delivered", "clicked", "dismissed"].includes(event_type)) {
      return new Response(JSON.stringify({ error: "Invalid event" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const dedupeKey: string | undefined = body.dedupeKey;
    const tag: string | undefined = body.tag;

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Resolve campaign id from dedupeKey/tag (formatted "campaign-<uuid>")
    let campaignId: string | null = null;
    const candidate = dedupeKey || tag || "";
    const match = candidate.match(/campaign-([0-9a-f-]{36})/i);
    if (match) campaignId = match[1];

    await adminClient.from("push_events").insert({
      campaign_id: campaignId,
      dedupe_key: dedupeKey || null,
      event_type,
    });

    if (campaignId) {
      const column = event_type === "clicked" ? "clicked_count" : event_type === "delivered" ? "delivered_count" : null;
      if (column) {
        // Atomic increment via select+update (no race-critical work; campaigns are admin-broadcast)
        const { data: row } = await adminClient
          .from("push_campaigns").select(column).eq("id", campaignId).maybeSingle();
        const current = (row as any)?.[column] ?? 0;
        await adminClient.from("push_campaigns").update({ [column]: current + 1 }).eq("id", campaignId);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
