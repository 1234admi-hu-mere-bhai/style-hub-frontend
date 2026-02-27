import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Add your admin email(s) here
const ADMIN_EMAILS = ['muffigout@gmail.com']

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Verify the requesting user is admin
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

    // Use service role to query ALL orders
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch all orders
    const { data: orders, error: ordersError } = await adminClient
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })

    if (ordersError) {
      throw ordersError
    }

    const allOrders = orders || []

    // Compute analytics
    const totalOrders = allOrders.length
    const totalRevenue = allOrders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0)
    const paidOrders = allOrders.filter((o: any) => o.payment_status === 'paid')
    const paidRevenue = paidOrders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0)

    // Status breakdown
    const statusCounts: Record<string, number> = {}
    allOrders.forEach((o: any) => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1
    })

    // Payment method breakdown
    const paymentMethods: Record<string, number> = {}
    allOrders.forEach((o: any) => {
      paymentMethods[o.payment_method] = (paymentMethods[o.payment_method] || 0) + 1
    })

    // Revenue by day (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const revenueByDay: Record<string, number> = {}
    allOrders
      .filter((o: any) => new Date(o.created_at) >= thirtyDaysAgo)
      .forEach((o: any) => {
        const day = o.created_at.split('T')[0]
        revenueByDay[day] = (revenueByDay[day] || 0) + Number(o.total || 0)
      })

    // Top products
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {}
    allOrders.forEach((o: any) => {
      (o.order_items || []).forEach((item: any) => {
        const key = item.product_id
        if (!productSales[key]) {
          productSales[key] = { name: item.product_name, quantity: 0, revenue: 0 }
        }
        productSales[key].quantity += item.quantity
        productSales[key].revenue += Number(item.price) * item.quantity
      })
    })
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Recent orders (last 10)
    const recentOrders = allOrders.slice(0, 10).map((o: any) => ({
      id: o.id,
      order_number: o.order_number,
      status: o.status,
      total: o.total,
      payment_method: o.payment_method,
      payment_status: o.payment_status,
      created_at: o.created_at,
      items_count: (o.order_items || []).length,
    }))

    return new Response(
      JSON.stringify({
        totalOrders,
        totalRevenue,
        paidRevenue,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        statusCounts,
        paymentMethods,
        revenueByDay,
        topProducts,
        recentOrders,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
