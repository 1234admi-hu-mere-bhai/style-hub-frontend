// Wallet-only order: user pays the entire order from their wallet balance.
// Used at checkout when wallet balance >= total. Atomically debits the wallet
// and creates the order in a single server call.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { priceCart, PriceCartError } from "../_shared/price-cart.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: cErr } = await userClient.auth.getClaims(token);
    if (cErr || !claims?.claims) return json({ error: 'Unauthorized' }, 401);
    const userId = claims.claims.sub as string;
    const userEmail = (claims.claims.email as string) || '';

    const body = await req.json().catch(() => ({}));
    const { items, shipping_address, coupon_code } = body || {};
    if (!shipping_address?.pincode || !/^\d{6}$/.test(String(shipping_address.pincode))) {
      return json({ error: 'Valid pincode is required' }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE);

    let priced;
    try {
      priced = await priceCart(admin, {
        items,
        coupon_code: coupon_code || null,
        shipping_address: { state: shipping_address.state, pincode: shipping_address.pincode },
        payment_method: 'online',
      });
    } catch (e) {
      if (e instanceof PriceCartError) return json({ error: e.message }, e.status);
      throw e;
    }

    // Check wallet has enough
    const { data: wallet } = await admin.from('wallets').select('balance').eq('user_id', userId).maybeSingle();
    const bal = Number(wallet?.balance || 0);
    if (bal < priced.total) {
      return json({ error: `Insufficient wallet balance (₹${bal.toFixed(2)}). Need ₹${priced.total.toFixed(2)}.` }, 400);
    }

    const orderNumber = `OD${Date.now().toString().padStart(13, '0')}${Math.floor(10000 + Math.random() * 90000)}`;

    const { data: order, error: orderErr } = await admin.from('orders').insert([{
      user_id: userId,
      order_number: orderNumber,
      status: 'placed',
      payment_method: 'Wallet',
      payment_status: 'paid',
      payment_id: `WAL-${orderNumber}`,
      subtotal: priced.subtotal,
      shipping_cost: priced.shipping_cost,
      total: priced.total,
      wallet_amount_used: priced.total,
      payu_amount: 0,
      shipping_address,
    }]).select().single();

    if (orderErr || !order) {
      console.error('wallet order insert failed', orderErr);
      return json({ error: 'Failed to create order' }, 500);
    }

    // Debit wallet (atomic via RPC; will throw if insufficient)
    try {
      await admin.rpc('adjust_wallet_balance', {
        _user_id: userId,
        _amount: -priced.total,
        _type: 'purchase',
        _reference_type: 'order',
        _reference_id: order.id,
        _description: `Paid for order ${orderNumber}`,
      });
    } catch (e) {
      console.error('wallet debit failed; rolling back order', e);
      await admin.from('orders').delete().eq('id', order.id);
      return json({ error: 'Wallet debit failed. Please try again.' }, 500);
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
    await admin.from('order_items').insert(orderItems);

    try {
      const maskedOrder = `••••${orderNumber.slice(-4)}`;
      await admin.from('notifications').insert({
        user_id: userId,
        title: 'Order Placed',
        message: `Order ${maskedOrder} (₹${order.total}) paid from your wallet.`,
        type: 'success',
      });
      await admin.functions.invoke('send-push', {
        body: {
          userId,
          title: '✅ Order Placed',
          message: `Order ${maskedOrder} paid via Wallet (₹${order.total}).`,
          url: `/track-order?id=${orderNumber}`,
          tag: `order-placed-${order.id}`,
          category: 'orders',
          dedupeKey: `order-placed-${order.id}`,
        },
      });
    } catch (e) { console.error('notify failed', e); }

    // 📧 Order confirmation email + tax invoice (best-effort, mirrors PayU flow)
    try {
      if (userEmail) {
        const { data: prof } = await admin
          .from('profiles').select('first_name').eq('id', userId).maybeSingle();
        const emailItems = priced.items.map((it: any) => ({
          name: it.product_name || 'Item',
          image: it.image || undefined,
          size: it.size || undefined,
          color: it.color || undefined,
          quantity: Number(it.quantity) || 1,
          price: Number(it.price) || 0,
          originalPrice: it.original_price ? Number(it.original_price) : undefined,
        }));
        const itemCount = emailItems.reduce((a, i) => a + i.quantity, 0);
        const orderDate = new Date().toLocaleDateString('en-IN', {
          weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
        });
        const eta = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
          weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
        });
        await admin.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'order-placed',
            recipientEmail: userEmail,
            idempotencyKey: `order-placed-${order.id}`,
            templateData: {
              customerName: prof?.first_name || '',
              orderNumber,
              orderTotal: order.total,
              subtotal: order.subtotal,
              shippingCost: order.shipping_cost,
              paymentMethod: 'MG Wallet',
              itemCount,
              items: emailItems,
              orderDate,
              estimatedDelivery: eta,
              shippingAddress: shipping_address,
            },
          },
        });
        try {
          await admin.functions.invoke('send-transactional-email', {
            body: {
              templateName: 'order-invoice',
              recipientEmail: userEmail,
              idempotencyKey: `order-invoice-${order.id}`,
              templateData: {
                customerName: prof?.first_name || '',
                orderNumber,
                invoiceNumber: `INV-${orderNumber.slice(-8)}`,
                orderDate,
                paymentMethod: 'MG Wallet',
                paymentId: order.payment_id,
                subtotal: order.subtotal,
                shippingCost: order.shipping_cost,
                total: order.total,
                items: emailItems.map((it: any) => ({
                  name: it.name, size: it.size, color: it.color,
                  quantity: it.quantity, price: it.price,
                })),
                shippingAddress: shipping_address,
              },
            },
          });
        } catch (e) { console.error('wallet order-invoice email failed', e); }
      }
    } catch (e) { console.error('wallet order-placed email failed', e); }

    try {
      await admin.functions.invoke('generate-invoice', { body: { orderId: order.id } });
    } catch (_) { /* best effort */ }

    return json({ success: true, order: { ...order, order_number: orderNumber } });
  } catch (e) {
    console.error('create-wallet-order error', e);
    return json({ error: 'Internal error' }, 500);
  }
});
