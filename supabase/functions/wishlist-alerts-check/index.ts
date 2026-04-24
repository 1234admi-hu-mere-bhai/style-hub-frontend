// Cron-triggered: scans all wishlist_items, compares last_seen_price vs current price,
// and fires a push when an item drops in price OR comes back in stock.
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

    const { data: items } = await adminClient
      .from('wishlist_items')
      .select('id, user_id, product_id, last_seen_price, last_seen_in_stock');

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ message: 'No wishlist items', sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const productIds = [...new Set(items.map((i: any) => i.product_id))];
    const { data: products } = await adminClient
      .from('products')
      .select('id, name, price, in_stock')
      .in('id', productIds);
    const productMap = new Map<string, any>((products || []).map((p: any) => [p.id, p]));

    let priceDrops = 0;
    let restocks = 0;

    for (const item of items as any[]) {
      const product = productMap.get(item.product_id);
      if (!product) continue;

      const currentPrice = Number(product.price);
      const lastPrice = Number(item.last_seen_price);
      const inStockNow = !!product.in_stock;
      const wasInStock = !!item.last_seen_in_stock;

      // Price drop alert
      if (currentPrice < lastPrice && currentPrice > 0) {
        const savings = Math.round(lastPrice - currentPrice);
        try {
          await adminClient.functions.invoke('send-push', {
            body: {
              userId: item.user_id,
              title: `💸 Price dropped on ${product.name}`,
              message: `Now ₹${currentPrice.toLocaleString('en-IN')} (save ₹${savings.toLocaleString('en-IN')})`,
              url: `/product/${product.id}`,
              tag: `pricedrop-${product.id}`,
              category: 'wishlist',
              dedupeKey: `pricedrop-${item.user_id}-${product.id}-${currentPrice}`,
            },
          });
          priceDrops++;
        } catch (e) {
          console.error('price drop push failed:', e);
        }
      }

      // Back-in-stock alert
      if (inStockNow && !wasInStock) {
        try {
          await adminClient.functions.invoke('send-push', {
            body: {
              userId: item.user_id,
              title: `🎉 Back in stock: ${product.name}`,
              message: 'Grab it before it sells out again!',
              url: `/product/${product.id}`,
              tag: `restock-${product.id}`,
              category: 'wishlist',
              dedupeKey: `restock-${item.user_id}-${product.id}-${Date.now()}`,
            },
          });
          restocks++;
        } catch (e) {
          console.error('restock push failed:', e);
        }
      }

      // Update snapshot
      if (currentPrice !== lastPrice || inStockNow !== wasInStock) {
        await adminClient
          .from('wishlist_items')
          .update({ last_seen_price: currentPrice, last_seen_in_stock: inStockNow })
          .eq('id', item.id);
      }
    }

    return new Response(JSON.stringify({
      message: `Sent ${priceDrops} price drops and ${restocks} restock alerts`,
      priceDrops, restocks, total: items.length,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
