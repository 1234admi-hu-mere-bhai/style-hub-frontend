import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface OrderItem {
  product_name: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
}

interface InvoiceRequest {
  orderId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    // --- Authentication: verify caller owns the order ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await anonClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId } = (await req.json()) as InvoiceRequest;

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Order ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating invoice for order:', orderId);

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // --- Ownership check: caller must own the order or be an admin ---
    const ADMIN_EMAILS = ['muffigout@gmail.com', 'otw2003@gmail.com', 'kaliasgar776@gmail.com'];
    const isAdmin = ADMIN_EMAILS.includes(user.email ?? '');
    if (order.user_id !== user.id && !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate invoice content using AI
    const shippingAddress = order.shipping_address as {
      firstName: string;
      lastName: string;
      address: string;
      city: string;
      state: string;
      pincode: string;
      phone: string;
    };

    const orderItems = order.order_items as OrderItem[];

    const prompt = `Generate a professional invoice summary for an e-commerce order. Format it nicely with clear sections.

ORDER DETAILS:
- Order Number: ${order.order_number}
- Order Date: ${new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
- Payment Method: ${order.payment_method}
- Payment Status: ${order.payment_status}
${order.payment_id ? `- Payment ID: ${order.payment_id}` : ''}

CUSTOMER DETAILS:
- Name: ${shippingAddress.firstName} ${shippingAddress.lastName}
- Address: ${shippingAddress.address}, ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.pincode}
- Phone: ${shippingAddress.phone || 'N/A'}

ORDER ITEMS:
${orderItems.map((item, i) => `${i + 1}. ${item.product_name} - Qty: ${item.quantity} - ₹${item.price.toLocaleString()} each${item.size ? ` (Size: ${item.size})` : ''}${item.color ? ` (Color: ${item.color})` : ''}`).join('\n')}

PRICING:
- Subtotal: ₹${order.subtotal.toLocaleString()}
- Shipping: ${order.shipping_cost === 0 ? 'FREE' : `₹${order.shipping_cost.toLocaleString()}`}
- Total: ₹${order.total.toLocaleString()}

Please format this as a clear, professional invoice summary that could be displayed to the customer. Include a thank you message and return policy note at the end.`;

    console.log('Calling AI Gateway to generate invoice...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a professional invoice generator for MUFFIGOUT APPAREL HUB, a premium fashion e-commerce store. Generate clean, well-formatted invoice summaries.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const invoiceContent = aiData.choices[0]?.message?.content || 'Invoice generation failed';

    console.log('Invoice generated successfully');

    // Update order with invoice info
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        invoice_url: `data:text/plain;base64,${btoa(invoiceContent)}`,
        invoice_generated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Failed to update order:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        invoice: invoiceContent,
        message: 'Invoice generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating invoice:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate invoice' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
