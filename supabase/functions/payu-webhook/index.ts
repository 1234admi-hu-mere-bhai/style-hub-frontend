// PayU server-to-server webhook (called via surl/furl POST from PayU).
// Creates the order from the persisted pending_payment record so that orders
// are saved even if the user's browser session is lost during the redirect.
//
// IMPORTANT: verify_jwt = false in supabase/config.toml — PayU does not
// send a Supabase auth token. Security comes from validating the PayU hash.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

async function sha512Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-512', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status') || 'success';

    // PayU posts form-urlencoded data
    let params: Record<string, string> = {};
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await req.text();
      params = Object.fromEntries(new URLSearchParams(text));
    } else if (contentType.includes('application/json')) {
      params = await req.json();
    } else {
      const text = await req.text();
      try { params = Object.fromEntries(new URLSearchParams(text)); } catch { /* ignore */ }
    }

    const txnid = params.txnid;
    const payuStatus = params.status; // 'success' | 'failure' | 'usercancel'
    const mihpayid = params.mihpayid;
    const amount = params.amount;
    const productinfo = params.productinfo;
    const firstname = params.firstname;
    const email = params.email;
    const receivedHash = params.hash;

    console.log('PayU webhook:', { txnid, payuStatus, mihpayid, amount });

    const origin = req.headers.get('origin') || 'https://muffigoutapparelhub.com';
    const baseRedirect = origin.includes('localhost') || origin.includes('lovable')
      ? `${origin}/payu-callback`
      : 'https://muffigoutapparelhub.com/payu-callback';

    if (!txnid) {
      return Response.redirect(`${baseRedirect}?status=failure`, 303);
    }

    const merchantKey = (Deno.env.get('PAYU_MERCHANT_KEY') || '').trim();
    const merchantSalt = (Deno.env.get('PAYU_MERCHANT_SALT') || '').trim();

    // Validate response hash from PayU — REQUIRED (never skip).
    // Reverse hash formula: sha512(salt|status|||||||||||email|firstname|productinfo|amount|txnid|key)
    if (!receivedHash || !payuStatus) {
      console.error('Missing hash or status on payu-webhook call for txnid', txnid);
      return Response.redirect(`${baseRedirect}?status=failure`, 303);
    }
    const reverseHash = `${merchantSalt}|${payuStatus}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${merchantKey}`;
    const computed = await sha512Hex(reverseHash);
    if (computed.toLowerCase() !== receivedHash.toLowerCase()) {
      console.error('Hash mismatch for txnid', txnid);
      return Response.redirect(`${baseRedirect}?status=failure`, 303);
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Look up the pending payment
    const { data: pending } = await adminClient
      .from('pending_payments')
      .select('*')
      .eq('txnid', txnid)
      .maybeSingle();

    if (!pending) {
      console.warn('No pending_payment for txnid', txnid);
      return Response.redirect(`${baseRedirect}?status=${payuStatus === 'success' ? 'success' : 'failure'}&txnid=${txnid}`, 303);
    }

    if (status === 'cancel' || payuStatus === 'usercancel') {
      await adminClient.from('pending_payments').update({ status: 'cancelled' }).eq('txnid', txnid);
      return Response.redirect(`${baseRedirect}?status=cancel&txnid=${txnid}`, 303);
    }

    if (payuStatus !== 'success') {
      await adminClient.from('pending_payments').update({ status: 'failed' }).eq('txnid', txnid);
      return Response.redirect(`${baseRedirect}?status=failure&txnid=${txnid}`, 303);
    }

    // Check if order already created
    if (pending.order_id) {
      return Response.redirect(`${baseRedirect}?status=success&txnid=${txnid}`, 303);
    }

    // ===== WALLET TOP-UP BRANCH =====
    if (pending.is_wallet_topup) {
      const topupAmount = Number(pending.total);
      const bonus = Number(pending.topup_bonus || 0);
      try {
        // Credit the principal
        await adminClient.rpc('adjust_wallet_balance', {
          _user_id: pending.user_id,
          _amount: topupAmount,
          _type: 'topup',
          _reference_type: 'payu',
          _reference_id: mihpayid || txnid,
          _description: `Wallet top-up via PayU`,
        });
        // Credit the bonus (separate transaction for transparency)
        if (bonus > 0) {
          await adminClient.rpc('adjust_wallet_balance', {
            _user_id: pending.user_id,
            _amount: bonus,
            _type: 'topup_bonus',
            _reference_type: 'payu',
            _reference_id: mihpayid || txnid,
            _description: `Bonus on ₹${topupAmount} top-up`,
          });
        }
        await adminClient.from('pending_payments').update({ status: 'completed' }).eq('txnid', txnid);

        // Notify user
        await adminClient.from('notifications').insert({
          user_id: pending.user_id,
          title: '💰 Wallet Top-up Successful',
          message: `₹${topupAmount.toLocaleString('en-IN')}${bonus > 0 ? ` + ₹${bonus} bonus` : ''} added to your wallet.`,
          type: 'success',
        });
        try {
          await adminClient.functions.invoke('send-push', {
            body: {
              userId: pending.user_id,
              title: '💰 Wallet Top-up Successful',
              message: `₹${topupAmount + bonus} credited to your wallet.`,
              url: '/wallet',
              tag: `topup-${txnid}`,
              category: 'announcements',
              dedupeKey: `topup-${txnid}`,
            },
          });
        } catch (e) { console.error('topup push failed', e); }
      } catch (e) {
        console.error('Wallet credit failed:', e);
        return Response.redirect(`${baseRedirect}?status=failure&txnid=${txnid}&type=wallet`, 303);
      }
      return Response.redirect(`${baseRedirect}?status=success&txnid=${txnid}&type=wallet`, 303);
    }
    // ===== END WALLET TOP-UP BRANCH =====


    // Create the order
    // Format: OD + 13-digit timestamp + 5 random digits (e.g. OD337282733413795100)
    const orderNumber = `OD${Date.now().toString().padStart(13, '0')}${Math.floor(10000 + Math.random() * 90000)}`;
    const walletPortion = Number(pending.wallet_amount_used || 0);
    const payuPortion = Math.max(0, Number(pending.total) - walletPortion);

    // Debit wallet portion (atomic; will throw if insufficient)
    if (walletPortion > 0) {
      try {
        await adminClient.rpc('adjust_wallet_balance', {
          _user_id: pending.user_id,
          _amount: -walletPortion,
          _type: 'purchase',
          _reference_type: 'order_pending',
          _reference_id: txnid,
          _description: `Wallet portion of order (txn ${txnid})`,
        });
      } catch (e) {
        console.error('Wallet debit failed for txnid', txnid, e);
        return Response.redirect(`${baseRedirect}?status=failure&txnid=${txnid}&reason=wallet`, 303);
      }
    }

    const { data: order, error: orderError } = await adminClient.from('orders').insert([{
      user_id: pending.user_id,
      order_number: orderNumber,
      status: 'placed',
      payment_method: walletPortion > 0 ? 'Wallet + Online (PayU)' : 'Online Payment (PayU)',
      payment_status: 'paid',
      payment_id: mihpayid || txnid,
      subtotal: pending.subtotal,
      shipping_cost: pending.shipping_cost,
      total: pending.total,
      wallet_amount_used: walletPortion,
      payu_amount: payuPortion,
      shipping_address: pending.shipping_address,
    }]).select().single();

    if (orderError || !order) {
      console.error('Order creation failed:', orderError);
      // Refund the wallet portion we just debited
      if (walletPortion > 0) {
        try {
          await adminClient.rpc('adjust_wallet_balance', {
            _user_id: pending.user_id,
            _amount: walletPortion,
            _type: 'refund',
            _reference_type: 'order_pending',
            _reference_id: txnid,
            _description: `Reversal — order creation failed (txn ${txnid})`,
          });
        } catch (e) { console.error('wallet reversal failed', e); }
      }
      return Response.redirect(`${baseRedirect}?status=failure&txnid=${txnid}`, 303);
    }

    const orderItems = (pending.items as any[]).map((it: any) => ({
      order_id: order.id,
      product_id: it.product_id,
      product_name: it.product_name,
      price: it.price,
      quantity: it.quantity,
      size: it.size || null,
      color: it.color || null,
      image: it.image || null,
    }));
    await adminClient.from('order_items').insert(orderItems);

    await adminClient.from('pending_payments').update({
      status: 'completed',
      order_id: order.id,
    }).eq('txnid', txnid);

    // Generate invoice (best-effort)
    try {
      await adminClient.functions.invoke('generate-invoice', { body: { orderId: order.id } });
    } catch (e) {
      console.error('Invoice generation failed:', e);
    }

    // Notify user (mask order id for privacy on lock screens / previews)
    const maskedOrder = `••••${orderNumber.slice(-4)}`;
    await adminClient.from('notifications').insert({
      user_id: pending.user_id,
      title: 'Order Placed',
      message: `Your order ${maskedOrder} (₹${order.total}) has been confirmed. We'll notify you when it ships.`,
      type: 'success',
    });

    // 🔔 Push notification: Order placed
    try {
      await adminClient.functions.invoke('send-push', {
        body: {
          userId: pending.user_id,
          title: '✅ Order Placed Successfully',
          message: `Order ${maskedOrder} confirmed (₹${order.total}). Track it anytime in your account.`,
          url: `/track-order?id=${orderNumber}`,
          tag: `order-placed-${order.id}`,
          category: 'orders',
          dedupeKey: `order-placed-${order.id}`,
        },
      });
    } catch (e) {
      console.error('order placed push failed:', e);
    }

    // Send order confirmation email (best-effort)
    try {
      const recipientEmail = (pending.user_email || email || '').toString().trim();
      if (recipientEmail) {
        const { data: prof } = await adminClient
          .from('profiles')
          .select('first_name')
          .eq('id', pending.user_id)
          .maybeSingle();
        const itemsArr = Array.isArray(pending.items) ? (pending.items as any[]) : [];
        const itemCount = itemsArr.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
        const emailItems = itemsArr.map((it: any) => ({
          name: it.product_name || it.name || 'Item',
          image: it.image || undefined,
          size: it.size || undefined,
          color: it.color || undefined,
          quantity: Number(it.quantity) || 1,
          price: Number(it.price) || 0,
          originalPrice: it.original_price ? Number(it.original_price) : undefined,
        }));
        const orderDate = new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', {
          weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
        });
        const eta = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
          weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
        });
        await adminClient.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'order-placed',
            recipientEmail,
            idempotencyKey: `order-placed-${order.id}`,
            templateData: {
              customerName: prof?.first_name || firstname || '',
              orderNumber,
              orderTotal: order.total,
              subtotal: order.subtotal,
              shippingCost: order.shipping_cost,
              paymentMethod: 'Online Payment (PayU)',
              itemCount,
              items: emailItems,
              orderDate,
              estimatedDelivery: eta,
              shippingAddress: pending.shipping_address,
            },
          },
        });

        // Send tax invoice email (best-effort, separate template)
        try {
          const invoiceItems = itemsArr.map((it: any) => ({
            name: it.product_name || it.name || 'Item',
            size: it.size || undefined,
            color: it.color || undefined,
            quantity: Number(it.quantity) || 1,
            price: Number(it.price) || 0,
          }));
          await adminClient.functions.invoke('send-transactional-email', {
            body: {
              templateName: 'order-invoice',
              recipientEmail,
              idempotencyKey: `order-invoice-${order.id}`,
              templateData: {
                customerName: prof?.first_name || firstname || '',
                orderNumber,
                invoiceNumber: `INV-${orderNumber.slice(-8)}`,
                orderDate,
                paymentMethod: 'Online Payment (PayU)',
                paymentId: mihpayid || txnid,
                subtotal: order.subtotal,
                shippingCost: order.shipping_cost,
                total: order.total,
                items: invoiceItems,
                shippingAddress: pending.shipping_address,
              },
            },
          });
        } catch (e) {
          console.error('order-invoice email send failed:', e);
        }
      }
    } catch (e) {
      console.error('order-placed email send failed:', e);
    }

    return Response.redirect(`${baseRedirect}?status=success&txnid=${txnid}&order=${orderNumber}`, 303);
  } catch (err) {
    console.error('payu-webhook error:', err);
    return Response.redirect('https://muffigoutapparelhub.com/payu-callback?status=failure', 303);
  }
});
