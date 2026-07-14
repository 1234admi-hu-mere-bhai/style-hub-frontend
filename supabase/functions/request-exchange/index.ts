import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: userError } = await anonClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json().catch(() => ({}))
    const orderId: string | undefined = body.orderId
    const orderItemId: string | undefined = body.orderItemId
    const exchangeSize: string = (body.exchangeSize || '').toString().trim()
    const exchangeColor: string = (body.exchangeColor || '').toString().trim()
    const reason: string = (body.reason || '').toString().trim()

    if (!orderId) {
      return new Response(JSON.stringify({ error: 'orderId is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!exchangeSize && !exchangeColor) {
      return new Response(JSON.stringify({ error: 'Please choose a new size or color' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (reason.length < 5) {
      return new Response(JSON.stringify({ error: 'Please provide a reason (at least 5 characters)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(supabaseUrl, supabaseServiceKey)

    const { data: order, error: orderError } = await admin
      .from('orders')
      .select('id, user_id, status, delivered_at, order_number, total')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (order.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (order.status !== 'delivered') {
      return new Response(JSON.stringify({ error: 'Only delivered orders can be exchanged' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (order.delivered_at) {
      const daysSince = (Date.now() - new Date(order.delivered_at).getTime()) / 86_400_000
      if (daysSince > 7) {
        return new Response(JSON.stringify({ error: 'Exchange window has expired (7 days from delivery)' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // Fetch the target order item to compare variants
    const itemQuery = admin
      .from('order_items')
      .select('id, order_id, product_id, size, color')
      .eq('order_id', orderId)
    const { data: itemsData } = orderItemId
      ? await itemQuery.eq('id', orderItemId).limit(1)
      : await itemQuery.limit(1)
    const item = itemsData?.[0]
    if (!item) {
      return new Response(JSON.stringify({ error: 'Order item not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const sameSize = (exchangeSize || item.size || '').toLowerCase() === (item.size || '').toLowerCase()
    const sameColor = (exchangeColor || item.color || '').toLowerCase() === (item.color || '').toLowerCase()
    if (sameSize && sameColor) {
      return new Response(JSON.stringify({ error: 'Please choose a different size or color from your original item' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Prevent duplicate exchange for same order
    const { data: existing } = await admin
      .from('returns')
      .select('id, request_type, status')
      .eq('order_id', orderId)
      .maybeSingle()
    if (existing && existing.status !== 'rejected' && existing.status !== 'cancelled') {
      return new Response(JSON.stringify({ error: 'A return or exchange is already in progress for this order' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Update order status
    await admin
      .from('orders')
      .update({
        status: 'return_requested',
        return_reason: `Exchange: ${reason}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    // Insert exchange row (no refund methods — same-value swap)
    const { error: insErr } = await admin.from('returns').insert({
      order_id: orderId,
      user_id: user.id,
      reason_code: 'user_exchange',
      reason_details: reason.slice(0, 1000),
      refund_amount: 0,
      status: 'pending',
      allowed_refund_methods: [],
      request_type: 'exchange',
      exchange_size: exchangeSize || null,
      exchange_color: exchangeColor || null,
    } as any)
    if (insErr) throw insErr

    try {
      const maskedOrder = order.order_number ? `••••${String(order.order_number).slice(-4)}` : ''
      await admin.functions.invoke('send-push', {
        body: {
          userId: order.user_id,
          title: '🔁 Exchange Requested',
          message: `Your exchange for order ${maskedOrder} is being reviewed. We'll update you soon.`,
          url: `/track-order?id=${order.order_number || ''}`,
          tag: `exchange-req-${orderId}`,
          category: 'orders',
          dedupeKey: `exchange-req-${orderId}`,
        },
      })
    } catch (e) { console.error('exchange push failed:', e) }

    return new Response(
      JSON.stringify({ success: true, message: 'Exchange request submitted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error: any) {
    console.error('request-exchange error', error)
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
