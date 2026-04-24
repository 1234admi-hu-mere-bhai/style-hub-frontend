// Admin-only: composes & broadcasts a push campaign to all subscribed users.
// Saves a record in push_campaigns for history and reporting.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const ADMIN_EMAILS = ['muffigout@gmail.com', 'otw2003@gmail.com', 'kaliasgar776@gmail.com'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const anonClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await anonClient.auth.getUser();
    if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const { action } = body;

    // Stats: total push subscribers
    if (action === 'stats') {
      const { count: subscriberCount } = await adminClient
        .from('push_subscriptions')
        .select('user_id', { count: 'exact', head: true });
      const { count: uniqueUsers } = await adminClient
        .rpc('count_distinct_push_users' as any).single().then(() => ({ count: 0 } as any))
        .catch(() => ({ count: 0 } as any));
      return new Response(JSON.stringify({
        subscriberCount: subscriberCount || 0,
        uniqueUsers: uniqueUsers || 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // List campaigns
    if (action === 'list') {
      const { data, error } = await adminClient
        .from('push_campaigns')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send a new campaign
    if (action === 'send') {
      const { title, message, url, category } = body;
      if (!title || !message) {
        return new Response(JSON.stringify({ error: 'title and message required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Insert campaign row
      const { data: campaign, error: insertError } = await adminClient
        .from('push_campaigns')
        .insert({
          title: String(title).slice(0, 200),
          message: String(message).slice(0, 500),
          url: url ? String(url).slice(0, 500) : null,
          category: category || 'announcements',
          audience: 'all',
          status: 'sending',
          created_by: user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Broadcast (no userId = everyone)
      const { data: pushResult, error: pushError } = await adminClient.functions.invoke('send-push', {
        body: {
          title,
          message,
          url: url || '/notifications',
          tag: `campaign-${campaign.id}`,
          category: category || 'announcements',
          dedupeKey: `campaign-${campaign.id}`,
        },
      });

      const sent = pushResult?.sent || 0;

      // Also create in-app notifications (bell icon) for every subscribed user.
      // This is what powers the live realtime bell update via the `notifications` table.
      try {
        const { data: subs } = await adminClient
          .from('push_subscriptions')
          .select('user_id');
        const uniqueUserIds = Array.from(new Set((subs || []).map((s: any) => s.user_id).filter(Boolean)));
        if (uniqueUserIds.length > 0) {
          const rows = uniqueUserIds.map((uid: string) => ({
            user_id: uid,
            title: String(title).slice(0, 200),
            message: String(message).slice(0, 500),
            type: category === 'offers' || category === 'flash_sales' ? 'sale'
                : category === 'announcements' ? 'info'
                : 'info',
            is_read: false,
          }));
          // Insert in chunks of 500 to stay safe
          for (let i = 0; i < rows.length; i += 500) {
            await adminClient.from('notifications').insert(rows.slice(i, i + 500));
          }
        }
      } catch (e) {
        console.error('Failed to create in-app notifications:', e);
      }

      // Update campaign with results
      await adminClient
        .from('push_campaigns')
        .update({
          status: pushError ? 'failed' : 'sent',
          sent_at: new Date().toISOString(),
          recipients_count: sent,
        })
        .eq('id', campaign.id);

      return new Response(JSON.stringify({ success: true, sent, campaignId: campaign.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
