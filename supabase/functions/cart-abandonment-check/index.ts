// Cron-triggered: scans cart_snapshots inactive >24h (and not reminded in last 5 days),
// fires a single push reminder per user. Only fires for users with cart_reminders=ON.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const reminderCutoff = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

    const { data: carts } = await adminClient
      .from('cart_snapshots')
      .select('*')
      .gt('item_count', 0)
      .lt('updated_at', cutoff)
      .or(`last_reminder_sent_at.is.null,last_reminder_sent_at.lt.${reminderCutoff}`)
      .limit(200);

    if (!carts || carts.length === 0) {
      return new Response(JSON.stringify({ message: 'No abandoned carts', sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let sent = 0;
    for (const cart of carts) {
      try {
        const items = (cart.items as any[]) || [];
        const first = items[0];
        const itemName = first?.name || 'your item';
        const more = items.length > 1 ? ` and ${items.length - 1} more` : '';
        const title = '🛒 You left items in your cart';
        const message = `${itemName}${more} is waiting for you. Complete your order now!`;

        await adminClient.functions.invoke('send-push', {
          body: {
            userId: cart.user_id,
            title,
            message,
            url: '/checkout',
            tag: `cart-${cart.user_id}`,
            category: 'cart_reminders',
            dedupeKey: `cart-abandon-${cart.user_id}-${cart.updated_at}`,
          },
        });

        await adminClient
          .from('cart_snapshots')
          .update({ last_reminder_sent_at: new Date().toISOString() })
          .eq('user_id', cart.user_id);

        sent++;
      } catch (e) {
        console.error(`cart reminder failed for ${cart.user_id}:`, e);
      }
    }

    return new Response(JSON.stringify({ message: `Sent ${sent} reminders`, sent, total: carts.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
