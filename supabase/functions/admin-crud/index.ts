import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const OWNER_EMAILS = ['otw2003@gmail.com', 'kaliasgar776@gmail.com']
// Legacy admin emails kept for backward compatibility
const LEGACY_ADMIN_EMAILS = ['muffigout@gmail.com', ...OWNER_EMAILS]

// Map admin-crud table → staff permission module key
const TABLE_TO_MODULE: Record<string, string> = {
  coupons: 'coupons',
  notifications: 'notifications',
  blog_posts: 'blog',
  reviews: 'reviews',
  flash_sales: 'flash-sales',
}

interface ActorContext {
  user: any
  email: string
  role: 'owner' | 'staff'
  permissions: Record<string, boolean> | '*'
}

async function verifyAdminAndGetContext(req: Request, adminClient: any): Promise<ActorContext> {
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

  // Staff lookup
  const { data: staff } = await adminClient
    .from('staff_members')
    .select('status, permissions')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!staff || staff.status !== 'active') {
    throw new Error('Forbidden: Admin access only')
  }
  return { user, email, role: 'staff', permissions: (staff.permissions || {}) as Record<string, boolean> }
}

function checkPermission(ctx: ActorContext, module: string) {
  if (ctx.permissions === '*') return
  if (!ctx.permissions[module]) {
    throw new Error(`Forbidden: missing permission for ${module}`)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const adminClient = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const ctx = await verifyAdminAndGetContext(req, adminClient)
    const { table, action, record } = await req.json()

    const allowedTables = ['coupons', 'notifications', 'blog_posts', 'reviews', 'flash_sales']
    if (!allowedTables.includes(table)) {
      return new Response(JSON.stringify({ error: 'Invalid table' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const moduleKey = TABLE_TO_MODULE[table]

    // Read-only actions: list — staff need module access too (owners always pass)
    if (action === 'list') {
      checkPermission(ctx, moduleKey)
      const { data, error } = await adminClient.from(table).select('*').order('created_at', { ascending: false })
      if (error) throw error
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Write actions: enforce permission + log
    if (action === 'create' || action === 'update' || action === 'delete') {
      checkPermission(ctx, moduleKey)

      let result: any
      let targetId: string | null = null
      let summary = ''

      if (action === 'create') {
        const { data, error } = await adminClient.from(table).insert(record).select().single()
        if (error) throw error
        result = data
        targetId = data?.id ?? null
        summary = `Created ${table.replace(/_/g, ' ')} ${data?.code || data?.title || data?.name || data?.id || ''}`.trim()
      } else if (action === 'update') {
        const { id, ...updates } = record
        if (updates.updated_at === undefined && (table === 'coupons' || table === 'blog_posts' || table === 'flash_sales')) {
          updates.updated_at = new Date().toISOString()
        }
        const { data, error } = await adminClient.from(table).update(updates).eq('id', id).select().single()
        if (error) throw error
        result = data
        targetId = id
        summary = `Updated ${table.replace(/_/g, ' ')} ${data?.code || data?.title || data?.name || id}`
      } else {
        const { error } = await adminClient.from(table).delete().eq('id', record.id)
        if (error) throw error
        result = { success: true }
        targetId = record.id
        summary = `Deleted ${table.replace(/_/g, ' ')} ${record.id}`
      }

      // Fire-and-forget activity log
      adminClient.rpc('log_staff_activity', {
        _actor_user_id: ctx.user.id,
        _actor_email: ctx.email,
        _actor_role: ctx.role,
        _module: moduleKey,
        _action: action,
        _target_table: table,
        _target_id: targetId,
        _summary: summary,
        _metadata: action === 'delete' ? null : record,
      }).then(() => {}).catch((e: any) => console.error('log failed', e))

      return new Response(JSON.stringify(action === 'delete' ? result : { data: result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
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
