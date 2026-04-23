const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const DELHIVERY_BASE = 'https://track.delhivery.com';

// Map Delhivery statuses to our order statuses
function mapDelhiveryStatus(delhiveryStatus: string): string | null {
  const s = delhiveryStatus?.toLowerCase() || '';
  if (s.includes('delivered')) return 'delivered';
  if (s.includes('out for delivery') || s.includes('out_for_delivery')) return 'out_for_delivery';
  // Distinguish "picked up" (return courier collected) from generic in-transit
  if (s.includes('picked up') || s.includes('picked_up') || s.includes('pickup done')) return 'picked_up';
  if (s.includes('in transit') || s.includes('dispatched') || s.includes('shipped')) return 'shipped';
  if (s.includes('cancelled') || s.includes('rto')) return 'cancelled';
  // Manifested means Delhivery has accepted the shipment but pickup hasn't happened yet
  // → auto-confirm the order so it moves out of "placed"
  if (s.includes('manifested') || s.includes('pickup scheduled') || s.includes('pickup awaited')) return 'confirmed';
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const DELHIVERY_API_KEY = Deno.env.get('DELHIVERY_API_KEY');
  if (!DELHIVERY_API_KEY) {
    return new Response(JSON.stringify({ error: 'DELHIVERY_API_KEY not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Fetch all orders that have a tracking AWB and are not in a terminal state.
    // Includes return/replacement statuses so we can detect when courier picks the package up
    // and auto-fire a refund.
    const { data: orders, error: fetchError } = await serviceClient
      .from('orders')
      .select('id, tracking_awb, status, payment_method, payment_status')
      .not('tracking_awb', 'is', null)
      .not('status', 'in', '("delivered","cancelled","replacement_delivered","refund_processed")');

    if (fetchError) throw fetchError;

    if (!orders || orders.length === 0) {
      return new Response(JSON.stringify({ message: 'No orders to sync', updated: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let updated = 0;
    const errors: string[] = [];

    for (const order of orders) {
      try {
        const response = await fetch(
          `${DELHIVERY_BASE}/api/v1/packages/json/?waybill=${encodeURIComponent(order.tracking_awb!)}`,
          {
            headers: {
              'Authorization': `Token ${DELHIVERY_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          errors.push(`AWB ${order.tracking_awb}: HTTP ${response.status}`);
          await response.text();
          continue;
        }

        const data = await response.json();
        const shipment = data?.ShipmentData?.[0]?.Shipment;
        if (!shipment) continue;

        const delhiveryStatus = shipment.Status?.Status || '';
        const newStatus = mapDelhiveryStatus(delhiveryStatus);

        if (!newStatus || newStatus === order.status) continue;

        // Special-case: if order is in return flow (return_approved / picked_up_pending),
        // a Delhivery "picked up" status means the package was collected from customer →
        // trigger automatic refund.
        const inReturnFlow = ['return_approved', 'return_requested', 'picked_up_pending'].includes(order.status);
        if (newStatus === 'picked_up' && inReturnFlow) {
          await serviceClient
            .from('orders')
            .update({ status: 'picked_up', updated_at: new Date().toISOString() })
            .eq('id', order.id);

          // Get order_number + user_id for notifications
          const { data: notifOrder } = await serviceClient
            .from('orders')
            .select('order_number, user_id')
            .eq('id', order.id)
            .maybeSingle();

          // Notify user that pickup happened
          if (notifOrder?.user_id) {
            try {
              await serviceClient.from('notifications').insert({
                title: 'Package Picked Up 📦',
                message: `Your return for order ${notifOrder.order_number} has been picked up by our courier. Refund is being processed to your original payment method.`,
                type: 'order',
                user_id: notifOrder.user_id,
              });
            } catch (e) {
              console.error('pickup notification insert failed:', e);
            }
            try {
              await serviceClient.functions.invoke('send-push', {
                body: {
                  userId: notifOrder.user_id,
                  title: 'Package Picked Up 📦',
                  message: `Return for order ${notifOrder.order_number} collected. Refund being processed.`,
                  url: `/track-order?id=${notifOrder.order_number}`,
                  tag: `pickup-${order.id}`,
                },
              });
            } catch (e) {
              console.error('pickup push failed:', e);
            }
          }

          // Fire-and-forget refund (idempotent on the function side)
          try {
            await serviceClient.functions.invoke('payu-refund', {
              body: { orderId: order.id },
            });
          } catch (e) {
            console.error(`Refund trigger failed for ${order.id}:`, e);
          }
          updated++;
          continue;
        }

        // Only progress forward (don't regress status) for normal forward flow
        const statusOrder = ['placed', 'confirmed', 'shipped', 'out_for_delivery', 'delivered'];
        const currentIdx = statusOrder.indexOf(order.status);
        const newIdx = statusOrder.indexOf(newStatus);

        // Allow cancellation from any state, otherwise only progress forward
        if (newStatus !== 'cancelled' && newIdx <= currentIdx) continue;

        const updateData: Record<string, unknown> = {
          status: newStatus,
          updated_at: new Date().toISOString(),
        };
        if (newStatus === 'delivered') {
          updateData.delivered_at = new Date().toISOString();
        }

        const { error: updateError } = await serviceClient
          .from('orders')
          .update(updateData)
          .eq('id', order.id);

        if (updateError) {
          errors.push(`Order ${order.id}: ${updateError.message}`);
        } else {
          updated++;
          console.log(`Order ${order.id}: ${order.status} → ${newStatus}`);

          // 📧 Send shipped/delivered email when status transitions
          if (newStatus === 'shipped' || newStatus === 'delivered') {
            try {
              const { data: full } = await serviceClient
                .from('orders')
                .select('order_number, user_id, tracking_awb')
                .eq('id', order.id)
                .maybeSingle();
              if (full?.user_id) {
                const { data: au } = await serviceClient.auth.admin.getUserById(full.user_id);
                const recipientEmail = au?.user?.email || '';
                if (recipientEmail) {
                  const { data: prof } = await serviceClient
                    .from('profiles')
                    .select('first_name')
                    .eq('id', full.user_id)
                    .maybeSingle();
                  const firstName = prof?.first_name || '';
                  // Fetch order items for richer email content
                  const { data: itemRows } = await serviceClient
                    .from('order_items')
                    .select('product_name, image, size, color, quantity, price')
                    .eq('order_id', order.id);
                  const items = (itemRows || []).map((r: any) => ({
                    name: r.product_name || 'Item',
                    image: r.image || undefined,
                    size: r.size || undefined,
                    color: r.color || undefined,
                    quantity: Number(r.quantity) || 1,
                    price: Number(r.price) || 0,
                  }));

                  if (newStatus === 'shipped') {
                    const eta = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
                      weekday: 'short', day: '2-digit', month: 'short',
                    });
                    await serviceClient.functions.invoke('send-transactional-email', {
                      body: {
                        templateName: 'order-shipped',
                        recipientEmail,
                        idempotencyKey: `order-shipped-${order.id}-${full.tracking_awb || 'noawb'}`,
                        templateData: {
                          customerName: firstName,
                          orderNumber: full.order_number,
                          trackingAwb: full.tracking_awb || '',
                          courier: 'Delhivery',
                          estimatedDelivery: eta,
                          items,
                        },
                      },
                    });
                  } else {
                    const deliveredDate = new Date().toLocaleDateString('en-IN', {
                      weekday: 'short', day: '2-digit', month: 'short',
                    });
                    await serviceClient.functions.invoke('send-transactional-email', {
                      body: {
                        templateName: 'order-delivered',
                        recipientEmail,
                        idempotencyKey: `order-delivered-${order.id}`,
                        templateData: {
                          customerName: firstName,
                          orderNumber: full.order_number,
                          trackingAwb: full.tracking_awb || '',
                          deliveredDate,
                          items,
                        },
                      },
                    });
                  }
                }
              }
            } catch (e) {
              console.error(`${newStatus} email failed for ${order.id}:`, e);
            }
          }
        }
      } catch (e) {
        errors.push(`AWB ${order.tracking_awb}: ${e instanceof Error ? e.message : 'unknown'}`);
      }
    }

    return new Response(JSON.stringify({
      message: `Synced ${orders.length} orders, updated ${updated}`,
      updated,
      total: orders.length,
      errors: errors.length > 0 ? errors : undefined,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Sync error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
