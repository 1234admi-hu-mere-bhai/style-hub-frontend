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
    // Validate auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub as string;
    const userEmail = (claimsData.claims.email as string) || '';

    const body = await req.json();
    const { txnid, amount, productinfo, firstname, email, phone, checkout } = body;

    if (!txnid || !amount || !productinfo || !firstname || !email) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: corsHeaders });
    }

    const merchantKey = (Deno.env.get('PAYU_MERCHANT_KEY') || '').trim();
    const merchantSalt = (Deno.env.get('PAYU_MERCHANT_SALT') || '').trim();

    if (!merchantKey || !merchantSalt) {
      console.error('Missing PAYU_MERCHANT_KEY or PAYU_MERCHANT_SALT');
      return new Response(JSON.stringify({ error: 'Payment configuration missing' }), { status: 500, headers: corsHeaders });
    }

    // Persist checkout payload server-side so we can recover the order
    // even if the user's browser session is lost during the PayU redirect.
    if (checkout && checkout.items && checkout.address) {
      const adminClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );
      const { error: pendingError } = await adminClient.from('pending_payments').upsert({
        txnid,
        user_id: userId,
        user_email: userEmail,
        items: checkout.items,
        subtotal: checkout.subtotal,
        shipping_cost: checkout.shippingCost,
        total: checkout.total,
        shipping_address: checkout.address,
        is_buy_now: !!checkout.isBuyNow,
        status: 'pending',
      }, { onConflict: 'txnid' });
      if (pendingError) {
        console.error('Failed to persist pending_payment:', pendingError);
        // Continue — hash generation shouldn't be blocked
      }
    }

    // PayU hash formula: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt)
    const hashString = `${merchantKey}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${merchantSalt}`;
    
    console.log('Hash input (masked):', `${merchantKey}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||***`);
    console.log('Key length:', merchantKey.length, 'Salt length:', merchantSalt.length);

    const encoder = new TextEncoder();
    const data = encoder.encode(hashString);
    const hashBuffer = await crypto.subtle.digest('SHA-512', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return new Response(JSON.stringify({
      hash,
      key: merchantKey,
      txnid,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('PayU hash error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate hash' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
