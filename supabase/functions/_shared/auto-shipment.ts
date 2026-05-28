// Shared helper: auto-create a Delhivery shipment for a freshly placed order.
// Called inline from create-cod-order and verify-payment so customers get an
// AWB immediately. sync-delhivery-status (cron) then advances the timeline
// (placed → confirmed → shipped → out_for_delivery → delivered) automatically.

const DELHIVERY_BASE = 'https://track.delhivery.com';

interface OrderRow {
  id: string;
  order_number: string;
  total: number;
  cod_fee: number;
  payment_method: string;
  payment_status: string;
  shipping_address: any;
  tracking_awb?: string | null;
}

interface OrderItemRow {
  product_name: string;
  quantity: number;
  size?: string | null;
  color?: string | null;
}

export async function autoCreateDelhiveryShipment(
  admin: any,
  orderId: string,
): Promise<{ awb: string | null; skipped?: string; error?: string }> {
  const DELHIVERY_API_KEY = Deno.env.get('DELHIVERY_API_KEY');
  if (!DELHIVERY_API_KEY) return { awb: null, skipped: 'no_api_key' };

  try {
    const { data: order, error: oErr } = await admin
      .from('orders')
      .select('id, order_number, total, cod_fee, payment_method, payment_status, shipping_address, tracking_awb')
      .eq('id', orderId)
      .single();

    if (oErr || !order) return { awb: null, error: 'order_not_found' };
    const o = order as OrderRow;
    if (o.tracking_awb) return { awb: o.tracking_awb, skipped: 'already_has_awb' };

    const { data: items } = await admin
      .from('order_items')
      .select('product_name, quantity, size, color')
      .eq('order_id', orderId);

    const itemList = (items as OrderItemRow[] | null) || [];
    const productsDesc = itemList
      .map((i) => `${i.product_name}${i.size ? ` (${i.size})` : ''} x${i.quantity}`)
      .join(', ')
      .slice(0, 250) || 'Apparel';
    const totalQty = itemList.reduce((s, i) => s + (i.quantity || 0), 0) || 1;

    const addr = o.shipping_address || {};
    const fullName =
      (addr.firstName && addr.lastName ? `${addr.firstName} ${addr.lastName}` : addr.full_name || addr.name || 'Customer').trim();
    const isCod = (o.payment_method || '').toLowerCase().includes('cash') || o.payment_status === 'cod_pending';

    const shipment = {
      name: fullName,
      add: addr.address || '',
      pin: String(addr.pincode || ''),
      city: addr.city || '',
      state: addr.state || '',
      country: 'India',
      phone: String(addr.phone || ''),
      order: o.order_number,
      payment_mode: isCod ? 'COD' : 'Prepaid',
      cod_amount: isCod ? String(o.total) : '0',
      total_amount: String(o.total),
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
      console.error('auto-shipment delhivery error', resp.status, data);
      return { awb: null, error: `delhivery_${resp.status}` };
    }

    const awb =
      data?.packages?.[0]?.waybill ||
      data?.upload_wbn ||
      data?.waybill ||
      null;

    if (!awb) {
      console.error('auto-shipment no AWB returned', data);
      return { awb: null, error: 'no_awb_returned' };
    }

    // Mark as confirmed (not shipped) — sync-delhivery-status will advance
    // to shipped / out_for_delivery / delivered automatically.
    await admin
      .from('orders')
      .update({ tracking_awb: awb, status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('id', orderId);

    return { awb };
  } catch (e) {
    console.error('autoCreateDelhiveryShipment exception', e);
    return { awb: null, error: 'exception' };
  }
}
