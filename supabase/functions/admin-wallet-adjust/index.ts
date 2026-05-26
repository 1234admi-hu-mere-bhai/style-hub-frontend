// Admin / owner can credit or debit a user's wallet with a reason.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const OWNER_EMAILS = ['otw2003@gmail.com', 'kaliasgar776@gmail.com', 'muffigout@gmail.com'];
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const anonClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await anonClient.auth.getUser();
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE);
    const email = (user.email ?? '').toLowerCase();
    const isOwner = OWNER_EMAILS.includes(email);
    if (!isOwner) {
      const { data: staff } = await admin.from('staff_members')
        .select('status, permissions').eq('user_id', user.id).maybeSingle();
      const perms = (staff?.permissions || {}) as Record<string, boolean>;
      if (!staff || staff.status !== 'active' || !perms.customers) {
        return json({ error: 'Forbidden' }, 403);
      }
    }

    const { userId, amount, reason } = await req.json();
    const amt = Number(amount);
    if (!userId || !Number.isFinite(amt) || amt === 0) {
      return json({ error: 'userId and non-zero amount required' }, 400);
    }
    if (!reason || String(reason).trim().length < 3) {
      return json({ error: 'Reason required (min 3 chars)' }, 400);
    }

    const { data, error } = await admin.rpc('adjust_wallet_balance', {
      _user_id: userId,
      _amount: amt,
      _type: 'adjustment',
      _reference_type: 'admin',
      _reference_id: user.id,
      _description: `Admin adjustment: ${String(reason).slice(0, 200)}`,
    });
    if (error) return json({ error: error.message }, 400);

    return json({ success: true, balance: data });
  } catch (e) {
    console.error('admin-wallet-adjust error', e);
    return json({ error: 'Failed' }, 500);
  }
});
