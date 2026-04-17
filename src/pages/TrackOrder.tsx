import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Package,
  CheckCircle2,
  Truck,
  MapPin,
  Clock,
  Search,
  FileText,
  Loader2,
  RefreshCw,
  Navigation,
  Undo2,
  IndianRupee,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DelhiveryTracking from '@/components/DelhiveryTracking';

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
  tracking_awb: string | null;
  return_reason: string | null;
  refund_amount: number | null;
  refund_eta: string | null;
  refund_processed_at: string | null;
  created_at: string;
  order_items: OrderItem[];
}

const TrackOrder = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('id');
  const [searchQuery, setSearchQuery] = useState(orderId || '');
  const [searchError, setSearchError] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [trackingMode, setTrackingMode] = useState<'order' | 'awb'>('order');
  const [awbQuery, setAwbQuery] = useState('');

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
        .select(`*, order_items (*)`)
        .eq('order_number', orderNumber)
        .single();

      if (error) {
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
          tracking_awb: (data as any).tracking_awb ?? null,
          return_reason: (data as any).return_reason ?? null,
          refund_amount: (data as any).refund_amount != null ? Number((data as any).refund_amount) : null,
          refund_eta: (data as any).refund_eta ?? null,
          refund_processed_at: (data as any).refund_processed_at ?? null,
          created_at: data.created_at,
          order_items: data.order_items as unknown as OrderItem[],
        };
        setOrder(transformedOrder);
      }
    } catch {
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) fetchOrder(orderId);
  }, [orderId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingMode === 'order') {
      if (!searchQuery.trim()) {
        setSearchError('Order number is required');
        return;
      }
      setSearchError('');
      fetchOrder(searchQuery.trim());
    } else {
      if (!awbQuery.trim()) {
        setSearchError('AWB number is required');
        return;
      }
      setSearchError('');
      // AWB mode sets a fake order context just to show tracking
      setOrder(null);
    }
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
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="font-serif text-3xl font-bold mb-8">Track Your Order</h1>

        {/* Mode Toggle */}
        <div className="max-w-xl mx-auto mb-6">
          <div className="flex gap-2 mb-4">
            <Button
              variant={trackingMode === 'order' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setTrackingMode('order'); setSearchError(''); }}
            >
              <Package size={16} className="mr-1" /> By Order Number
            </Button>
            <Button
              variant={trackingMode === 'awb' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setTrackingMode('awb'); setSearchError(''); }}
            >
              <Navigation size={16} className="mr-1" /> By AWB Number
            </Button>
          </div>

          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              {trackingMode === 'order' ? (
                <Input
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setSearchError(''); }}
                  placeholder="Enter Order Number"
                  className={`pl-10 ${searchError ? 'border-destructive' : ''}`}
                />
              ) : (
                <Input
                  value={awbQuery}
                  onChange={(e) => { setAwbQuery(e.target.value); setSearchError(''); }}
                  placeholder="Enter Delhivery AWB Number"
                  className={`pl-10 ${searchError ? 'border-destructive' : ''}`}
                />
              )}
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Track'}
            </Button>
          </form>
          {searchError && <p className="text-xs text-destructive mt-2">{searchError}</p>}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : trackingMode === 'awb' && awbQuery.trim() ? (
          <div className="max-w-3xl mx-auto">
            <DelhiveryTracking waybill={awbQuery.trim()} />
          </div>
        ) : order ? (
          <div className="max-w-3xl mx-auto">
            {/* Order Info Card */}
            <div className="bg-card p-6 rounded-lg border border-border mb-8">
              <div className="flex flex-wrap justify-between gap-4 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">Order Number</p>
                  <p className="font-semibold font-mono">{order.order_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-semibold">
                    {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                {order.tracking_awb && (
                  <div>
                    <p className="text-sm text-muted-foreground">AWB Number</p>
                    <p className="font-semibold font-mono text-sm text-primary">{order.tracking_awb}</p>
                  </div>
                )}
              </div>

              {/* Items Preview */}
              <div className="flex gap-3 overflow-x-auto pb-2">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex-shrink-0">
                    <div className="w-16 h-20 bg-secondary rounded overflow-hidden mb-1">
                      <img
                        src={item.image || '/placeholder.svg'}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground truncate w-16">{item.product_name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Delhivery Live Tracking (if AWB exists and not in return flow) */}
            {order.tracking_awb && !['return_requested','return_approved','return_picked_up','refund_processed'].includes(order.status) ? (
              <DelhiveryTracking waybill={order.tracking_awb} />
            ) : (
              /* Fallback internal tracking (also used for return flow) */
              <InternalTracking order={order} />
            )}

            {/* Order Details */}
            <OrderDetailsCard order={order} />
          </div>
        ) : searchQuery && !orderId ? (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-muted-foreground mb-4" />
            <h2 className="font-semibold text-lg mb-2">Order not found</h2>
            <p className="text-muted-foreground mb-4">We couldn't find an order with that number.</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <Truck size={48} className="mx-auto text-muted-foreground mb-4" />
            <h2 className="font-semibold text-lg mb-2">Track your shipment</h2>
            <p className="text-muted-foreground mb-4">Enter your order number or AWB to see the status</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

/* ── Internal tracking fallback ─────────────────────────────── */
const InternalTracking = ({ order }: { order: { status: string; return_reason?: string | null; refund_amount?: number | null; refund_eta?: string | null; refund_processed_at?: string | null } }) => {
  const isReplacementFlow = order.status.startsWith('replacement');
  const returnStatuses = ['return_requested', 'return_approved', 'return_picked_up', 'refund_processed'];
  const isReturnFlow = returnStatuses.includes(order.status);

  const standardSteps = [
    { id: 'placed', label: 'Order Placed', icon: Package, description: 'Your order has been placed successfully' },
    { id: 'confirmed', label: 'Order Confirmed', icon: CheckCircle2, description: 'Seller has confirmed your order' },
    { id: 'shipped', label: 'Shipped', icon: Truck, description: 'Your package is on its way' },
    { id: 'out_for_delivery', label: 'Out for Delivery', icon: MapPin, description: 'Package is out for delivery' },
    { id: 'delivered', label: 'Delivered', icon: CheckCircle2, description: 'Package delivered successfully' },
  ];

  const replacementSteps = [
    { id: 'delivered', label: 'Original Delivered', icon: CheckCircle2, description: 'Original order was delivered' },
    { id: 'replacement_requested', label: 'Replacement Requested', icon: RefreshCw, description: 'You have requested a replacement' },
    { id: 'replacement_shipped', label: 'Replacement Shipped', icon: Truck, description: 'Your replacement is on its way' },
    { id: 'replacement_delivered', label: 'Replacement Delivered', icon: CheckCircle2, description: 'Replacement delivered successfully' },
  ];

  const returnSteps = [
    { id: 'return_requested', label: 'Return Requested', icon: Undo2, description: 'Your return request has been submitted' },
    { id: 'return_approved', label: 'Return Approved', icon: CheckCircle2, description: 'Admin has approved your return' },
    { id: 'return_picked_up', label: 'Return Picked Up', icon: Truck, description: 'Courier has collected the package' },
    { id: 'refund_processed', label: 'Refund Processed', icon: IndianRupee, description: 'Refund issued to your original payment method' },
  ];

  const trackingSteps = isReturnFlow ? returnSteps : isReplacementFlow ? replacementSteps : standardSteps;

  const getStepStatus = (stepId: string) => {
    if (order.status === 'cancelled') return 'cancelled';
    const statusList = isReturnFlow
      ? returnStatuses
      : isReplacementFlow
        ? ['delivered', 'replacement_requested', 'replacement_shipped', 'replacement_delivered']
        : ['placed', 'confirmed', 'shipped', 'out_for_delivery', 'delivered'];
    const currentIndex = statusList.indexOf(order.status);
    const stepIndex = statusList.indexOf(stepId);
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  if (order.status === 'cancelled') {
    return (
      <div className="bg-destructive/10 p-6 rounded-lg text-center mb-8">
        <p className="text-destructive font-semibold text-lg">Order Cancelled</p>
        <p className="text-muted-foreground mt-2">This order has been cancelled.</p>
      </div>
    );
  }

  const formatDate = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;
  const refundDone = order.status === 'refund_processed';

  return (
    <>
      {isReturnFlow && order.return_reason && (
        <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg mb-4">
          <p className="text-sm font-semibold mb-1">Your Return Reason</p>
          <p className="text-sm text-muted-foreground">{order.return_reason}</p>
        </div>
      )}
      {isReturnFlow && (order.refund_amount || order.refund_eta || refundDone) && (
        <div className="bg-card border border-border rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-success/15 text-success flex items-center justify-center">
              <IndianRupee size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold">Refund details</p>
              <p className="text-xs text-muted-foreground">
                {refundDone ? 'Refund completed' : 'Refund will be issued to your original payment method'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {order.refund_amount != null && (
              <div className="bg-secondary/40 rounded-md p-3">
                <p className="text-xs text-muted-foreground mb-1">Refund Amount</p>
                <p className="font-semibold">₹{Number(order.refund_amount).toLocaleString('en-IN')}</p>
              </div>
            )}
            <div className="bg-secondary/40 rounded-md p-3">
              <p className="text-xs text-muted-foreground mb-1">
                {refundDone ? 'Refunded On' : 'Estimated Refund By'}
              </p>
              <p className="font-semibold">
                {refundDone
                  ? formatDate(order.refund_processed_at) ?? '—'
                  : formatDate(order.refund_eta) ?? 'Pending approval'}
              </p>
            </div>
          </div>
          {!refundDone && order.refund_eta && (
            <p className="text-[11px] text-muted-foreground mt-3">
              Refunds usually reflect in 5–7 business days after pickup, depending on your bank.
            </p>
          )}
        </div>
      )}
      <div className="bg-card p-6 rounded-lg border border-border mb-8">
        <h2 className="font-semibold text-lg mb-6">
          {isReturnFlow ? 'Return Status' : 'Tracking Status'}
        </h2>
      <div className="relative">
        {trackingSteps.map((step, index) => {
          const status = getStepStatus(step.id);
          const isLast = index === trackingSteps.length - 1;
          return (
            <div key={step.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  status === 'completed' ? 'bg-success text-success-foreground'
                    : status === 'current' ? 'bg-primary text-primary-foreground animate-pulse'
                    : 'bg-secondary text-muted-foreground'
                }`}>
                  <step.icon size={20} />
                </div>
                {!isLast && <div className={`w-0.5 h-12 ${status === 'completed' ? 'bg-success' : 'bg-border'}`} />}
              </div>
              <div className={`pb-8 ${isLast ? 'pb-0' : ''}`}>
                <h3 className={`font-semibold ${status === 'pending' ? 'text-muted-foreground' : ''}`}>{step.label}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                {status === 'current' && <p className="text-xs text-primary mt-1">Current Status</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
    </>
  );
};

/* ── Order details card ─────────────────────────────── */
const OrderDetailsCard = ({ order }: { order: any }) => (
  <>
    <div className="bg-card p-6 rounded-lg border border-border mt-8">
      <h2 className="font-semibold text-lg mb-4">Order Details</h2>
      <div className="space-y-4 mb-6">
        {order.order_items.map((item: any) => (
          <div key={item.id} className="flex gap-4">
            <div className="w-16 h-20 bg-secondary rounded overflow-hidden flex-shrink-0">
              <img src={item.image || '/placeholder.svg'} alt={item.product_name} className="w-full h-full object-cover" onError={(e: any) => { e.currentTarget.src = '/placeholder.svg'; }} />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">{item.product_name}</h4>
              <p className="text-sm text-muted-foreground">
                {item.size && `Size: ${item.size}`}{item.size && item.color && ' | '}{item.color && `Color: ${item.color}`}{(item.size || item.color) && ' | '}Qty: {item.quantity}
              </p>
              <p className="font-semibold mt-1">₹{(item.price * item.quantity).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
      <Separator className="my-4" />
      <div className="space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{order.subtotal.toLocaleString()}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{order.shipping_cost === 0 ? 'FREE' : `₹${order.shipping_cost}`}</span></div>
        <Separator className="my-2" />
        <div className="flex justify-between font-semibold text-lg"><span>Total</span><span>₹{order.total.toLocaleString()}</span></div>
      </div>
      <Separator className="my-4" />
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Payment Method</span><span>{order.payment_method}</span>
      </div>
      <div className="flex justify-between text-sm mt-2">
        <span className="text-muted-foreground">Payment Status</span>
        <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>{order.payment_status === 'paid' ? 'Paid' : 'Pending'}</Badge>
      </div>
      {order.invoice_url && (
        <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
          <a href={order.invoice_url} target="_blank" rel="noopener noreferrer">
            <FileText size={16} className="mr-2" /> Download Invoice
          </a>
        </Button>
      )}
    </div>

    <div className="bg-card p-6 rounded-lg border border-border mt-8">
      <h2 className="font-semibold text-lg mb-4">Delivery Address</h2>
      <p className="font-medium">{order.shipping_address.firstName} {order.shipping_address.lastName}</p>
      <p className="text-muted-foreground">{order.shipping_address.address}{order.shipping_address.landmark && `, ${order.shipping_address.landmark}`}</p>
      <p className="text-muted-foreground">{order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}</p>
      {order.shipping_address.phone && <p className="text-muted-foreground mt-2">Phone: {order.shipping_address.phone}</p>}
    </div>
  </>
);

export default TrackOrder;
