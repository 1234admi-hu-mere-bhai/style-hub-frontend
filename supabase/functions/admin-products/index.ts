import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const OWNER_EMAILS = ['otw2003@gmail.com', 'kaliasgar776@gmail.com']
const LEGACY_ADMIN_EMAILS = ['muffigout@gmail.com', ...OWNER_EMAILS]

interface ActorContext {
  user: any
  email: string
  role: 'owner' | 'staff'
  permissions: Record<string, boolean> | '*'
}

async function verifyAndGetContext(req: Request, adminClient: any): Promise<ActorContext> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) throw new Error('Unauthorized')
  const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error } = await anonClient.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')
  const email = (user.email ?? '').toLowerCase()

  if (OWNER_EMAILS.includes(email) || LEGACY_ADMIN_EMAILS.includes(email)) {
    return { user, email, role: 'owner', permissions: '*' }
  }
  const { data: staff } = await adminClient
    .from('staff_members').select('status, permissions').eq('user_id', user.id).maybeSingle()
  if (!staff || staff.status !== 'active') throw new Error('Forbidden: Admin access only')
  return { user, email, role: 'staff', permissions: (staff.permissions || {}) as Record<string, boolean> }
}

function checkPerm(ctx: ActorContext, mod: string) {
  if (ctx.permissions === '*') return
  if (!ctx.permissions[mod]) throw new Error(`Forbidden: missing permission for ${mod}`)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const adminClient = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const ctx = await verifyAndGetContext(req, adminClient)
    const { action, product } = await req.json()

    if (action === 'list') {
      checkPerm(ctx, 'products')
      const { data, error } = await adminClient.from('products').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return new Response(JSON.stringify({ products: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'create' || action === 'update' || action === 'delete') {
      checkPerm(ctx, 'products')

      // ===== STAFF: route through pending changes queue =====
      if (ctx.role === 'staff') {
        let proposed: any = null
        let previous: any = null
        let targetId: string | null = null
        let summary = ''

        if (action === 'create') {
          proposed = product
          summary = `Proposed new product "${product?.name ?? ''}"`.trim()
        } else if (action === 'update') {
          const { id, ...updates } = product
          targetId = id
          proposed = updates
          const { data: prev } = await adminClient.from('products').select('*').eq('id', id).maybeSingle()
          previous = prev
          summary = `Proposed update to product "${prev?.name ?? id}"`
        } else {
          targetId = product.id
          const { data: prev } = await adminClient.from('products').select('*').eq('id', product.id).maybeSingle()
          previous = prev
          summary = `Proposed deletion of product "${prev?.name ?? product.id}"`
        }

        const { data: pending, error: pErr } = await adminClient
          .from('staff_pending_changes')
          .insert({
            staff_user_id: ctx.user.id,
            staff_email: ctx.email,
            module: 'products',
            target_table: 'products',
            action,
            target_id: targetId,
            proposed_data: proposed,
            previous_data: previous,
            summary,
          })
          .select()
          .single()
        if (pErr) throw pErr

        adminClient.rpc('log_staff_activity', {
          _actor_user_id: ctx.user.id, _actor_email: ctx.email, _actor_role: ctx.role,
          _module: 'products', _action: `pending-${action}`, _target_table: 'products',
          _target_id: targetId, _summary: summary,
          _metadata: action === 'delete' ? null : product,
        }).then(() => {}).catch((e: any) => console.error('log failed', e))

        return new Response(
          JSON.stringify({ pending: true, change_id: pending.id, message: 'Submitted for owner approval' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      // ===== OWNER: apply directly =====
      let result: any, targetId: string | null = null, summary = ''

      if (action === 'create') {
        const { data, error } = await adminClient.from('products').insert(product).select().single()
        if (error) throw error
        result = { product: data }; targetId = data?.id ?? null
        summary = `Created product "${data?.name ?? ''}"`.trim()
      } else if (action === 'update') {
        const { id, ...updates } = product
        updates.updated_at = new Date().toISOString()
        const { data, error } = await adminClient.from('products').update(updates).eq('id', id).select().single()
        if (error) throw error
        result = { product: data }; targetId = id
        summary = `Updated product "${data?.name ?? id}"`
      } else {
        const { error } = await adminClient.from('products').delete().eq('id', product.id)
        if (error) throw error
        result = { success: true }; targetId = product.id
        summary = `Deleted product ${product.id}`
      }

      adminClient.rpc('log_staff_activity', {
        _actor_user_id: ctx.user.id, _actor_email: ctx.email, _actor_role: ctx.role,
        _module: 'products', _action: action, _target_table: 'products',
        _target_id: targetId, _summary: summary,
        _metadata: action === 'delete' ? null : product,
      }).then(() => {}).catch((e: any) => console.error('log failed', e))

      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    const status = error.message?.includes('Forbidden') ? 403 : error.message === 'Unauthorized' ? 401 : 500
    return new Response(JSON.stringify({ error: error.message }), {
      status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
