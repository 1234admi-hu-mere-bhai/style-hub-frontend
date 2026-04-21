// Admin-only utility to verify a PayU txnid and create the missing order
// for users whose browser session was lost during the PayU redirect.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ADMIN_EMAILS = [
  'muffigout@gmail.com',
  'kaliasgar776@gmail.com',
  'otw2003@gmail.com',
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const callerEmail = (claimsData.claims.email || '').toLowerCase();
    if (!ADMIN_EMAILS.includes(callerEmail)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { txnid, userEmail, items, subtotal, shippingCost, total, shippingAddress } = await req.json();
    if (!txnid) {
      return new Response(JSON.stringify({ error: 'txnid required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const merchantKey = (Deno.env.get('PAYU_MERCHANT_KEY') || '').trim();
    const merchantSalt = (Deno.env.get('PAYU_MERCHANT_SALT') || '').trim();
    if (!merchantKey || !merchantSalt) {
      return new Response(JSON.stringify({ error: 'Payment config missing' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Verify txn with PayU
    const command = 'verify_payment';
    const hashString = `${merchantKey}|${command}|${txnid}|${merchantSalt}`;
    const hashBuffer = await crypto.subtle.digest('SHA-512', new TextEncoder().encode(hashString));
    const hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    const verifyResponse = await fetch('https://info.payu.in/merchant/postservice?form=2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ key: merchantKey, command, var1: txnid, hash }),
    });
    const verifyData = await verifyResponse.json();
    console.log('PayU verify:', JSON.stringify(verifyData));

    const txnDetails = verifyData?.transaction_details?.[txnid];
    if (!txnDetails) {
      return new Response(JSON.stringify({ error: 'Transaction not found at PayU', verifyData }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (txnDetails.status !== 'success') {
      return new Response(JSON.stringify({ error: 'Transaction not successful', txnDetails }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check if order already exists for this txnid
    const { data: existing } = await adminClient.from('orders').select('id, order_number').eq('payment_id', txnid).maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ success: true, alreadyExists: true, order: existing, txnDetails }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // If order data not provided, just return verification
    if (!items || !shippingAddress) {
      return new Response(JSON.stringify({ success: true, verifiedOnly: true, txnDetails, note: 'Provide items + shippingAddress + userEmail to create order' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Look up user by email
    const { data: userList } = await adminClient.auth.admin.listUsers();
    const targetUser = userList?.users.find(u => u.email?.toLowerCase() === userEmail?.toLowerCase());
    if (!targetUser) {
      return new Response(JSON.stringify({ error: 'User not found', userEmail }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const orderNumber = `OD${Date.now().toString().padStart(13, '0')}${Math.floor(10000 + Math.random() * 90000)}`;
    const { data: order, error: orderError } = await adminClient.from('orders').insert([{
      user_id: targetUser.id,
      order_number: orderNumber,
      status: 'placed',
      payment_method: 'Online Payment (PayU)',
      payment_status: 'paid',
      payment_id: txnDetails.mihpayid || txnid,
      subtotal: subtotal ?? parseFloat(txnDetails.amt),
      shipping_cost: shippingCost ?? 0,
      total: total ?? parseFloat(txnDetails.amt),
      shipping_address: shippingAddress,
    }]).select().single();

    if (orderError) {
      return new Response(JSON.stringify({ error: 'Order creation failed', details: orderError }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const orderItems = items.map((it: any) => ({
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

    // Notify user
    await adminClient.from('notifications').insert({
      user_id: targetUser.id,
      title: 'Order Recovered',
      message: `Your order ${orderNumber} (₹${order.total}) has been confirmed and is now visible in your account.`,
      type: 'success',
    });

    return new Response(JSON.stringify({ success: true, order, txnDetails }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
