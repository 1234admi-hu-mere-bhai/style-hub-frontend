// Initiates a wallet top-up via PayU. Computes bonus (preset packs only),
// persists a pending_payment row marked is_wallet_topup=true, returns hash params.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Preset packs ONLY get a bonus. Custom amounts get zero bonus.
const PRESET_BONUSES: Record<number, number> = {
  500: 25,
  1000: 50,
  2000: 100,
  5000: 250,
};

const MIN_TOPUP = 100;
const MAX_TOPUP = 50000;

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const PAYU_KEY = (Deno.env.get('PAYU_MERCHANT_KEY') || '').trim();
    const PAYU_SALT = (Deno.env.get('PAYU_MERCHANT_SALT') || '').trim();
    if (!PAYU_KEY || !PAYU_SALT) return json({ error: 'Payment configuration missing' }, 500);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) return json({ error: 'Unauthorized' }, 401);
    const userId = claimsData.claims.sub as string;
    const userEmail = (claimsData.claims.email as string) || '';

    const body = await req.json().catch(() => ({}));
    const amount = Math.floor(Number(body.amount));
    const firstname = String(body.firstname || 'Customer').slice(0, 50);
    const phone = String(body.phone || '').slice(0, 20);

    if (!Number.isFinite(amount) || amount < MIN_TOPUP || amount > MAX_TOPUP) {
      return json({ error: `Amount must be between ₹${MIN_TOPUP} and ₹${MAX_TOPUP}` }, 400);
    }

    const bonus = PRESET_BONUSES[amount] || 0;
    const txnid = `WT${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const productinfo = 'Wallet Top-up';
    const amountStr = amount.toFixed(2);

    const admin = createClient(SUPABASE_URL, SERVICE);

    const { error: pErr } = await admin.from('pending_payments').upsert({
      txnid,
      user_id: userId,
      user_email: userEmail,
      items: [],
      subtotal: amount,
      shipping_cost: 0,
      total: amount,
      shipping_address: {},
      is_buy_now: false,
      is_wallet_topup: true,
      topup_bonus: bonus,
      status: 'pending',
    }, { onConflict: 'txnid' });
    if (pErr) {
      console.error('pending_payment topup insert failed', pErr);
      return json({ error: 'Failed to record top-up' }, 500);
    }

    // PayU hash: sha512(key|txnid|amount|productinfo|firstname|email|udf1..5|||||||salt)
    const hashString = `${PAYU_KEY}|${txnid}|${amountStr}|${productinfo}|${firstname}|${userEmail}|||||||||||${PAYU_SALT}`;
    const buf = await crypto.subtle.digest('SHA-512', new TextEncoder().encode(hashString));
    const hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');

    return json({
      hash, key: PAYU_KEY, txnid, amount: amountStr, productinfo,
      firstname, email: userEmail, phone, bonus,
    });
  } catch (e) {
    console.error('wallet-topup-initiate error', e);
    return json({ error: 'Failed to initiate top-up' }, 500);
  }
});
