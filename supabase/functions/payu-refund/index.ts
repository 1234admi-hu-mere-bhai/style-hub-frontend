// Auto-issue PayU refund to the original payment source.
// Triggered when an order's status flips to "picked_up" (after a return is approved
// and the courier has collected the package). Idempotent — will not re-refund.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const PAYU_REFUND_ENDPOINT = 'https://info.payu.in/merchant/postservice.php?form=2';

async function sha512Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-512', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const PAYU_KEY = Deno.env.get('PAYU_MERCHANT_KEY');
  const PAYU_SALT = Deno.env.get('PAYU_MERCHANT_SALT');

  if (!PAYU_KEY || !PAYU_SALT) {
    return new Response(
      JSON.stringify({ error: 'PayU credentials not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body = await req.json().catch(() => ({}));
    const orderId = body.orderId as string | undefined;
    if (!orderId) {
      return new Response(JSON.stringify({ error: 'orderId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: order, error: fetchErr } = await admin
      .from('orders')
      .select('id, order_number, user_id, payment_id, payment_method, payment_status, refund_amount, total, status, refund_processed_at')
      .eq('id', orderId)
      .maybeSingle();

    if (fetchErr || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Idempotency: skip if already refunded
    if (order.refund_processed_at) {
      return new Response(
        JSON.stringify({ success: true, message: 'Already refunded', orderId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Only refund prepaid PayU orders. COD orders are settled offline.
    const isPrepaid = (order.payment_method || '').toLowerCase().includes('online') ||
      (order.payment_method || '').toLowerCase().includes('payu') ||
      (order.payment_status === 'paid');
    if (!isPrepaid) {
      // Mark as refund_processed without an API call (cash refund handled offline)
      await admin
        .from('orders')
        .update({
          status: 'refund_processed',
          refund_processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);
      // Send refund email (best-effort)
      await sendRefundEmail(admin, order, Number(order.refund_amount ?? order.total ?? 0), order.refund_method || 'bank_transfer');
      return new Response(
        JSON.stringify({ success: true, message: 'COD order — offline refund recorded', orderId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!order.payment_id) {
      return new Response(
        JSON.stringify({ error: 'Missing PayU payment_id; cannot refund' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const refundAmount = Number(order.refund_amount ?? order.total ?? 0);
    if (!(refundAmount > 0)) {
      return new Response(
        JSON.stringify({ error: 'Invalid refund amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // PayU "cancel_refund_transaction" command
    // Hash formula (PayUBiz refund): sha512(key|command|var1|salt)
    const command = 'cancel_refund_transaction';
    const tokenId = `${order.order_number}-R${Date.now()}`; // unique refund reference
    const var1 = order.payment_id; // mihpayid from initial txn
    const hashInput = `${PAYU_KEY}|${command}|${var1}|${PAYU_SALT}`;
    const hash = await sha512Hex(hashInput);

    const params = new URLSearchParams({
      key: PAYU_KEY,
      command,
      hash,
      var1,
      var2: tokenId,
      var3: refundAmount.toFixed(2),
    });

    const payuRes = await fetch(PAYU_REFUND_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const payuText = await payuRes.text();
    let payuJson: any = null;
    try { payuJson = JSON.parse(payuText); } catch { /* PayU sometimes returns text */ }

    const status = payuJson?.status;
    const success = status === 1 || status === '1' || payuJson?.msg?.toLowerCase?.().includes('refund');

    if (!success) {
      console.error('PayU refund failed:', payuText);
      return new Response(
        JSON.stringify({ error: 'PayU refund failed', detail: payuJson || payuText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Update order: mark refund processed
    await admin
      .from('orders')
      .update({
        status: 'refund_processed',
        refund_amount: refundAmount,
        refund_processed_at: new Date().toISOString(),
        refund_method: 'source',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    // Update returns row if any
    await admin
      .from('returns')
      .update({
        status: 'refunded',
        payu_refund_id: payuJson?.request_id ? String(payuJson.request_id) : tokenId,
        refunded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', orderId);

    // Notify user
    if (order.user_id) {
      try {
        const maskedOrder = `••••${String(order.order_number).slice(-4)}`;
        await admin.from('notifications').insert({
          title: 'Refund Processed 💸',
          message: `Your refund of ₹${refundAmount.toLocaleString('en-IN')} for order ${maskedOrder} has been issued to your original payment method. It should reflect in 5-7 business days.`,
          type: 'order',
          user_id: order.user_id,
        });
      } catch (e) {
        console.error('notification insert failed', e);
      }
      try {
        await admin.functions.invoke('send-push', {
          body: {
            userId: order.user_id,
            title: 'Refund Processed 💸',
            message: `₹${refundAmount.toLocaleString('en-IN')} refunded to your original payment method.`,
            url: '/track-order',
            tag: `refund-${order.id}`,
          },
        });
      } catch (e) {
        console.error('push invoke failed', e);
      }
    }

    // Send refund processed email (best-effort)
    await sendRefundEmail(admin, order, refundAmount, 'source');

    return new Response(
      JSON.stringify({ success: true, refundAmount, payuResponse: payuJson }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('payu-refund error', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

async function sendRefundEmail(
  admin: any,
  order: { id: string; user_id: string | null; order_number: string },
  refundAmount: number,
  refundMethod: string,
) {
  if (!order.user_id) return;
  try {
    const { data: au } = await admin.auth.admin.getUserById(order.user_id);
    const recipientEmail = au?.user?.email || '';
    if (!recipientEmail) return;
    const { data: prof } = await admin
      .from('profiles')
      .select('first_name')
      .eq('id', order.user_id)
      .maybeSingle();
    await admin.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'refund-processed',
        recipientEmail,
        idempotencyKey: `refund-processed-${order.id}`,
        templateData: {
          customerName: prof?.first_name || '',
          orderNumber: order.order_number,
          refundAmount,
          refundMethod,
        },
      },
    });
  } catch (e) {
    console.error('refund email failed:', e);
  }
}
