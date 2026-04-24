// Public-but-authenticated endpoint to accept a staff invite.
// Caller must be logged in. Validates the token & email match, then inserts
// the staff_members row and marks the invite as accepted.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    if (!jwt) return json({ error: 'Sign in first to accept the invite.' }, 401);

    const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: claims } = await userClient.auth.getClaims(jwt);
    const userId = claims?.claims?.sub;
    const userEmail = String(claims?.claims?.email ?? '').toLowerCase();
    if (!userId) return json({ error: 'Invalid session' }, 401);

    const { token } = await req.json().catch(() => ({}));
    if (!token) return json({ error: 'Token required' }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: invite } = await admin
      .from('staff_invites')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (!invite) return json({ error: 'Invite not found' }, 404);
    if (invite.accepted_at) return json({ error: 'Invite already used' }, 410);
    if (new Date(invite.expires_at).getTime() < Date.now())
      return json({ error: 'Invite expired' }, 410);
    if (String(invite.email).toLowerCase() !== userEmail)
      return json({
        error: `This invite is for ${invite.email}. Please sign in with that email.`,
      }, 403);

    // Upsert staff record
    const { error: staffErr } = await admin
      .from('staff_members')
      .upsert(
        {
          user_id: userId,
          email: userEmail,
          display_name: invite.display_name || '',
          permissions: invite.permissions || {},
          status: 'active',
          invited_by: invite.created_by,
          joined_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
    if (staffErr) return json({ error: staffErr.message }, 400);

    await admin
      .from('staff_invites')
      .update({ accepted_at: new Date().toISOString(), accepted_by: userId })
      .eq('id', invite.id);

    await admin.rpc('log_staff_activity', {
      _actor_user_id: userId,
      _actor_email: userEmail,
      _actor_role: 'staff',
      _module: 'staff',
      _action: 'invite-accepted',
      _target_table: 'staff_members',
      _target_id: userId,
      _summary: `${userEmail} accepted staff invite`,
      _metadata: { invite_id: invite.id },
    });

    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
