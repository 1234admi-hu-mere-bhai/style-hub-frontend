// Mirrors a user's wishlist (currently localStorage) into wishlist_items table
// so background jobs can detect price drops & restocks.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { productIds } = await req.json();
    if (!Array.isArray(productIds)) {
      return new Response(JSON.stringify({ error: 'productIds must be an array' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate UUIDs only
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const cleanIds: string[] = productIds.filter((p: any) => typeof p === 'string' && uuidRe.test(p));

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Fetch current product prices/stock for snapshot
    let priceMap = new Map<string, { price: number; in_stock: boolean }>();
    if (cleanIds.length > 0) {
      const { data: products } = await adminClient
        .from('products')
        .select('id, price, in_stock')
        .in('id', cleanIds);
      for (const p of products || []) {
        priceMap.set(p.id as string, { price: Number(p.price) || 0, in_stock: !!p.in_stock });
      }
    }

    // Delete rows for items the user removed
    await adminClient.from('wishlist_items').delete().eq('user_id', user.id).not('product_id', 'in', `(${cleanIds.length > 0 ? cleanIds.map(i => `"${i}"`).join(',') : '""'})`);

    // Upsert current items (only first add records the snapshot — keep last_seen unchanged)
    for (const productId of cleanIds) {
      const meta = priceMap.get(productId);
      if (!meta) continue;
      const { data: existing } = await adminClient
        .from('wishlist_items')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle();
      if (!existing) {
        await adminClient.from('wishlist_items').insert({
          user_id: user.id,
          product_id: productId,
          last_seen_price: meta.price,
          last_seen_in_stock: meta.in_stock,
        });
      }
    }

    return new Response(JSON.stringify({ success: true, count: cleanIds.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
