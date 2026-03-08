import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const ADMIN_EMAILS = ['muffigout@gmail.com', 'otw2003@gmail.com', 'kaliasgar776@gmail.com']

async function verifyAdmin(req: Request) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) throw new Error('Unauthorized')
  const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error } = await anonClient.auth.getUser()
  if (error || !user || !ADMIN_EMAILS.includes(user.email ?? '')) {
    throw new Error('Forbidden: Admin access only')
  }
  return user
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    await verifyAdmin(req)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    const { table, action, record } = await req.json()

    const allowedTables = ['coupons', 'notifications', 'blog_posts', 'reviews']
    if (!allowedTables.includes(table)) {
      return new Response(JSON.stringify({ error: 'Invalid table' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'list') {
      const { data, error } = await adminClient
        .from(table)
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'create') {
      const { data, error } = await adminClient
        .from(table)
        .insert(record)
        .select()
        .single()
      if (error) throw error
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'update') {
      const { id, ...updates } = record
      if (updates.updated_at === undefined && (table === 'coupons' || table === 'blog_posts')) {
        updates.updated_at = new Date().toISOString()
      }
      const { data, error } = await adminClient
        .from(table)
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'delete') {
      const { error } = await adminClient
        .from(table)
        .delete()
        .eq('id', record.id)
      if (error) throw error
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const status = error.message.includes('Forbidden') ? 403 : error.message === 'Unauthorized' ? 401 : 500
    return new Response(JSON.stringify({ error: error.message }), {
      status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
