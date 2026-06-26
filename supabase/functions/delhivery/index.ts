const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const DELHIVERY_BASE = 'https://track.delhivery.com';

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

  try {
    const { action, ...params } = await req.json();

    // Auth check for admin actions
    const authHeader = req.headers.get('Authorization');

    switch (action) {
      case 'track': {
        // Track by AWB number — authenticated users only
        const anonClientTrack = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: { headers: { Authorization: authHeader || '' } },
        });
        const token = authHeader?.replace('Bearer ', '') || '';
        const { data: claimsData, error: claimsError } = await anonClientTrack.auth.getClaims(token);
        if (claimsError || !claimsData?.claims) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { waybill } = params;
        if (!waybill) {
          return new Response(JSON.stringify({ error: 'waybill is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const response = await fetch(
          `${DELHIVERY_BASE}/api/v1/packages/json/?waybill=${encodeURIComponent(waybill)}`,
          {
            headers: {
              'Authorization': `Token ${DELHIVERY_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const data = await response.json();
        if (!response.ok) {
          throw new Error(`Delhivery tracking API failed [${response.status}]: ${JSON.stringify(data)}`);
        }

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'create_shipment': {
        // Admin only — create a shipment on Delhivery
        const ADMIN_EMAILS = ['muffigout@gmail.com', 'admin@muffigout.com'];
        const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: { headers: { Authorization: authHeader || '' } },
        });
        const { data: { user }, error: authError } = await anonClient.auth.getUser();
        if (authError || !user || !ADMIN_EMAILS.includes(user.email || '')) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { orderId, shipmentData } = params;
        if (!orderId || !shipmentData) {
          return new Response(JSON.stringify({ error: 'orderId and shipmentData are required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Create order on Delhivery
        const shipmentPayload = `format=json&data=${encodeURIComponent(JSON.stringify({
          shipments: [shipmentData],
          pickup_location: shipmentData.pickup_location || {
            name: 'Muffigout Warehouse',
          },
        }))}`;

        const createResponse = await fetch(
          `${DELHIVERY_BASE}/api/cmu/create.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Token ${DELHIVERY_API_KEY}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: shipmentPayload,
          }
        );

        const createData = await createResponse.json();
        if (!createResponse.ok) {
          throw new Error(`Delhivery create shipment failed [${createResponse.status}]: ${JSON.stringify(createData)}`);
        }

        // Extract waybill from response and save to order
        const awb = createData?.packages?.[0]?.waybill ||
                     createData?.upload_wbn ||
                     createData?.waybill || null;

        if (awb) {
          const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
          await serviceClient
            .from('orders')
            .update({ tracking_awb: awb, status: 'shipped', updated_at: new Date().toISOString() })
            .eq('id', orderId);
        }

        return new Response(JSON.stringify({ success: true, data: createData, awb }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'check_pincode': {
        // Require a valid Supabase session (anon or authenticated) to prevent
        // unauthenticated proxy abuse of our Delhivery API key.
        const anonClientPin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: { headers: { Authorization: authHeader || '' } },
        });
        const pinToken = authHeader?.replace('Bearer ', '') || '';
        const { data: pinClaims, error: pinClaimsErr } = await anonClientPin.auth.getClaims(pinToken);
        if (pinClaimsErr || !pinClaims?.claims) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check if pincode is serviceable by Delhivery
        const { pincode } = params;
        if (!pincode) {
          return new Response(JSON.stringify({ error: 'pincode is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const response = await fetch(
          `${DELHIVERY_BASE}/c/api/pin-codes/json/?filter_codes=${encodeURIComponent(pincode)}`,
          {
            headers: {
              'Authorization': `Token ${DELHIVERY_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const data = await response.json();
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'estimate_delivery': {
        // Require a valid Supabase session (anon or authenticated) to prevent
        // unauthenticated proxy abuse of our Delhivery API key/quota.
        const anonClientEst = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: { headers: { Authorization: authHeader || '' } },
        });
        const estToken = authHeader?.replace('Bearer ', '') || '';
        const { data: estClaims, error: estClaimsErr } = await anonClientEst.auth.getClaims(estToken);
        if (estClaimsErr || !estClaims?.claims) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Public action: returns Delhivery's serviceability + recommended TAT
        // for our warehouse origin -> destination pincode. Results are cached
        // for 24h in public.pincode_estimates to limit upstream calls.
        const { pincode } = params;
        if (!pincode || !/^\d{6}$/.test(String(pincode))) {
          return new Response(JSON.stringify({ error: 'valid 6-digit pincode is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const originPin = Deno.env.get('WAREHOUSE_PINCODE') || '';
        const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // 1. Try cache (24h TTL)
        const { data: cached } = await serviceClient
          .from('pincode_estimates')
          .select('*')
          .eq('pincode', pincode)
          .maybeSingle();

        if (cached) {
          const ageMs = Date.now() - new Date(cached.fetched_at).getTime();
          if (ageMs < 24 * 60 * 60 * 1000) {
            return new Response(JSON.stringify({
              serviceable: cached.serviceable,
              city: cached.city,
              state: cached.state,
              codAvailable: cached.cod_available,
              prepaidAvailable: cached.prepaid_available,
              tatDays: cached.tat_days,
              estimatedDays: cached.estimated_days,
              zone: cached.zone,
              cached: true,
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
        }

        // 2. Serviceability (city/state/COD)
        let serviceable = false;
        let city: string | null = null;
        let state: string | null = null;
        let codAvailable = false;
        let prepaidAvailable = true;

        try {
          const svcRes = await fetch(
            `${DELHIVERY_BASE}/c/api/pin-codes/json/?filter_codes=${encodeURIComponent(pincode)}`,
            { headers: { 'Authorization': `Token ${DELHIVERY_API_KEY}` } }
          );
          const svcData = await svcRes.json();
          const pc = svcData?.delivery_codes?.[0]?.postal_code;
          if (pc) {
            serviceable = true;
            city = pc.city || pc.district || null;
            state = pc.state_code || pc.state || null;
            codAvailable = String(pc.cod || '').toUpperCase() === 'Y';
            prepaidAvailable = String(pc.pre_paid || 'Y').toUpperCase() === 'Y';
          }
        } catch (e) {
          console.error('Delhivery serviceability lookup failed', e);
        }

        // 3. TAT (expected transit days). Best-effort: parse common shapes.
        let tatDays: number | null = null;
        if (serviceable && originPin) {
          try {
            const tatRes = await fetch(
              `${DELHIVERY_BASE}/api/dc/expected_tat?origin_pin=${originPin}&destination_pin=${pincode}&mot=S&pdt=B2C`,
              { headers: { 'Authorization': `Token ${DELHIVERY_API_KEY}` } }
            );
            if (tatRes.ok) {
              const tatJson = await tatRes.json();
              const raw =
                tatJson?.data?.tat ??
                tatJson?.tat ??
                tatJson?.expected_tat ??
                tatJson?.data?.expected_tat ??
                null;
              const n = typeof raw === 'string' ? parseInt(raw, 10) : Number(raw);
              if (Number.isFinite(n) && n > 0) tatDays = n;
            }
          } catch (e) {
            console.error('Delhivery TAT lookup failed', e);
          }

          // Fallback to invoice/charges which also returns a tat field
          if (tatDays === null) {
            try {
              const chRes = await fetch(
                `${DELHIVERY_BASE}/api/kinko/v1/invoice/charges/.json?md=S&ss=Delivered&d_pin=${pincode}&o_pin=${originPin}&cgm=500&pt=Pre-paid`,
                { headers: { 'Authorization': `Token ${DELHIVERY_API_KEY}` } }
              );
              if (chRes.ok) {
                const chJson = await chRes.json();
                const first = Array.isArray(chJson) ? chJson[0] : chJson;
                const raw = first?.tat ?? first?.expected_tat ?? null;
                const n = typeof raw === 'string' ? parseInt(raw, 10) : Number(raw);
                if (Number.isFinite(n) && n > 0) tatDays = n;
              }
            } catch (e) {
              console.error('Delhivery charges TAT fallback failed', e);
            }
          }
        }

        // 4. Format human-readable range (add buffer day on each side)
        let estimatedDays: string | null = null;
        if (tatDays !== null) {
          const lo = Math.max(1, tatDays);
          const hi = tatDays + 2;
          estimatedDays = `${lo}–${hi}`;
        }

        const zone = serviceable ? 'Delhivery Network' : '';

        // 5. Upsert cache (best effort)
        try {
          await serviceClient.from('pincode_estimates').upsert({
            pincode,
            serviceable,
            city,
            state,
            cod_available: codAvailable,
            prepaid_available: prepaidAvailable,
            tat_days: tatDays,
            estimated_days: estimatedDays,
            zone,
            fetched_at: new Date().toISOString(),
          });
        } catch (e) {
          console.error('pincode_estimates upsert failed', e);
        }

        return new Response(JSON.stringify({
          serviceable,
          city,
          state,
          codAvailable,
          prepaidAvailable,
          tatDays,
          estimatedDays,
          zone,
          cached: false,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

  } catch (error: unknown) {
    console.error('Delhivery function error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
