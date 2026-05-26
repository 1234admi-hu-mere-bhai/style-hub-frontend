import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { priceCart, PriceCartError } from "../_shared/price-cart.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), {
  status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) return json({ error: 'Unauthorized' }, 401);
    const userId = claimsData.claims.sub as string;
    const userEmail = (claimsData.claims.email as string) || '';

    const body = await req.json().catch(() => ({}));
    const { txnid, productinfo, firstname, email, phone, checkout } = body || {};

    if (!txnid || !productinfo || !firstname || !email) {
      return json({ error: 'Missing required fields' }, 400);
    }

    const merchantKey = (Deno.env.get('PAYU_MERCHANT_KEY') || '').trim();
    const merchantSalt = (Deno.env.get('PAYU_MERCHANT_SALT') || '').trim();
    if (!merchantKey || !merchantSalt) return json({ error: 'Payment configuration missing' }, 500);

    if (!checkout || !Array.isArray(checkout.items) || !checkout.address) {
      return json({ error: 'Checkout payload required' }, 400);
    }
    const address = checkout.address;
    if (!address.pincode || !/^\d{6}$/.test(String(address.pincode))) {
      return json({ error: 'Valid pincode is required' }, 400);
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Server-side recompute — IGNORE any client-supplied amount or item.price.
    let priced;
    try {
      priced = await priceCart(admin, {
        items: checkout.items.map((it: any) => ({
          product_id: it.product_id,
          quantity: it.quantity,
          size: it.size,
          color: it.color,
        })),
        coupon_code: checkout.coupon_code || null,
        shipping_address: { state: address.state, pincode: address.pincode },
        payment_method: 'online',
      });
    } catch (e) {
      if (e instanceof PriceCartError) return json({ error: e.message }, e.status);
      throw e;
    }

    // ===== Wallet split: optionally apply wallet balance toward this order =====
    let walletUsed = 0;
    if (checkout.apply_wallet) {
      const { data: wallet } = await admin.from('wallets').select('balance').eq('user_id', userId).maybeSingle();
      const bal = Number(wallet?.balance || 0);
      if (bal > 0) {
        // Leave at least ₹1 for PayU (it can't accept ₹0). For wallet-only checkouts
        // the client must use the dedicated create-wallet-order endpoint.
        const maxApplicable = Math.max(0, priced.total - 1);
        walletUsed = Math.min(bal, maxApplicable);
        walletUsed = Math.round(walletUsed * 100) / 100;
      }
    }
    const payuAmount = Math.round((priced.total - walletUsed) * 100) / 100;
    const amount = payuAmount.toFixed(2);

    // Persist pending_payment with SERVER-computed values
    const { error: pendingError } = await admin.from('pending_payments').upsert({
      txnid,
      user_id: userId,
      user_email: userEmail,
      items: priced.items,
      subtotal: priced.subtotal,
      shipping_cost: priced.shipping_cost,
      total: priced.total,
      wallet_amount_used: walletUsed,
      shipping_address: address,
      is_buy_now: !!checkout.isBuyNow,
      status: 'pending',
    }, { onConflict: 'txnid' });
    if (pendingError) {
      console.error('Failed to persist pending_payment:', pendingError);
      return json({ error: 'Failed to record payment' }, 500);
    }

    // PayU hash formula: sha512(key|txnid|amount|productinfo|firstname|email|udf1..5|||||||salt)
    const hashString = `${merchantKey}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${merchantSalt}`;
    const hashBuffer = await crypto.subtle.digest('SHA-512', new TextEncoder().encode(hashString));
    const hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    return json({ hash, key: merchantKey, txnid, amount, total: priced.total, walletUsed, payuAmount });
  } catch (error) {
    console.error('PayU hash error:', error);
    return json({ error: 'Failed to generate hash' }, 500);
  }
});
