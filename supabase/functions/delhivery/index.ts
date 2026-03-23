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
        // Track by AWB number — available to authenticated users
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
