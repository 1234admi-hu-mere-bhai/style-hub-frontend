// Server-side Cash on Delivery order creation. The client only sends
// product_id + qty + size/color + address + coupon_code. All prices, shipping
// and COD fees are recomputed from the database via priceCart().
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { priceCart, PriceCartError } from "../_shared/price-cart.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) return json({ error: 'Unauthorized' }, 401);
    const userId = claimsData.claims.sub as string;
    const userEmail = (claimsData.claims.email as string) || '';

    const body = await req.json().catch(() => ({}));
    const { items, shipping_address, coupon_code } = body || {};

    if (!shipping_address || typeof shipping_address !== 'object') {
      return json({ error: 'shipping_address is required' }, 400);
    }
    if (!shipping_address.pincode || !/^\d{6}$/.test(String(shipping_address.pincode))) {
      return json({ error: 'Valid pincode is required' }, 400);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    let priced;
    try {
      priced = await priceCart(admin, {
        items,
        coupon_code: coupon_code || null,
        shipping_address: { state: shipping_address.state, pincode: shipping_address.pincode },
        payment_method: 'cod',
      });
    } catch (e) {
      if (e instanceof PriceCartError) return json({ error: e.message }, e.status);
      throw e;
    }

    // Generate order number (OD + 13-digit ts + 5 random)
    const orderNumber = `OD${Date.now().toString().padStart(13, '0')}${Math.floor(10000 + Math.random() * 90000)}`;

    const { data: order, error: orderError } = await admin.from('orders').insert([{
      user_id: userId,
      order_number: orderNumber,
      status: 'placed',
      payment_method: 'Cash on Delivery',
      payment_status: 'cod_pending',
      payment_id: null,
      subtotal: priced.subtotal,
      shipping_cost: priced.shipping_cost,
      cod_fee: priced.cod_fee,
      total: priced.total,
      shipping_address,
    }]).select().single();

    if (orderError || !order) {
      console.error('COD order insert failed:', orderError);
      return json({ error: 'Failed to create order' }, 500);
    }

    const orderItems = priced.items.map((it) => ({
      order_id: order.id,
      product_id: it.product_id,
      product_name: it.product_name,
      price: it.price,
      quantity: it.quantity,
      size: it.size,
      color: it.color,
      image: it.image,
    }));
    const { error: itemsErr } = await admin.from('order_items').insert(orderItems);
    if (itemsErr) {
      console.error('COD order_items insert failed:', itemsErr);
      return json({ error: 'Failed to create order items' }, 500);
    }

    // Best-effort notification + invoice
    try {
      const maskedOrder = `••••${orderNumber.slice(-4)}`;
      await admin.from('notifications').insert({
        user_id: userId,
        title: 'Order Placed',
        message: `Your COD order ${maskedOrder} (₹${order.total}) has been confirmed.`,
        type: 'success',
      });
    } catch (e) { console.error('notif insert failed', e); }

    return json({
      success: true,
      order: { ...order, order_number: orderNumber },
      priced: {
        subtotal: priced.subtotal,
        coupon_discount: priced.coupon_discount,
        shipping_cost: priced.shipping_cost,
        cod_fee: priced.cod_fee,
        total: priced.total,
      },
    });
  } catch (err) {
    console.error('create-cod-order error:', err);
    return json({ error: 'Internal error' }, 500);
  }
});
