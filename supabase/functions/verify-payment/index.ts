import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userId = claimsData.claims.sub;
    const { orderId, txnid, mihpayid, payuStatus } = await req.json();

    if (!orderId || !txnid) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify the order belongs to this user
    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .select('id, user_id, total, payment_status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (order.user_id !== userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (order.payment_status === 'paid') {
      return new Response(JSON.stringify({ success: true, message: 'Already verified' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Verify with PayU API
    const merchantKey = (Deno.env.get('PAYU_MERCHANT_KEY') || '').trim();
    const merchantSalt = (Deno.env.get('PAYU_MERCHANT_SALT') || '').trim();

    if (!merchantKey || !merchantSalt) {
      return new Response(JSON.stringify({ error: 'Payment configuration missing' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // PayU verify_payment API - compute command hash
    const command = 'verify_payment';
    const hashString = `${merchantKey}|${command}|${txnid}|${merchantSalt}`;
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-512', encoder.encode(hashString));
    const hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    const verifyResponse = await fetch('https://info.payu.in/merchant/postservice?form=2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        key: merchantKey,
        command,
        var1: txnid,
        hash,
      }),
    });

    const verifyData = await verifyResponse.json();
    console.log('PayU verify response:', JSON.stringify(verifyData));

    const txnDetails = verifyData?.transaction_details?.[txnid];
    if (txnDetails && txnDetails.status === 'success' && parseFloat(txnDetails.amt) === parseFloat(String(order.total))) {
      // Payment verified - update order
      const { error: updateError } = await adminClient
        .from('orders')
        .update({
          payment_status: 'paid',
          payment_id: txnDetails.mihpayid || mihpayid || txnid,
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('Failed to update order payment status:', updateError);
        return new Response(JSON.stringify({ error: 'Failed to update order' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Generate invoice
      try {
        await adminClient.functions.invoke('generate-invoice', { body: { orderId } });
      } catch (e) {
        console.error('Invoice generation failed:', e);
      }

      return new Response(JSON.stringify({ success: true, verified: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } else {
      return new Response(JSON.stringify({ success: false, verified: false, message: 'Payment verification failed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  } catch (err) {
    console.error('verify-payment error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
