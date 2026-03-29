import { supabase } from '@/integrations/supabase/client';

interface OrderItem {
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  image?: string;
}

interface ShippingAddress {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

interface CreateOrderParams {
  userId: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  paymentId?: string;
}

export const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `ORD${timestamp}${random}`;
};

export const createOrder = async (params: CreateOrderParams) => {
  const orderNumber = generateOrderNumber();

  const orderData = {
    user_id: params.userId,
    order_number: orderNumber,
    status: 'placed',
    payment_method: params.paymentMethod,
    payment_status: 'pending',
    payment_id: params.paymentId || null,
    subtotal: params.subtotal,
    shipping_cost: params.shippingCost,
    total: params.total,
    shipping_address: JSON.parse(JSON.stringify(params.shippingAddress)),
  };

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([orderData])
    .select()
    .single();

  if (orderError) {
    console.error('Failed to create order:', orderError);
    throw orderError;
  }

  // Create order items
  const orderItems = params.items.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    product_name: item.product_name,
    price: item.price,
    quantity: item.quantity,
    size: item.size || null,
    color: item.color || null,
    image: item.image || null,
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    console.error('Failed to create order items:', itemsError);
    throw itemsError;
  }

  // If payment was made online, generate invoice immediately
  if (params.paymentId) {
    try {
      await supabase.functions.invoke('generate-invoice', {
        body: { orderId: order.id },
      });
    } catch (error) {
      console.error('Failed to generate invoice:', error);
    }
  }

  return {
    ...order,
    order_number: orderNumber,
  };
};

export const getOrderByNumber = async (orderNumber: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .eq('order_number', orderNumber)
    .single();

  if (error) {
    console.error('Failed to fetch order:', error);
    return null;
  }

  return data;
};

// Removed client-side updateOrderStatus — all status updates now go through
// the admin-update-order edge function to prevent users from self-promoting
// order status or modifying payment fields.
