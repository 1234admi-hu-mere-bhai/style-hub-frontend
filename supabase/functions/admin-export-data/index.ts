import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const ADMIN_EMAILS = ['muffigout@gmail.com', 'otw2003@gmail.com', 'kaliasgar776@gmail.com']

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: userError } = await anonClient.auth.getUser()

    if (userError || !user || !ADMIN_EMAILS.includes(user.email ?? '')) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access only' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch all tables in parallel
    const [products, orders, orderItems, profiles, reviews, coupons, blogPosts, notifications, referrals] = await Promise.all([
      adminClient.from('products').select('*'),
      adminClient.from('orders').select('*'),
      adminClient.from('order_items').select('*'),
      adminClient.from('profiles').select('*'),
      adminClient.from('reviews').select('*'),
      adminClient.from('coupons').select('*'),
      adminClient.from('blog_posts').select('*'),
      adminClient.from('notifications').select('*'),
      adminClient.from('referrals').select('*'),
    ])

    // Get auth users for email mapping
    const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers()

    const exportData = {
      exported_at: new Date().toISOString(),
      tables: {
        products: products.data || [],
        orders: orders.data || [],
        order_items: orderItems.data || [],
        customers: (profiles.data || []).map(p => {
          const authUser = authUsers?.find(u => u.id === p.id)
          return { ...p, email: authUser?.email || null }
        }),
        reviews: reviews.data || [],
        coupons: coupons.data || [],
        blog_posts: blogPosts.data || [],
        notifications: notifications.data || [],
        referrals: referrals.data || [],
      },
      counts: {
        products: products.data?.length || 0,
        orders: orders.data?.length || 0,
        order_items: orderItems.data?.length || 0,
        customers: profiles.data?.length || 0,
        reviews: reviews.data?.length || 0,
        coupons: coupons.data?.length || 0,
        blog_posts: blogPosts.data?.length || 0,
        notifications: notifications.data?.length || 0,
        referrals: referrals.data?.length || 0,
      },
    }

    return new Response(JSON.stringify(exportData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
