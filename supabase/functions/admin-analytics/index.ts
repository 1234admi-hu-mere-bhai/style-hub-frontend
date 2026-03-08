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

    // Fetch all orders with items
    const { data: orders, error: ordersError } = await adminClient
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })

    if (ordersError) throw ordersError

    // Fetch all profiles (customers)
    const { data: profiles, error: profilesError } = await adminClient
      .from('profiles')
      .select('id, first_name, last_name, phone, avatar_url, created_at')
      .order('created_at', { ascending: false })

    if (profilesError) throw profilesError

    const allOrders = orders || []
    const allProfiles = profiles || []

    // KPI computations
    const totalOrders = allOrders.length
    const totalRevenue = allOrders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0)
    const paidOrders = allOrders.filter((o: any) => o.payment_status === 'paid')
    const paidRevenue = paidOrders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0)
    const pendingOrders = allOrders.filter((o: any) => o.status === 'pending' || o.status === 'placed').length
    // Count only customers who have placed orders
    const uniqueCustomerIds = new Set(allOrders.map((o: any) => o.user_id))
    const totalCustomers = uniqueCustomerIds.size

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

    // All orders for Orders tab (with full details)
    const allOrdersList = allOrders.map((o: any) => ({
      id: o.id,
      order_number: o.order_number,
      user_id: o.user_id,
      status: o.status,
      total: o.total,
      subtotal: o.subtotal,
      shipping_cost: o.shipping_cost,
      payment_method: o.payment_method,
      payment_status: o.payment_status,
      payment_id: o.payment_id,
      shipping_address: o.shipping_address,
      created_at: o.created_at,
      updated_at: o.updated_at,
      delivered_at: o.delivered_at,
      items: (o.order_items || []).map((item: any) => ({
        id: item.id,
        product_name: item.product_name,
        product_id: item.product_id,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        image: item.image,
      })),
    }))

    // Recent orders (last 10)
    const recentOrders = allOrdersList.slice(0, 10)

    // Customers with order counts - only include those with orders
    const customerOrderCounts: Record<string, number> = {}
    const customerSpend: Record<string, number> = {}
    const customerOrders: Record<string, any[]> = {}
    allOrders.forEach((o: any) => {
      customerOrderCounts[o.user_id] = (customerOrderCounts[o.user_id] || 0) + 1
      customerSpend[o.user_id] = (customerSpend[o.user_id] || 0) + Number(o.total || 0)
      if (!customerOrders[o.user_id]) customerOrders[o.user_id] = []
      customerOrders[o.user_id].push({
        id: o.id,
        order_number: o.order_number,
        status: o.status,
        total: o.total,
        payment_status: o.payment_status,
        created_at: o.created_at,
        items: (o.order_items || []).map((item: any) => ({
          product_name: item.product_name,
          quantity: item.quantity,
          price: item.price,
          size: item.size,
          color: item.color,
        })),
      })
    })

    // Fetch user emails via admin API
    const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers()
    const emailMap: Record<string, string> = {}
    ;(authUsers || []).forEach((u: any) => { emailMap[u.id] = u.email || '' })

    // Only return customers who have placed at least one order
    const customerIdsWithOrders = Object.keys(customerOrderCounts)
    const customers = allProfiles
      .filter((p: any) => customerIdsWithOrders.includes(p.id))
      .map((p: any) => ({
        id: p.id,
        first_name: p.first_name,
        last_name: p.last_name,
        email: emailMap[p.id] || '',
        phone: p.phone,
        avatar_url: p.avatar_url,
        created_at: p.created_at,
        total_orders: customerOrderCounts[p.id] || 0,
        total_spent: customerSpend[p.id] || 0,
        orders: customerOrders[p.id] || [],
      }))

    return new Response(
      JSON.stringify({
        totalOrders,
        totalRevenue,
        paidRevenue,
        pendingOrders,
        totalCustomers,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        statusCounts,
        paymentMethods,
        revenueByDay,
        topProducts,
        recentOrders,
        allOrders: allOrdersList,
        customers,
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
