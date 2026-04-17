import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, FileText, Loader2, Eye, ChevronRight, RefreshCw, Search, Truck, MapPin, CheckCircle2, Undo2, IndianRupee } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/hooks/useCurrency';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  product_id: string;
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
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  shipping_address: ShippingAddress;
  invoice_url: string | null;
  delivered_at: string | null;
  refund_amount: number | null;
  refund_eta: string | null;
  refund_processed_at: string | null;
  created_at: string;
  order_items: OrderItem[];
}

const isWithin7Days = (deliveredAt: string | null) => {
  if (!deliveredAt) return true;
  const days = (Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24);
  return days <= 7;
};

const DELIVERY_STEPS = [
  { key: 'placed', label: 'Placed', icon: Package },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: MapPin },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
];

const RETURN_STEPS = [
  { key: 'return_requested', label: 'Requested', icon: Undo2 },
  { key: 'return_approved', label: 'Approved', icon: CheckCircle2 },
  { key: 'return_picked_up', label: 'Picked Up', icon: Truck },
  { key: 'refund_processed', label: 'Refunded', icon: IndianRupee },
];

const RETURN_STATUSES = ['return_requested', 'return_approved', 'return_picked_up', 'refund_processed'];

const MiniDeliveryProgress = ({ status }: { status: string }) => {
  const isReturnFlow = RETURN_STATUSES.includes(status);
  const steps = isReturnFlow ? RETURN_STEPS : DELIVERY_STEPS;
  const statusOrder = isReturnFlow
    ? RETURN_STATUSES
    : ['placed', 'confirmed', 'shipped', 'out_for_delivery', 'delivered'];
  const currentIdx = statusOrder.indexOf(status);
  const accentClass = isReturnFlow ? 'bg-accent' : 'bg-primary';
  const accentSoftClass = isReturnFlow ? 'bg-accent/80' : 'bg-primary/80';
  const accentLineClass = isReturnFlow ? 'bg-accent/60' : 'bg-primary/60';
  const shadowClass = isReturnFlow ? 'shadow-accent/25' : 'shadow-primary/25';

  return (
    <div className="my-3 px-1">
      {isReturnFlow && (
        <p className="text-[10px] font-semibold text-accent mb-2 uppercase tracking-wide">Return in progress</p>
      )}
      <div className="flex items-center gap-1">
        {steps.map((step, idx) => {
          const isCompleted = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          const StepIcon = step.icon;

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  isCompleted
                    ? isCurrent
                      ? `${accentClass} text-primary-foreground shadow-sm ${shadowClass} scale-110`
                      : `${accentSoftClass} text-primary-foreground`
                    : 'bg-muted text-muted-foreground'
                }`}>
                  <StepIcon size={13} />
                </div>
                <span className={`text-[9px] mt-1 font-medium leading-tight text-center ${
                  isCompleted ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`h-0.5 flex-1 mx-0.5 rounded-full mt-[-14px] ${
                  idx < currentIdx ? accentLineClass : 'bg-border'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const OrderHistory = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { formatPrice } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requestingReplacement, setRequestingReplacement] = useState<string | null>(null);
  const [requestingReturn, setRequestingReturn] = useState<string | null>(null);
  const [returnDialogOrderId, setReturnDialogOrderId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleRequestReplacement = async (orderId: string) => {
    setRequestingReplacement(orderId);
    try {
      const { data, error } = await supabase.functions.invoke('request-replacement', {
        body: { orderId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Replacement request submitted successfully');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'replacement_requested' } : o));
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit replacement request');
    } finally {
      setRequestingReplacement(null);
    }
  };

  const handleRequestReturn = async () => {
    if (!returnDialogOrderId) return;
    if (returnReason.trim().length < 5) {
      toast.error('Please provide a return reason (at least 5 characters)');
      return;
    }
    setRequestingReturn(returnDialogOrderId);
    try {
      const { data, error } = await supabase.functions.invoke('request-return', {
        body: { orderId: returnDialogOrderId, reason: returnReason.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Return request submitted successfully');
      setOrders(prev => prev.map(o => o.id === returnDialogOrderId ? { ...o, status: 'return_requested' } : o));
      setReturnDialogOrderId(null);
      setReturnReason('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit return request');
    } finally {
      setRequestingReturn(null);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Transform data to match our interface
        const transformedOrders: Order[] = (data || []).map((order) => ({
          id: order.id,
          order_number: order.order_number,
          status: order.status,
          payment_method: order.payment_method,
          payment_status: order.payment_status,
          subtotal: Number(order.subtotal),
          shipping_cost: Number(order.shipping_cost),
          total: Number(order.total),
          shipping_address: order.shipping_address as unknown as ShippingAddress,
          invoice_url: order.invoice_url,
          delivered_at: order.delivered_at,
          refund_amount: (order as any).refund_amount != null ? Number((order as any).refund_amount) : null,
          refund_eta: (order as any).refund_eta ?? null,
          refund_processed_at: (order as any).refund_processed_at ?? null,
          created_at: order.created_at,
          order_items: order.order_items as unknown as OrderItem[],
        }));
        
        setOrders(transformedOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast.error('Failed to load orders');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-success/10 text-success border-success/20';
      case 'shipped':
      case 'out_for_delivery':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-secondary text-muted-foreground';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h1 className="font-serif text-3xl font-bold">Order History</h1>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order number, product or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {(() => {
          const query = searchQuery.toLowerCase().trim();
          const filteredOrders = query
            ? orders.filter(order =>
                order.order_number.toLowerCase().includes(query) ||
                order.status.replace(/_/g, ' ').toLowerCase().includes(query) ||
                order.order_items.some(item => item.product_name.toLowerCase().includes(query))
              )
            : orders;

          return filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-lg border border-border">
            <Package size={48} className="mx-auto text-muted-foreground mb-4" />
            <h2 className="font-semibold text-lg mb-2">{searchQuery ? 'No matching orders' : 'No orders yet'}</h2>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? 'Try a different search term' : 'Start shopping to see your orders here'}
            </p>
            {!searchQuery && (
              <Button asChild>
                <Link to="/products">Browse Products</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-card rounded-lg border border-border p-6"
              >
                <div className="flex flex-wrap justify-between gap-4 mb-4">
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
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="font-semibold">{formatPrice(order.total)}</p>
                  </div>
                  <div>
                    <Badge variant="outline" className={getStatusColor(order.status)}>
                      {formatStatus(order.status)}
                    </Badge>
                  </div>
                </div>

                {/* Mini Delivery / Return Progress */}
                {!['cancelled', 'replacement_requested', 'replacement_shipped', 'replacement_delivered'].includes(order.status) && (
                  <MiniDeliveryProgress status={order.status} />
                )}

                {/* Refund summary chip (Meesho-style) */}
                {['return_approved', 'return_picked_up', 'refund_processed'].includes(order.status) && (order.refund_amount || order.refund_eta || order.refund_processed_at) && (
                  <div className="flex items-center justify-between gap-3 bg-success/10 border border-success/20 rounded-md px-3 py-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <IndianRupee size={14} className="text-success shrink-0" />
                      <p className="text-xs font-medium truncate">
                        {order.status === 'refund_processed'
                          ? `Refund of ${formatPrice(Number(order.refund_amount ?? order.total))} completed`
                          : `Refund of ${formatPrice(Number(order.refund_amount ?? order.total))} expected by ${order.refund_eta ? new Date(order.refund_eta).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'soon'}`}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 overflow-x-auto pb-2 mb-4">
                  {order.order_items.map((item) => (
                    <div
                      key={item.id}
                      className="flex-shrink-0 w-16 h-20 bg-secondary rounded overflow-hidden"
                    >
                      <img
                        src={item.image || '/placeholder.svg'}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/track-order?id=${order.order_number}`}>
                      <Eye size={16} className="mr-2" />
                      Track Order
                    </Link>
                  </Button>
                  {order.invoice_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={order.invoice_url} target="_blank" rel="noopener noreferrer">
                        <FileText size={16} className="mr-2" />
                        Download Invoice
                      </a>
                    </Button>
                  )}
                  {order.status === 'delivered' && isWithin7Days(order.delivered_at) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => setReturnDialogOrderId(order.id)}
                    >
                      <Undo2 size={16} className="mr-2" />
                      Request Return
                    </Button>
                  )}
                  {order.status === 'delivered' && isWithin7Days(order.delivered_at) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                      onClick={() => handleRequestReplacement(order.id)}
                      disabled={requestingReplacement === order.id}
                    >
                      {requestingReplacement === order.id ? (
                        <Loader2 size={16} className="mr-2 animate-spin" />
                      ) : (
                        <RefreshCw size={16} className="mr-2" />
                      )}
                      Request Replacement
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" asChild className="ml-auto">
                    <Link to={`/track-order?id=${order.order_number}`}>
                      View Details
                      <ChevronRight size={16} className="ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        );
        })()}
      </main>

      <Footer />

      {/* Return Reason Dialog */}
      <Dialog open={!!returnDialogOrderId} onOpenChange={(open) => { if (!open) { setReturnDialogOrderId(null); setReturnReason(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Return</DialogTitle>
            <DialogDescription>Please tell us why you'd like to return this order.</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Describe the reason for return (e.g., wrong size, defective item, not as described)..."
            value={returnReason}
            onChange={e => setReturnReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReturnDialogOrderId(null); setReturnReason(''); }}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleRequestReturn}
              disabled={requestingReturn === returnDialogOrderId || returnReason.trim().length < 5}
            >
              {requestingReturn === returnDialogOrderId ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              Submit Return Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderHistory;
