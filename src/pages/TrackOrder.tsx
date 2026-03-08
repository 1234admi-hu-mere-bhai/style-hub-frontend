import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Package,
  CheckCircle2,
  Truck,
  MapPin,
  Clock,
  Search,
  FileText,
  Loader2,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface OrderItem {
  id: string;
  product_name: string;
  price: number;
  quantity: number;
  size: string | null;
  color: string | null;
  image: string | null;
}

interface ShippingAddress {
  firstName: string;
  lastName: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_method: string;
  payment_status: string;
  payment_id: string | null;
  subtotal: number;
  shipping_cost: number;
  total: number;
  shipping_address: ShippingAddress;
  invoice_url: string | null;
  created_at: string;
  order_items: OrderItem[];
}

const TrackOrder = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('id');
  const [searchQuery, setSearchQuery] = useState(orderId || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const fetchOrder = async (orderNumber: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('order_number', orderNumber)
        .single();

      if (error) {
        console.error('Order not found:', error);
        setOrder(null);
      } else if (data) {
        const transformedOrder: Order = {
          id: data.id,
          order_number: data.order_number,
          status: data.status,
          payment_method: data.payment_method,
          payment_status: data.payment_status,
          payment_id: data.payment_id,
          subtotal: Number(data.subtotal),
          shipping_cost: Number(data.shipping_cost),
          total: Number(data.total),
          shipping_address: data.shipping_address as unknown as ShippingAddress,
          invoice_url: data.invoice_url,
          created_at: data.created_at,
          order_items: data.order_items as unknown as OrderItem[],
        };
        setOrder(transformedOrder);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
    }
  }, [orderId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchOrder(searchQuery.trim());
    }
  };

  const trackingSteps = [
    {
      id: 'placed',
      label: 'Order Placed',
      icon: Package,
      description: 'Your order has been placed successfully',
    },
    {
      id: 'confirmed',
      label: 'Order Confirmed',
      icon: CheckCircle2,
      description: 'Seller has confirmed your order',
    },
    {
      id: 'shipped',
      label: 'Shipped',
      icon: Truck,
      description: 'Your package is on its way',
    },
    {
      id: 'out_for_delivery',
      label: 'Out for Delivery',
      icon: MapPin,
      description: 'Package is out for delivery',
    },
    {
      id: 'delivered',
      label: 'Delivered',
      icon: CheckCircle2,
      description: 'Package delivered successfully',
    },
  ];

  const getStepStatus = (stepId: string) => {
    if (!order) return 'pending';
    const statusOrder = ['placed', 'confirmed', 'shipped', 'out_for_delivery', 'delivered'];
    const currentIndex = statusOrder.indexOf(order.status);
    const stepIndex = statusOrder.indexOf(stepId);
    
    if (order.status === 'cancelled') return 'cancelled';
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  const getEstimatedDelivery = () => {
    if (!order) return null;
    const orderDate = new Date(order.created_at);
    const deliveryDate = new Date(orderDate);
    deliveryDate.setDate(deliveryDate.getDate() + 5);
    return deliveryDate;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
        <h1 className="font-serif text-3xl font-bold mb-8">Track Your Order</h1>

        {/* Search Form */}
        <div className="max-w-xl mx-auto mb-12">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Order Number (e.g., ORDABC123XYZ)"
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Track'}
            </Button>
          </form>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : order ? (
          <div className="max-w-3xl mx-auto">
            {/* Order Info */}
            <div className="bg-card p-6 rounded-lg border border-border mb-8">
              <div className="flex flex-wrap justify-between gap-4 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">Order Number</p>
                  <p className="font-semibold font-mono">{order.order_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-semibold">
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                {order.payment_id && (
                  <div>
                    <p className="text-sm text-muted-foreground">Payment ID</p>
                    <p className="font-semibold font-mono text-sm">{order.payment_id}</p>
                  </div>
                )}
                {order.status !== 'delivered' && getEstimatedDelivery() && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Estimated Delivery
                    </p>
                    <p className="font-semibold flex items-center gap-1">
                      <Clock size={16} />
                      {getEstimatedDelivery()?.toLocaleDateString(
                        'en-IN',
                        {
                          day: 'numeric',
                          month: 'long',
                        }
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Items Preview */}
              <div className="flex gap-3 overflow-x-auto pb-2">
                {order.order_items.map((item) => (
                  <div
                    key={item.id}
                    className="flex-shrink-0"
                  >
                    <div className="w-16 h-20 bg-secondary rounded overflow-hidden mb-1">
                      <img
                        src={item.image || '/placeholder.svg'}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground truncate w-16">{item.product_name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tracking Timeline */}
            {order.status === 'cancelled' ? (
              <div className="bg-destructive/10 p-6 rounded-lg text-center">
                <p className="text-destructive font-semibold text-lg">
                  Order Cancelled
                </p>
                <p className="text-muted-foreground mt-2">
                  This order has been cancelled. If you have any questions,
                  please contact support.
                </p>
              </div>
            ) : (
              <div className="bg-card p-6 rounded-lg border border-border">
                <h2 className="font-semibold text-lg mb-6">Tracking Status</h2>
                <div className="relative">
                  {trackingSteps.map((step, index) => {
                    const status = getStepStatus(step.id);
                    const isLast = index === trackingSteps.length - 1;

                    return (
                      <div key={step.id} className="flex gap-4">
                        {/* Icon and Line */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              status === 'completed'
                                ? 'bg-success text-success-foreground'
                                : status === 'current'
                                ? 'bg-primary text-primary-foreground animate-pulse'
                                : 'bg-secondary text-muted-foreground'
                            }`}
                          >
                            <step.icon size={20} />
                          </div>
                          {!isLast && (
                            <div
                              className={`w-0.5 h-12 ${
                                status === 'completed'
                                  ? 'bg-success'
                                  : 'bg-border'
                              }`}
                            />
                          )}
                        </div>

                        {/* Content */}
                        <div className={`pb-8 ${isLast ? 'pb-0' : ''}`}>
                          <h3
                            className={`font-semibold ${
                              status === 'pending'
                                ? 'text-muted-foreground'
                                : ''
                            }`}
                          >
                            {step.label}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {step.description}
                          </p>
                          {status === 'current' && (
                            <p className="text-xs text-primary mt-1">
                              Current Status
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Order Details */}
            <div className="bg-card p-6 rounded-lg border border-border mt-8">
              <h2 className="font-semibold text-lg mb-4">Order Details</h2>
              
              <div className="space-y-4 mb-6">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-20 bg-secondary rounded overflow-hidden flex-shrink-0">
                      <img
                        src={item.image || '/placeholder.svg'}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{item.product_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.size && `Size: ${item.size}`}
                        {item.size && item.color && ' | '}
                        {item.color && `Color: ${item.color}`}
                        {(item.size || item.color) && ' | '}
                        Qty: {item.quantity}
                      </p>
                      <p className="font-semibold mt-1">
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{order.shipping_cost === 0 ? 'FREE' : `₹${order.shipping_cost}`}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>₹{order.total.toLocaleString()}</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Method</span>
                <span>{order.payment_method}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-muted-foreground">Payment Status</span>
                <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                  {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
                </Badge>
              </div>

              {order.invoice_url && (
                <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
                  <a href={order.invoice_url} target="_blank" rel="noopener noreferrer">
                    <FileText size={16} className="mr-2" />
                    Download Invoice
                  </a>
                </Button>
              )}
            </div>

            {/* Delivery Address */}
            <div className="bg-card p-6 rounded-lg border border-border mt-8">
              <h2 className="font-semibold text-lg mb-4">Delivery Address</h2>
              <p className="font-medium">{order.shipping_address.firstName} {order.shipping_address.lastName}</p>
              <p className="text-muted-foreground">
                {order.shipping_address.address}
                {order.shipping_address.landmark && `, ${order.shipping_address.landmark}`}
              </p>
              <p className="text-muted-foreground">
                {order.shipping_address.city}, {order.shipping_address.state} -{' '}
                {order.shipping_address.pincode}
              </p>
              {order.shipping_address.phone && (
                <p className="text-muted-foreground mt-2">
                  Phone: {order.shipping_address.phone}
                </p>
              )}
            </div>
          </div>
        ) : searchQuery && !orderId ? (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-muted-foreground mb-4" />
            <h2 className="font-semibold text-lg mb-2">Order not found</h2>
            <p className="text-muted-foreground mb-4">
              We couldn't find an order with that number. Please check and try again.
            </p>
          </div>
        ) : (
          <div className="text-center py-12">
            <Truck size={48} className="mx-auto text-muted-foreground mb-4" />
            <h2 className="font-semibold text-lg mb-2">Track your shipment</h2>
            <p className="text-muted-foreground mb-4">
              Enter your order number to see the status
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default TrackOrder;
