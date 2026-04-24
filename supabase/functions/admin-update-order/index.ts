import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const OWNER_EMAILS = ['otw2003@gmail.com', 'kaliasgar776@gmail.com']
const LEGACY_ADMIN_EMAILS = ['muffigout@gmail.com', ...OWNER_EMAILS]

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
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey)
    const userEmail = (user.email ?? '').toLowerCase()
    const isOwner = OWNER_EMAILS.includes(userEmail) || LEGACY_ADMIN_EMAILS.includes(userEmail)
    let actorRole: 'owner' | 'staff' = isOwner ? 'owner' : 'staff'
    if (!isOwner) {
      const { data: staff } = await adminClient
        .from('staff_members').select('status, permissions').eq('user_id', user.id).maybeSingle()
      const perms = (staff?.permissions || {}) as Record<string, boolean>
      if (!staff || staff.status !== 'active' || !perms.orders) {
        return new Response(JSON.stringify({ error: 'Forbidden: missing permission for orders' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    const body = await req.json()
    const { orderId, status, refund_amount, refund_eta, rejection_reason, tracking_awb } = body
    if (!orderId) {
      return new Response(JSON.stringify({ error: 'orderId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

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
      .select('id, user_id, order_number, status, refund_amount, refund_eta, total, rejection_reason, tracking_awb')
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
      .select('id, user_id, order_number, status, refund_amount, refund_eta, rejection_reason, tracking_awb')
      .eq('id', orderId)
      .maybeSingle()

    // Helper: lookup recipient email + first name
    const getRecipient = async (userId: string | null) => {
      if (!userId) return { email: '', firstName: '' }
      const { data: au } = await adminClient.auth.admin.getUserById(userId)
      const { data: prof } = await adminClient.from('profiles').select('first_name').eq('id', userId).maybeSingle()
      return { email: au?.user?.email || '', firstName: prof?.first_name || '' }
    }

    // 📦 Send "shipped" email when admin assigns/changes tracking_awb (and status moves to shipped)
    const awbAssigned = updateData.tracking_awb && updateData.tracking_awb !== prevOrder?.tracking_awb
    const movedToShipped = nextOrder && prevOrder && prevOrder.status !== 'shipped' && nextOrder.status === 'shipped'
    // Helper to fetch order items formatted for emails
    const fetchEmailItems = async (orderId: string) => {
      const { data: rows } = await adminClient
        .from('order_items')
        .select('product_name, image, size, color, quantity, price')
        .eq('order_id', orderId)
      return (rows || []).map((r: any) => ({
        name: r.product_name || 'Item',
        image: r.image || undefined,
        size: r.size || undefined,
        color: r.color || undefined,
        quantity: Number(r.quantity) || 1,
        price: Number(r.price) || 0,
      }))
    }

    if (nextOrder && (awbAssigned || movedToShipped)) {
      try {
        const { email: recipientEmail, firstName } = await getRecipient(nextOrder.user_id)
        if (recipientEmail) {
          const items = await fetchEmailItems(nextOrder.id)
          const eta = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
            weekday: 'short', day: '2-digit', month: 'short',
          })
          await adminClient.functions.invoke('send-transactional-email', {
            body: {
              templateName: 'order-shipped',
              recipientEmail,
              idempotencyKey: `order-shipped-${nextOrder.id}-${nextOrder.tracking_awb || 'noawb'}`,
              templateData: {
                customerName: firstName,
                orderNumber: nextOrder.order_number,
                trackingAwb: nextOrder.tracking_awb || '',
                courier: 'Delhivery',
                estimatedDelivery: eta,
                items,
              },
            },
          })
        }
      } catch (e) {
        console.error('order-shipped email failed:', e)
      }
    }

    // ✅ Send "delivered" email when admin marks order delivered
    if (nextOrder && prevOrder && prevOrder.status !== 'delivered' && nextOrder.status === 'delivered') {
      try {
        const { email: recipientEmail, firstName } = await getRecipient(nextOrder.user_id)
        if (recipientEmail) {
          const items = await fetchEmailItems(nextOrder.id)
          const deliveredDate = new Date(nextOrder.delivered_at || Date.now()).toLocaleDateString('en-IN', {
            weekday: 'short', day: '2-digit', month: 'short',
          })
          await adminClient.functions.invoke('send-transactional-email', {
            body: {
              templateName: 'order-delivered',
              recipientEmail,
              idempotencyKey: `order-delivered-${nextOrder.id}`,
              templateData: {
                customerName: firstName,
                orderNumber: nextOrder.order_number,
                trackingAwb: nextOrder.tracking_awb || '',
                deliveredDate,
                items,
              },
            },
          })
        }
      } catch (e) {
        console.error('order-delivered email failed:', e)
      }
    }

    // 🔁 Auto-trigger PayU refund when admin marks the package as picked up
    if (
      prevOrder &&
      nextOrder &&
      prevOrder.status !== nextOrder.status &&
      nextOrder.status === 'picked_up'
    ) {
      try {
        await adminClient.functions.invoke('payu-refund', {
          body: { orderId: nextOrder.id },
        })
      } catch (e) {
        console.error('payu-refund invoke failed:', e)
      }
    }

    // Detect status transitions and notify customer
    if (prevOrder && nextOrder && prevOrder.status !== nextOrder.status) {
      let notif: { title: string; message: string; tag: string; url: string } | null = null;
      // Mask order number for lock-screen / preview privacy (last 4 only)
      const maskedOrder = nextOrder.order_number
        ? `••••${String(nextOrder.order_number).slice(-4)}`
        : '';

      if (nextOrder.status === 'shipped') {
        notif = {
          title: '📦 Order Shipped',
          message: `Your order ${maskedOrder} is on its way! Track it live.`,
          tag: `shipped-${nextOrder.id}`,
          url: `/track-order?id=${nextOrder.order_number}`,
        };
      } else if (nextOrder.status === 'out_for_delivery') {
        notif = {
          title: '🚚 Out for Delivery',
          message: `Your order ${maskedOrder} arrives today. Keep your phone handy!`,
          tag: `ofd-${nextOrder.id}`,
          url: `/track-order?id=${nextOrder.order_number}`,
        };
      } else if (nextOrder.status === 'delivered') {
        notif = {
          title: '🎉 Delivered!',
          message: `Order ${maskedOrder} has been delivered. Rate your experience!`,
          tag: `delivered-${nextOrder.id}`,
          url: `/track-order?id=${nextOrder.order_number}`,
        };
      } else if (nextOrder.status === 'return_approved') {
        const amt = Number(nextOrder.refund_amount ?? prevOrder.total ?? 0);
        const etaStr = nextOrder.refund_eta
          ? new Date(nextOrder.refund_eta).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
          : 'soon';
        notif = {
          title: 'Refund Approved ✅',
          message: `Your refund of ₹${amt.toLocaleString('en-IN')} for order ${maskedOrder} is approved. Expected by ${etaStr}.`,
          tag: `refund-${nextOrder.id}`,
          url: `/track-order?id=${nextOrder.order_number}`,
        };
      } else if (nextOrder.status === 'picked_up') {
        notif = {
          title: 'Package Picked Up 📦',
          message: `Your return for order ${maskedOrder} has been picked up. Refund is being processed.`,
          tag: `pickup-${nextOrder.id}`,
          url: `/track-order?id=${nextOrder.order_number}`,
        };
      } else if (nextOrder.status === 'refund_processed') {
        const amt = Number(nextOrder.refund_amount ?? prevOrder.total ?? 0);
        notif = {
          title: 'Refund Processed 💸',
          message: `Your refund of ₹${amt.toLocaleString('en-IN')} for order ${maskedOrder} has been issued.`,
          tag: `refund-${nextOrder.id}`,
          url: `/track-order?id=${nextOrder.order_number}`,
        };
      } else if (nextOrder.status === 'return_rejected') {
        const reason = nextOrder.rejection_reason || 'Please contact support for details.';
        notif = {
          title: 'Return Request Rejected ❌',
          message: `Your return request for order ${maskedOrder} was rejected. Reason: ${reason}`,
          tag: `return-rejected-${nextOrder.id}`,
          url: `/track-order?id=${nextOrder.order_number}`,
        };
      }

      if (notif && nextOrder.user_id) {
        try {
          await adminClient.from('notifications').insert({
            title: notif.title, message: notif.message, type: 'order', user_id: nextOrder.user_id,
          });
        } catch (e) { console.error('notifications insert failed:', e); }

        try {
          await adminClient.functions.invoke('send-push', {
            body: {
              userId: nextOrder.user_id,
              title: notif.title,
              message: notif.message,
              url: notif.url,
              tag: notif.tag,
              category: 'orders',
              dedupeKey: `${notif.tag}`,
            },
          });
        } catch (e) {
          console.error('send-push invoke failed:', e);
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
