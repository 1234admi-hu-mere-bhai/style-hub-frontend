// Shared helper: auto-create a Delhivery REVERSE pickup shipment when an
// admin approves a return. Generates a reverse AWB so the customer immediately
// sees pickup tracking. sync-delhivery-status (cron) then advances the status
// to "picked_up" → triggers payu-refund automatically.

const DELHIVERY_BASE = 'https://track.delhivery.com';

export async function autoCreateDelhiveryReversePickup(
  admin: any,
  orderId: string,
): Promise<{ awb: string | null; skipped?: string; error?: string }> {
  const DELHIVERY_API_KEY = Deno.env.get('DELHIVERY_API_KEY');
  if (!DELHIVERY_API_KEY) return { awb: null, skipped: 'no_api_key' };

  try {
    const { data: order, error: oErr } = await admin
      .from('orders')
      .select('id, order_number, total, payment_method, shipping_address, reverse_awb')
      .eq('id', orderId)
      .single();

    if (oErr || !order) return { awb: null, error: 'order_not_found' };
    if (order.reverse_awb) return { awb: order.reverse_awb, skipped: 'already_has_reverse_awb' };

    const { data: items } = await admin
      .from('order_items')
      .select('product_name, quantity, size, color')
      .eq('order_id', orderId);

    const itemList = (items as any[] | null) || [];
    const productsDesc =
      itemList
        .map((i) => `${i.product_name}${i.size ? ` (${i.size})` : ''} x${i.quantity}`)
        .join(', ')
        .slice(0, 250) || 'Apparel';
    const totalQty = itemList.reduce((s, i) => s + (i.quantity || 0), 0) || 1;

    const addr = order.shipping_address || {};
    const fullName =
      (addr.firstName && addr.lastName
        ? `${addr.firstName} ${addr.lastName}`
        : addr.full_name || addr.name || 'Customer').trim();

    // Reverse pickup shipment — payment_mode "Pickup" tells Delhivery this is
    // a return pickup from the customer back to the seller warehouse.
    const shipment = {
      name: fullName,
      add: addr.address || '',
      pin: String(addr.pincode || ''),
      city: addr.city || '',
      state: addr.state || '',
      country: 'India',
      phone: String(addr.phone || ''),
      order: `RET-${order.order_number}`,
      payment_mode: 'Pickup',
      total_amount: String(order.total),
      products_desc: productsDesc,
      quantity: String(totalQty),
      shipment_width: '20',
      shipment_height: '15',
      shipment_length: '25',
      weight: '500',
      seller_name: 'MUFFIGOUT APPAREL HUB',
    };

    const payload = `format=json&data=${encodeURIComponent(JSON.stringify({
      shipments: [shipment],
      pickup_location: { name: 'Muffigout Warehouse' },
    }))}`;

    const resp = await fetch(`${DELHIVERY_BASE}/api/cmu/create.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DELHIVERY_API_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: payload,
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      console.error('auto-reverse-pickup delhivery error', resp.status, data);
      return { awb: null, error: `delhivery_${resp.status}` };
    }

    const awb =
      data?.packages?.[0]?.waybill ||
      data?.upload_wbn ||
      data?.waybill ||
      null;

    if (!awb) {
      console.error('auto-reverse-pickup no AWB returned', data);
      return { awb: null, error: 'no_awb_returned' };
    }

    await admin
      .from('orders')
      .update({ reverse_awb: awb, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    return { awb };
  } catch (e) {
    console.error('autoCreateDelhiveryReversePickup exception', e);
    return { awb: null, error: 'exception' };
  }
}
