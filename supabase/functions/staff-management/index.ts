// Staff management edge function
// Actions: create-invite | accept-invite | list-invites | revoke-invite
//          list-staff | update-staff | remove-staff | me | list-activity
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const OWNER_EMAILS = ['otw2003@gmail.com', 'kaliasgar776@gmail.com'];

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

function randomToken(len = 32) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) return json({ error: 'Missing auth token' }, 401);

    const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: claims } = await userClient.auth.getClaims(token);
    const userId = claims?.claims?.sub;
    const userEmail = (claims?.claims?.email ?? '').toLowerCase();
    if (!userId) return json({ error: 'Invalid session' }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { action, ...payload } = await req.json().catch(() => ({}));

    const { data: isOwnerRes } = await admin.rpc('is_owner', { _uid: userId });
    const isOwner = !!isOwnerRes;

    // --- "me": current user's role + permissions ---
    if (action === 'me') {
      const { data: staff } = await admin
        .from('staff_members')
        .select('id, email, display_name, status, permissions, joined_at')
        .eq('user_id', userId)
        .maybeSingle();
      return json({
        user_id: userId,
        email: userEmail,
        is_owner: isOwner,
        is_active: isOwner || (staff?.status === 'active'),
        display_name: staff?.display_name || null,
        permissions: isOwner ? '*' : (staff?.permissions ?? {}),
      });
    }

    // ----- Owner-only beyond this point -----
    if (!isOwner) return json({ error: 'Owner access required' }, 403);

    if (action === 'create-invite') {
      const { email, display_name = '', permissions = {} } = payload;
      if (!email) return json({ error: 'email required' }, 400);
      const tokenStr = randomToken();
      const { data: invite, error } = await admin
        .from('staff_invites')
        .insert({
          email: String(email).toLowerCase().trim(),
          token: tokenStr,
          display_name,
          permissions,
          created_by: userId,
        })
        .select()
        .single();
      if (error) return json({ error: error.message }, 400);
      return json({ invite });
    }

    if (action === 'list-invites') {
      const { data, error } = await admin
        .from('staff_invites')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return json({ error: error.message }, 400);
      return json({ invites: data });
    }

    if (action === 'revoke-invite') {
      const { id } = payload;
      const { error } = await admin.from('staff_invites').delete().eq('id', id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === 'list-staff') {
      const { data, error } = await admin
        .from('staff_members')
        .select('*')
        .order('joined_at', { ascending: false });
      if (error) return json({ error: error.message }, 400);
      return json({ staff: data });
    }

    if (action === 'update-staff') {
      const { id, display_name, status, permissions } = payload;
      if (!id) return json({ error: 'id required' }, 400);
      const update: Record<string, unknown> = {};
      if (display_name !== undefined) update.display_name = display_name;
      if (status !== undefined) update.status = status;
      if (permissions !== undefined) update.permissions = permissions;
      const { data, error } = await admin
        .from('staff_members')
        .update(update)
        .eq('id', id)
        .select()
        .single();
      if (error) return json({ error: error.message }, 400);
      return json({ staff: data });
    }

    if (action === 'remove-staff') {
      const { id } = payload;
      if (!id) return json({ error: 'id required' }, 400);
      // Block accidental owner removal (owners shouldn't be in this table, but extra safety)
      const { data: row } = await admin
        .from('staff_members')
        .select('email')
        .eq('id', id)
        .maybeSingle();
      if (row && OWNER_EMAILS.includes(String(row.email).toLowerCase())) {
        return json({ error: 'Cannot remove an owner account' }, 400);
      }
      const { error } = await admin.from('staff_members').delete().eq('id', id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === 'list-activity') {
      const { staff_user_id, module, limit = 100 } = payload;
      let q = admin
        .from('staff_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(Math.min(Number(limit) || 100, 500));
      if (staff_user_id) q = q.eq('actor_user_id', staff_user_id);
      if (module) q = q.eq('module', module);
      const { data, error } = await q;
      if (error) return json({ error: error.message }, 400);
      return json({ activity: data });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    console.error('staff-management error', e);
    return json({ error: (e as Error).message }, 500);
  }
});
