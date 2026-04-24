// Cron-triggered: detects flash sales whose start_time just passed (within last 15min)
// and broadcasts a push to ALL subscribed users with flash_sales=ON.
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

    const now = new Date();
    const fifteenMinAgo = new Date(now.getTime() - 15 * 60 * 1000).toISOString();

    const { data: sales } = await adminClient
      .from('flash_sales')
      .select('*')
      .eq('is_active', true)
      .gte('start_time', fifteenMinAgo)
      .lte('start_time', now.toISOString())
      .gt('end_time', now.toISOString());

    if (!sales || sales.length === 0) {
      return new Response(JSON.stringify({ message: 'No flash sales started recently', sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let totalSent = 0;
    for (const sale of sales as any[]) {
      try {
        const result = await adminClient.functions.invoke('send-push', {
          body: {
            title: `⚡ Flash Sale LIVE — ${sale.title}`,
            message: `${sale.discount_percentage}% off! ${sale.description || 'Limited time only — shop now.'}`,
            url: '/products?flash=true',
            tag: `flashsale-${sale.id}`,
            category: 'flash_sales',
            dedupeKey: `flashsale-broadcast-${sale.id}`,
          },
        });
        totalSent += result.data?.sent || 0;
      } catch (e) {
        console.error(`flash sale broadcast failed for ${sale.id}:`, e);
      }
    }

    return new Response(JSON.stringify({ message: `Broadcast ${totalSent} pushes`, sent: totalSent, sales: sales.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
