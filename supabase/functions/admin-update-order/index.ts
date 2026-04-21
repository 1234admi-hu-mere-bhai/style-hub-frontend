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

    const body = await req.json()
    const { orderId, status, refund_amount, refund_eta, rejection_reason, tracking_awb } = body
    if (!orderId) {
      return new Response(JSON.stringify({ error: 'orderId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    const updateData: any = { updated_at: new Date().toISOString() }
    if (status) {
      updateData.status = status
      if (status === 'delivered') updateData.delivered_at = new Date().toISOString()
    }
    if (refund_amount !== undefined) {
      const amt = Number(refund_amount)
      if (Number.isNaN(amt) || amt < 0) {
        return new Response(JSON.stringify({ error: 'Invalid refund_amount' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      updateData.refund_amount = amt
    }
    if (refund_eta !== undefined) {
      if (refund_eta === null) {
        updateData.refund_eta = null
      } else {
        const d = new Date(refund_eta)
        if (Number.isNaN(d.getTime())) {
          return new Response(JSON.stringify({ error: 'Invalid refund_eta' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        updateData.refund_eta = d.toISOString()
      }
    }
    if (rejection_reason !== undefined) {
      updateData.rejection_reason = rejection_reason ? String(rejection_reason).slice(0, 1000) : null
    }
    if (tracking_awb !== undefined) {
      const awbStr = tracking_awb === null ? null : String(tracking_awb).trim().slice(0, 64)
      if (awbStr && !/^[A-Za-z0-9-]+$/.test(awbStr)) {
        return new Response(JSON.stringify({ error: 'Invalid tracking_awb format' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      updateData.tracking_awb = awbStr || null
    }

    // Fetch current order to detect transitions
    const { data: prevOrder } = await adminClient
      .from('orders')
      .select('id, user_id, order_number, status, refund_amount, refund_eta, total, rejection_reason')
      .eq('id', orderId)
      .maybeSingle()

    const { error: updateError } = await adminClient
      .from('orders')
      .update(updateData)
      .eq('id', orderId)

    if (updateError) throw updateError

    // Re-fetch to get post-trigger values (refund_amount/eta auto-set on return_approved)
    const { data: nextOrder } = await adminClient
      .from('orders')
      .select('id, user_id, order_number, status, refund_amount, refund_eta, rejection_reason')
      .eq('id', orderId)
      .maybeSingle()

    // Detect refund-related status transitions and notify customer
    if (prevOrder && nextOrder && prevOrder.status !== nextOrder.status) {
      let notif: { title: string; message: string; tag: string } | null = null

      if (nextOrder.status === 'return_approved') {
        const amt = Number(nextOrder.refund_amount ?? prevOrder.total ?? 0)
        const etaStr = nextOrder.refund_eta
          ? new Date(nextOrder.refund_eta).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
          : 'soon'
        notif = {
          title: 'Refund Approved ✅',
          message: `Your refund of ₹${amt.toLocaleString('en-IN')} for order ${nextOrder.order_number} is approved. Expected by ${etaStr}.`,
          tag: `refund-${nextOrder.id}`,
        }
      } else if (nextOrder.status === 'refund_processed') {
        const amt = Number(nextOrder.refund_amount ?? prevOrder.total ?? 0)
        notif = {
          title: 'Refund Processed 💸',
          message: `Your refund of ₹${amt.toLocaleString('en-IN')} for order ${nextOrder.order_number} has been issued to your original payment method.`,
          tag: `refund-${nextOrder.id}`,
        }
      } else if (nextOrder.status === 'return_rejected') {
        const reason = nextOrder.rejection_reason || 'Please contact support for details.'
        notif = {
          title: 'Return Request Rejected ❌',
          message: `Your return request for order ${nextOrder.order_number} was rejected. Reason: ${reason}`,
          tag: `return-rejected-${nextOrder.id}`,
        }
      }

      if (notif && nextOrder.user_id) {
        // Insert in-app notification scoped to this user (best effort)
        try {
          await adminClient.from('notifications').insert({
            title: notif.title,
            message: notif.message,
            type: 'order',
            user_id: nextOrder.user_id,
          })
        } catch (e) {
          console.error('notifications insert failed:', e)
        }

        // Send push to that user (best effort)
        try {
          await anonClient.functions.invoke('send-push', {
            body: {
              userId: nextOrder.user_id,
              title: notif.title,
              message: notif.message,
              url: '/track-order',
              tag: notif.tag,
            },
          })
        } catch (e) {
          console.error('send-push invoke failed:', e)
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
