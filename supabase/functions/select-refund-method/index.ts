// User selects their refund method ('wallet' or 'source') for an approved return.
// Validates the method is in the admin-allowed list and within the 6h window.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
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

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) return json({ error: 'Unauthorized' }, 401);
    const userId = claimsData.claims.sub as string;

    const { orderId, method } = await req.json();
    if (!orderId || !['wallet', 'source'].includes(method)) {
      return json({ error: 'Invalid orderId or method' }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE);
    const { data: ret, error: rErr } = await admin
      .from('returns')
      .select('id, user_id, status, allowed_refund_methods, admin_window_expires_at, selected_refund_method')
      .eq('order_id', orderId)
      .maybeSingle();
    if (rErr || !ret) return json({ error: 'Return not found' }, 404);
    if (ret.user_id !== userId) return json({ error: 'Forbidden' }, 403);
    if (ret.status === 'refunded') return json({ error: 'Refund already processed' }, 400);
    if (ret.selected_refund_method) return json({ error: 'Refund method already selected' }, 400);

    const allowed = (ret.allowed_refund_methods || []) as string[];
    if (!allowed.includes(method)) {
      return json({ error: `Method '${method}' is not allowed for this return` }, 400);
    }
    if (ret.admin_window_expires_at && new Date(ret.admin_window_expires_at) < new Date()) {
      return json({ error: 'Selection window has expired — refund will go to original payment source' }, 400);
    }

    const { error: uErr } = await admin
      .from('returns')
      .update({ selected_refund_method: method, updated_at: new Date().toISOString() })
      .eq('id', ret.id);
    if (uErr) return json({ error: 'Failed to save selection' }, 500);

    return json({ success: true, selected: method });
  } catch (e) {
    console.error('select-refund-method error', e);
    return json({ error: 'Failed to set refund method' }, 500);
  }
});
