// Owner-only edge function that lists, approves, and rejects staff pending changes.
// Approving a pending change applies the proposed_data to the real target_table.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const ALLOWED_TABLES = new Set([
  'products',
  'coupons',
  'blog_posts',
  'reviews',
  'flash_sales',
  'orders',
]);

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
    if (!jwt) return json({ error: 'Unauthorized' }, 401);

    const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: claims } = await userClient.auth.getClaims(jwt);
    const userId = claims?.claims?.sub;
    const userEmail = String(claims?.claims?.email ?? '').toLowerCase();
    if (!userId) return json({ error: 'Invalid session' }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: isOwnerRes } = await admin.rpc('is_owner', { _uid: userId });
    if (!isOwnerRes) return json({ error: 'Owner access required' }, 403);

    const { action, ...payload } = await req.json().catch(() => ({}));

    if (action === 'list') {
      const status = payload.status ?? 'pending';
      const { data, error } = await admin
        .from('staff_pending_changes')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) return json({ error: error.message }, 400);
      return json({ changes: data });
    }

    if (action === 'count') {
      const { count, error } = await admin
        .from('staff_pending_changes')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (error) return json({ error: error.message }, 400);
      return json({ count: count ?? 0 });
    }

    if (action === 'approve') {
      const { id, notes } = payload;
      if (!id) return json({ error: 'id required' }, 400);

      const { data: change, error: fetchErr } = await admin
        .from('staff_pending_changes')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (fetchErr || !change) return json({ error: 'Change not found' }, 404);
      if (change.status !== 'pending')
        return json({ error: `Change is already ${change.status}` }, 400);
      if (!ALLOWED_TABLES.has(change.target_table))
        return json({ error: 'Invalid target table' }, 400);

      // Apply the change to the real table
      let applyErr: string | null = null;
      try {
        if (change.action === 'create') {
          const insertData = change.proposed_data ?? {};
          const { error } = await admin.from(change.target_table).insert(insertData);
          if (error) applyErr = error.message;
        } else if (change.action === 'update') {
          if (!change.target_id) {
            applyErr = 'Missing target_id for update';
          } else {
            const updates = { ...(change.proposed_data ?? {}) } as Record<string, unknown>;
            // Touch updated_at if column exists in schema
            if (
              ['products', 'coupons', 'blog_posts', 'flash_sales', 'orders'].includes(
                change.target_table,
              )
            ) {
              updates.updated_at = new Date().toISOString();
            }
            const { error } = await admin
              .from(change.target_table)
              .update(updates)
              .eq('id', change.target_id);
            if (error) applyErr = error.message;
          }
        } else if (change.action === 'delete') {
          if (!change.target_id) {
            applyErr = 'Missing target_id for delete';
          } else {
            const { error } = await admin
              .from(change.target_table)
              .delete()
              .eq('id', change.target_id);
            if (error) applyErr = error.message;
          }
        } else {
          applyErr = `Unknown action: ${change.action}`;
        }
      } catch (e) {
        applyErr = (e as Error).message;
      }

      if (applyErr) return json({ error: `Could not apply change: ${applyErr}` }, 400);

      await admin
        .from('staff_pending_changes')
        .update({
          status: 'approved',
          reviewer_id: userId,
          reviewer_email: userEmail,
          reviewer_notes: notes ?? null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);

      // Activity log
      await admin.rpc('log_staff_activity', {
        _actor_user_id: userId,
        _actor_email: userEmail,
        _actor_role: 'owner',
        _module: change.module,
        _action: `approve-${change.action}`,
        _target_table: change.target_table,
        _target_id: change.target_id,
        _summary: `Approved ${change.staff_email}'s ${change.action} on ${change.target_table}`,
        _metadata: { change_id: id },
      });

      return json({ ok: true });
    }

    if (action === 'reject') {
      const { id, notes } = payload;
      if (!id) return json({ error: 'id required' }, 400);
      const { data: change } = await admin
        .from('staff_pending_changes')
        .select('staff_email, module, action, target_table, target_id, status')
        .eq('id', id)
        .maybeSingle();
      if (!change) return json({ error: 'Change not found' }, 404);
      if (change.status !== 'pending')
        return json({ error: `Change is already ${change.status}` }, 400);

      await admin
        .from('staff_pending_changes')
        .update({
          status: 'rejected',
          reviewer_id: userId,
          reviewer_email: userEmail,
          reviewer_notes: notes ?? null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);

      await admin.rpc('log_staff_activity', {
        _actor_user_id: userId,
        _actor_email: userEmail,
        _actor_role: 'owner',
        _module: change.module,
        _action: `reject-${change.action}`,
        _target_table: change.target_table,
        _target_id: change.target_id,
        _summary: `Rejected ${change.staff_email}'s ${change.action} on ${change.target_table}`,
        _metadata: { change_id: id, notes },
      });

      return json({ ok: true });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    console.error('staff-pending-changes error', e);
    return json({ error: (e as Error).message }, 500);
  }
});
