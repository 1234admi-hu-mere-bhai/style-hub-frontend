import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

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

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { orderId, reason } = await req.json()
    if (!orderId) {
      return new Response(JSON.stringify({ error: 'orderId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!reason || reason.trim().length < 5) {
      return new Response(JSON.stringify({ error: 'Please provide a return reason (at least 5 characters)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .select('id, user_id, status, delivered_at')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (order.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (order.status !== 'delivered') {
      return new Response(JSON.stringify({ error: 'Only delivered orders can request a return' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (order.delivered_at) {
      const deliveredDate = new Date(order.delivered_at)
      const now = new Date()
      const daysSinceDelivery = (now.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceDelivery > 7) {
        return new Response(JSON.stringify({ error: 'Return window has expired (7 days from delivery)' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    const { data: orderRow } = await adminClient
      .from('orders')
      .select('order_number')
      .eq('id', orderId)
      .maybeSingle()

    const { error: updateError } = await adminClient
      .from('orders')
      .update({
        status: 'return_requested',
        return_reason: reason.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (updateError) throw updateError

    // 🔔 Push notification: return submitted
    try {
      await adminClient.functions.invoke('send-push', {
        body: {
          userId: order.user_id,
          title: '↩️ Return Request Submitted',
          message: `Your return for order ${orderRow?.order_number || ''} is being reviewed. We'll update you soon.`,
          url: `/track-order?id=${orderRow?.order_number || ''}`,
          tag: `return-req-${orderId}`,
          category: 'orders',
          dedupeKey: `return-req-${orderId}`,
        },
      })
    } catch (e) { console.error('return push failed:', e) }

    return new Response(
      JSON.stringify({ success: true, message: 'Return request submitted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
