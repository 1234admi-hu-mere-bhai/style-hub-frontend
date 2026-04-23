import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Package,
  CheckCircle2,
  Truck,
  MapPin,
  Search,
  FileText,
  Loader2,
  RefreshCw,
  Navigation,
  Undo2,
  IndianRupee,
  XCircle,
  Copy,
  ChevronLeft,
  ChevronRight,
  PhoneCall,
  Zap,
  CreditCard,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/hooks/useCurrency';
import DelhiveryTracking from '@/components/DelhiveryTracking';
import InvoiceDialog from '@/components/InvoiceDialog';
import OrderRating from '@/components/order/OrderRating';
import YouMayAlsoLike from '@/components/order/YouMayAlsoLike';

const CANCELLABLE_STATUSES = ['placed', 'confirmed'];

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
  rejection_reason: string | null;
  refund_amount: number | null;
  refund_eta: string | null;
  refund_processed_at: string | null;
  delivered_at: string | null;
  created_at: string;
  order_items: OrderItem[];
}

const isWithin7Days = (deliveredAt: string | null) => {
  if (!deliveredAt) return true;
  const days = (Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24);
  return days <= 7;
};

const formatLongDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })
    : '';

const TrackOrder = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('id');
  const [searchQuery, setSearchQuery] = useState(orderId || '');
  const [searchError, setSearchError] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [trackingMode, setTrackingMode] = useState<'order' | 'awb'>('order');
  const [awbQuery, setAwbQuery] = useState('');

  // Action state
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [verifyingCancel, setVerifyingCancel] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [submittingReplacement, setSubmittingReplacement] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [refundHelpOpen, setRefundHelpOpen] = useState(false);
  const [refundMessage, setRefundMessage] = useState('');
  const [submittingRefundHelp, setSubmittingRefundHelp] = useState(false);
  const [showFullTimeline, setShowFullTimeline] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  const openCancelDialog = async () => {
    if (!order) return;
    setVerifyingCancel(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('status')
        .eq('id', order.id)
        .single();
      if (error) throw error;
      if (!CANCELLABLE_STATUSES.includes(data.status)) {
        toast.error(`Cancellation no longer available — order is ${data.status.replace(/_/g, ' ')}.`);
        setOrder({ ...order, status: data.status });
        return;
      }
      setCancelReason('');
      setShowCancelDialog(true);
    } catch {
      toast.error('Could not verify order status. Please try again.');
    } finally {
      setVerifyingCancel(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    setIsCancelling(true);
    try {
      const updates: { status: string; cancellation_reason?: string } = { status: 'cancelled' };
      if (cancelReason.trim()) updates.cancellation_reason = cancelReason.trim();
      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', order.id)
        .in('status', CANCELLABLE_STATUSES);
      if (error) throw error;
      toast.success('Order cancelled. Refund will be initiated within 5–7 business days.');
      setOrder({ ...order, status: 'cancelled' });
      setShowCancelDialog(false);
      setCancelReason('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel order. It may have already shipped.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRequestReturn = async () => {
    if (!order) return;
    if (returnReason.trim().length < 5) {
      toast.error('Please provide a return reason (at least 5 characters)');
      return;
    }
    setSubmittingReturn(true);
    try {
      const { data, error } = await supabase.functions.invoke('request-return', {
        body: { orderId: order.id, reason: returnReason.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Return request submitted successfully');
      setOrder({ ...order, status: 'return_requested', return_reason: returnReason.trim() });
      setReturnDialogOpen(false);
      setReturnReason('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit return request');
    } finally {
      setSubmittingReturn(false);
    }
  };

  const handleRequestReplacement = async () => {
    if (!order) return;
    setSubmittingReplacement(true);
    try {
      const { data, error } = await supabase.functions.invoke('request-replacement', {
        body: { orderId: order.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Replacement request submitted successfully');
      setOrder({ ...order, status: 'replacement_requested' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit replacement request');
    } finally {
      setSubmittingReplacement(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
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
        const transformed: Order = {
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
          rejection_reason: (data as any).rejection_reason ?? null,
          refund_amount:
            (data as any).refund_amount != null ? Number((data as any).refund_amount) : null,
          refund_eta: (data as any).refund_eta ?? null,
          refund_processed_at: (data as any).refund_processed_at ?? null,
          delivered_at: (data as any).delivered_at ?? null,
          created_at: data.created_at,
          order_items: data.order_items as unknown as OrderItem[],
        };
        setOrder(transformed);
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
      if (!searchQuery.trim()) return setSearchError('Order number is required');
      setSearchError('');
      fetchOrder(searchQuery.trim());
    } else {
      if (!awbQuery.trim()) return setSearchError('AWB number is required');
      setSearchError('');
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

  // ── ORDER DETAIL VIEW (Meesho-style) ──────────────────────────────
  if (order) {
    const firstItem = order.order_items[0];
    const totalSavings =
      order.order_items.reduce((sum, it) => sum + Number(it.price) * it.quantity, 0) -
      order.subtotal;

    const status = order.status;
    const isDelivered = status === 'delivered';
    const isCancelled = status === 'cancelled';
    const isRefundDone = status === 'refund_processed';
    const isReturnFlow = ['return_requested', 'return_approved', 'return_picked_up', 'picked_up'].includes(status);
    const isReturnRejected = status === 'return_rejected';
    const isReplacementFlow = status.startsWith('replacement');
    const canCancel = CANCELLABLE_STATUSES.includes(status);
    const canReturnOrReplace = isDelivered && isWithin7Days(order.delivered_at);

    return (
      <div className="min-h-screen bg-background">
        {/* Sticky top bar (Meesho-style) */}
        <header className="sticky top-0 z-30 bg-background border-b border-border">
          <div className="container mx-auto px-3 py-3 flex items-center justify-between max-w-3xl">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 -ml-1 px-1 py-1 text-foreground hover:text-primary transition-colors"
              aria-label="Back"
            >
              <ChevronLeft size={22} />
              <span className="font-bold tracking-wide uppercase text-sm">Order Details</span>
            </button>
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="flex items-center gap-1.5 text-primary font-bold tracking-wide uppercase text-sm px-2 py-1 hover:opacity-80 transition-opacity"
            >
              <PhoneCall size={16} />
              Help
            </button>
          </div>
        </header>

        <main className="container mx-auto max-w-3xl pb-24">
          {/* Product summary card */}
          <Link
            to={`/products`}
            className="block bg-card border-b border-border px-4 py-4 hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="w-20 h-24 flex-shrink-0 rounded-md overflow-hidden bg-secondary">
                <img
                  src={firstItem?.image || '/placeholder.svg'}
                  alt={firstItem?.product_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base leading-snug">Order #{order.order_number}</p>
                <p className="text-sm text-foreground line-clamp-2 mt-0.5">
                  {firstItem?.product_name}
                  {order.order_items.length > 1 && (
                    <span className="text-muted-foreground"> +{order.order_items.length - 1} more</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {firstItem?.size ? `${firstItem.size}` : 'Free Size'} •{' '}
                  {order.payment_method?.toLowerCase().includes('cod') ? 'COD' : 'Prepaid'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {canReturnOrReplace
                    ? 'Easy returns & exchange available'
                    : isCancelled
                      ? 'Order cancelled'
                      : isRefundDone
                        ? 'Refund completed'
                        : 'Track your order below'}
                </p>
              </div>
              <ChevronRight size={20} className="text-muted-foreground flex-shrink-0 mt-1" />
            </div>
          </Link>

          {/* Status block */}
          <StatusBlock
            order={order}
            onShowFullTimeline={() => setShowFullTimeline(true)}
          />

          {/* Returns & Exchange notice */}
          {(isDelivered || isReturnRejected) && (
            <div className="bg-card border-b border-border px-4 py-4 flex items-center justify-between gap-3">
              <p className="text-sm text-foreground">
                {canReturnOrReplace
                  ? 'Easy returns & exchange available'
                  : 'No Return - Exchange available'}
              </p>
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                className="text-primary font-bold text-sm uppercase tracking-wide hover:opacity-80"
              >
                Know More
              </button>
            </div>
          )}

          {/* Action buttons (cancel / return / replacement) */}
          {(canCancel || canReturnOrReplace) && (
            <div className="bg-card border-b border-border px-4 py-4 flex flex-wrap gap-2">
              {canCancel && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/30 hover:bg-destructive/10 rounded-full"
                  onClick={openCancelDialog}
                  disabled={verifyingCancel}
                >
                  {verifyingCancel ? (
                    <Loader2 size={16} className="mr-2 animate-spin" />
                  ) : (
                    <XCircle size={16} className="mr-2" />
                  )}
                  Cancel Order
                </Button>
              )}
              {canReturnOrReplace && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setReturnDialogOpen(true)}
                  >
                    <Undo2 size={16} className="mr-2" />
                    Return
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={handleRequestReplacement}
                    disabled={submittingReplacement}
                  >
                    {submittingReplacement ? (
                      <Loader2 size={16} className="mr-2 animate-spin" />
                    ) : (
                      <RefreshCw size={16} className="mr-2" />
                    )}
                    Replace
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Delivery address */}
          <section className="bg-card border-b border-border px-4 py-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={18} className="text-primary" />
              <h2 className="font-bold text-base">Delivery Address</h2>
            </div>
            <p className="text-sm font-medium text-foreground">
              {order.shipping_address.firstName} {order.shipping_address.lastName}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
              {order.shipping_address.address}
              {order.shipping_address.landmark && `, ${order.shipping_address.landmark}`}, {order.shipping_address.city},{' '}
              {order.shipping_address.state}, {order.shipping_address.pincode}
            </p>
            {order.shipping_address.phone && (
              <p className="text-sm text-muted-foreground mt-1">{order.shipping_address.phone}</p>
            )}
          </section>

          {/* AWB / tracking number block */}
          {order.tracking_awb && (
            <section className="bg-card border-b border-border px-4 py-4">
              <div className="flex items-center gap-2 mb-2">
                <Truck size={18} className="text-primary" />
                <h2 className="font-bold text-base">Tracking Number</h2>
              </div>
              <div className="flex items-center justify-between gap-3 bg-primary/5 border border-primary/20 rounded-lg p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                    AWB / Tracking
                  </p>
                  <p className="font-mono font-bold text-sm text-primary truncate mt-0.5">
                    {order.tracking_awb}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs shrink-0 rounded-full"
                  onClick={() => {
                    navigator.clipboard?.writeText(order.tracking_awb!);
                    toast.success('AWB copied to clipboard');
                  }}
                >
                  <Copy size={12} className="mr-1" />
                  Copy
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug mt-2">
                Use this AWB on your courier partner's official tracking site (Delhivery, Bluedart,
                DTDC, etc.) for live shipment status.
              </p>
            </section>
          )}

          {/* Refund info (return / refund flow) */}
          {(isReturnFlow || status === 'picked_up' || isRefundDone) && (
            <section className="bg-card border-b border-border px-4 py-4">
              <div className="flex items-center gap-2 mb-3">
                <IndianRupee size={18} className="text-success" />
                <h2 className="font-bold text-base">Refund Status</h2>
              </div>

              <RefundTimeline order={order} />

              {(order.refund_amount != null || order.refund_eta || order.refund_processed_at) && (
                <div className="grid grid-cols-2 gap-3 text-sm mt-4">
                  {order.refund_amount != null && (
                    <div className="bg-secondary/40 rounded-md p-3">
                      <p className="text-xs text-muted-foreground mb-1">Refund Amount</p>
                      <p className="font-bold">{formatPrice(Number(order.refund_amount))}</p>
                    </div>
                  )}
                  <div className="bg-secondary/40 rounded-md p-3">
                    <p className="text-xs text-muted-foreground mb-1">
                      {isRefundDone ? 'Refunded On' : 'Estimated By'}
                    </p>
                    <p className="font-bold">
                      {isRefundDone
                        ? formatLongDate(order.refund_processed_at) || '—'
                        : formatLongDate(order.refund_eta) || 'Pending'}
                    </p>
                  </div>
                </div>
              )}
              {!isRefundDone && (
                <p className="text-[11px] text-muted-foreground mt-3">
                  Refunds usually reflect in 5–7 business days after the package is picked up. You'll get a notification at every step.
                </p>
              )}

              {/* Refund-specific help */}
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold">Need help with this refund?</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Chat with us or send a message — we usually reply within 1 hour.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full shrink-0"
                  onClick={() => setRefundHelpOpen(true)}
                >
                  <PhoneCall size={14} className="mr-1.5" />
                  Get Help
                </Button>
              </div>
            </section>
          )}

          {/* Return rejection */}
          {isReturnRejected && (
            <section className="bg-card border-b border-border px-4 py-4">
              <div className="flex items-center gap-2 mb-2">
                <Undo2 size={18} className="text-destructive" />
                <h2 className="font-bold text-base">Return Rejected</h2>
              </div>
              {order.return_reason && (
                <div className="bg-secondary/40 rounded-md p-3 mb-2">
                  <p className="text-xs text-muted-foreground mb-1">Your reason</p>
                  <p className="text-sm">{order.return_reason}</p>
                </div>
              )}
              <div className="bg-destructive/5 border border-destructive/20 rounded-md p-3">
                <p className="text-xs text-destructive font-bold mb-1">Rejection reason</p>
                <p className="text-sm">{order.rejection_reason || 'Please contact support.'}</p>
              </div>
            </section>
          )}

          {/* Live courier tracking (collapsed unless toggled) */}
          {order.tracking_awb &&
            !isReturnFlow &&
            !isReturnRejected &&
            showFullTimeline && (
              <section className="bg-card border-b border-border px-4 py-4">
                <DelhiveryTracking
                  waybill={order.tracking_awb}
                  paused={['cancelled', 'delivered'].includes(order.status)}
                />
              </section>
            )}

          {/* Total + payment block (Meesho-style sticky-ish footer) */}
          <section className="bg-card border-b border-border px-4 py-4">
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="font-bold text-base">Total Product Price</p>
                {totalSavings > 0 && (
                  <p className="text-xs text-success mt-0.5">
                    You saved <span className="font-bold">{formatPrice(totalSavings)}</span>
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold text-base">{formatPrice(order.subtotal)}</p>
                {order.payment_status === 'paid' && (
                  <button
                    type="button"
                    onClick={() => setInvoiceOpen(true)}
                    className="text-primary text-xs font-bold uppercase tracking-wide hover:opacity-80 inline-flex items-center gap-1 mt-1"
                  >
                    <FileText size={12} />
                    View Bill
                  </button>
                )}
              </div>
            </div>

            <div className="bg-secondary/40 rounded-md px-3 py-3 mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-muted-foreground" />
                <span className="text-sm font-medium">{order.payment_method}</span>
              </div>
              <span className="font-bold text-sm">{formatPrice(order.total)}</span>
            </div>
          </section>

          {/* Rate the product (only after delivery / refund completed) */}
          {firstItem?.product_id && (isDelivered || isRefundDone) && (
            <OrderRating
              productId={firstItem.product_id}
              productName={firstItem.product_name}
            />
          )}

          {/* Recommended products */}
          {firstItem?.product_id && (
            <YouMayAlsoLike excludeProductId={firstItem.product_id} />
          )}
        </main>

        {/* Cancel dialog */}
        <AlertDialog
          open={showCancelDialog}
          onOpenChange={(open) => {
            setShowCancelDialog(open);
            if (!open) setCancelReason('');
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
              <AlertDialogDescription>
                Once cancelled, this order cannot be reinstated. Refund will be initiated to your
                original payment method within 5–7 business days.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Reason for cancellation{' '}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Textarea
                placeholder="Tell us why you're cancelling — helps us improve."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                maxLength={500}
                disabled={isCancelling}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isCancelling}>Keep Order</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleCancelOrder();
                }}
                disabled={isCancelling}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isCancelling ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                Yes, Cancel Order
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Return dialog */}
        <Dialog
          open={returnDialogOpen}
          onOpenChange={(open) => {
            setReturnDialogOpen(open);
            if (!open) setReturnReason('');
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Return</DialogTitle>
              <DialogDescription>
                Tell us why you'd like to return this order.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Wrong size, defective item, not as described..."
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              rows={4}
            />
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setReturnDialogOpen(false);
                  setReturnReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRequestReturn}
                disabled={submittingReturn || returnReason.trim().length < 5}
              >
                {submittingReturn ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                Submit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Help dialog */}
        <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Need help with this order?</DialogTitle>
              <DialogDescription>
                Reach out to our support team for any questions about this order.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Button asChild className="w-full justify-start">
                <a href="tel:+919136354192">
                  <PhoneCall size={16} className="mr-2" /> Call Support
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <a
                  href={`https://wa.me/919136354192?text=Hi,%20I%20need%20help%20with%20order%20${order.order_number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <PhoneCall size={16} className="mr-2" /> WhatsApp Us
                </a>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-start">
                <Link to="/contact">View Contact Page</Link>
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Refund-specific help dialog */}
        <Dialog
          open={refundHelpOpen}
          onOpenChange={(open) => {
            setRefundHelpOpen(open);
            if (!open) setRefundMessage('');
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Refund Help</DialogTitle>
              <DialogDescription>
                Tell us what's wrong with your refund for order #{order.order_number}. Our team will respond as soon as possible.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              {/* Quick chat / call buttons */}
              <Button asChild className="w-full justify-start">
                <a
                  href={`https://wa.me/919136354192?text=${encodeURIComponent(
                    `Hi MUFFIGOUT support, I need help with my refund for order #${order.order_number}.\nCurrent status: ${order.status.replace(/_/g, ' ')}\nRefund amount: ₹${(order.refund_amount ?? order.total).toLocaleString('en-IN')}\n\nIssue: `,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <PhoneCall size={16} className="mr-2" /> Chat on WhatsApp
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <a href="tel:+919136354192">
                  <PhoneCall size={16} className="mr-2" /> Call Support
                </a>
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-[11px] uppercase tracking-wide">
                  <span className="bg-background px-2 text-muted-foreground">or send a message</span>
                </div>
              </div>

              {/* Inline contact form */}
              <Textarea
                placeholder="Describe the issue (e.g. refund not received, wrong amount, taking too long)..."
                value={refundMessage}
                onChange={(e) => setRefundMessage(e.target.value)}
                rows={4}
              />
              <Button
                className="w-full"
                disabled={refundMessage.trim().length < 5 || submittingRefundHelp}
                onClick={async () => {
                  if (!user) return;
                  setSubmittingRefundHelp(true);
                  try {
                    const ctx = `[Refund Help — Order #${order.order_number} | Status: ${order.status} | Amount: ₹${(order.refund_amount ?? order.total).toLocaleString('en-IN')}]\n\n${refundMessage.trim()}`;
                    const { error } = await supabase.from('chat_messages').insert({
                      user_id: user.id,
                      role: 'user',
                      content: ctx,
                    });
                    if (error) throw error;
                    toast.success('Message sent. Our support team will reach out shortly.');
                    setRefundHelpOpen(false);
                    setRefundMessage('');
                  } catch (err: any) {
                    toast.error(err.message || 'Failed to send message. Try WhatsApp instead.');
                  } finally {
                    setSubmittingRefundHelp(false);
                  }
                }}
              >
                {submittingRefundHelp ? (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                ) : null}
                Send Message
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Invoice dialog */}
        <InvoiceDialog
          open={invoiceOpen}
          onOpenChange={setInvoiceOpen}
          orderId={order.id}
          orderNumber={order.order_number}
          invoiceUrl={order.invoice_url}
          onGenerated={(url) => setOrder({ ...order, invoice_url: url })}
        />
      </div>
    );
  }

  // ── SEARCH / EMPTY STATE (no order loaded) ────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="font-serif text-3xl font-bold mb-6">Track Your Order</h1>

        <div className="flex gap-2 mb-4">
          <Button
            variant={trackingMode === 'order' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setTrackingMode('order');
              setSearchError('');
            }}
          >
            <Package size={16} className="mr-1" /> By Order Number
          </Button>
          <Button
            variant={trackingMode === 'awb' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setTrackingMode('awb');
              setSearchError('');
            }}
          >
            <Navigation size={16} className="mr-1" /> By AWB Number
          </Button>
        </div>

        <form onSubmit={handleSearch} className="flex gap-3 mb-2">
          <div className="relative flex-1">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            {trackingMode === 'order' ? (
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchError('');
                }}
                placeholder="Enter Order Number"
                className={`pl-10 h-11 rounded-full bg-secondary/40 ${searchError ? 'border-destructive' : ''}`}
              />
            ) : (
              <Input
                value={awbQuery}
                onChange={(e) => {
                  setAwbQuery(e.target.value);
                  setSearchError('');
                }}
                placeholder="Enter AWB / Tracking Number"
                className={`pl-10 h-11 rounded-full bg-secondary/40 ${searchError ? 'border-destructive' : ''}`}
              />
            )}
          </div>
          <Button type="submit" className="rounded-full h-11 px-6" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Track'}
          </Button>
        </form>
        {searchError && <p className="text-xs text-destructive mb-4">{searchError}</p>}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : trackingMode === 'awb' && awbQuery.trim() ? (
          <DelhiveryTracking waybill={awbQuery.trim()} />
        ) : searchQuery && !orderId ? (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-muted-foreground mb-4" />
            <h2 className="font-semibold text-lg mb-2">Order not found</h2>
            <p className="text-muted-foreground">We couldn't find an order with that number.</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <Truck size={48} className="mx-auto text-muted-foreground mb-4" />
            <h2 className="font-semibold text-lg mb-2">Track your shipment</h2>
            <p className="text-muted-foreground">Enter your order number or AWB to see the status</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

/* ── Status block (Meesho-style headline + optional callout) ──────── */
const StatusBlock = ({
  order,
  onShowFullTimeline,
}: {
  order: Order;
  onShowFullTimeline: () => void;
}) => {
  const { formatPrice } = useCurrency();
  const status = order.status;

  // Compute headline + sub
  let icon = Package;
  let iconBg = 'bg-primary';
  let label = 'Order Placed';
  let sub: string | null = null;
  let callout: { tone: 'success' | 'info' | 'danger'; text: string; icon: any } | null = null;

  const formatDate = (iso?: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString('en-IN', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
        })
      : '';

  if (status === 'delivered') {
    icon = Zap;
    iconBg = 'bg-success';
    label = 'Delivered';
    sub = order.delivered_at ? formatDate(order.delivered_at) : null;
    // Estimate "delivered early" if delivered_at is before created_at + 5 days
    if (order.delivered_at) {
      const created = new Date(order.created_at).getTime();
      const delivered = new Date(order.delivered_at).getTime();
      const expectedMs = created + 5 * 24 * 60 * 60 * 1000;
      const earlyDays = Math.floor((expectedMs - delivered) / (24 * 60 * 60 * 1000));
      if (earlyDays >= 1) {
        label = 'Delivered Early';
        callout = {
          tone: 'success',
          text: `Yay! Your order was delivered ${earlyDays} day${earlyDays > 1 ? 's' : ''} earlier.`,
          icon: Zap,
        };
      }
    }
  } else if (status === 'out_for_delivery') {
    icon = Truck;
    iconBg = 'bg-primary';
    label = 'Out for Delivery';
    sub = 'Arriving today';
  } else if (status === 'shipped') {
    icon = Truck;
    iconBg = 'bg-primary';
    label = 'Shipped';
    sub = order.tracking_awb ? `AWB ${order.tracking_awb}` : 'On its way';
  } else if (status === 'confirmed') {
    icon = CheckCircle2;
    iconBg = 'bg-primary';
    label = 'Order Confirmed';
    sub = 'Preparing for shipment';
  } else if (status === 'placed') {
    icon = Package;
    iconBg = 'bg-primary';
    label = 'Order Placed';
    sub = `On ${formatDate(order.created_at)}`;
  } else if (status === 'cancelled') {
    icon = XCircle;
    iconBg = 'bg-destructive';
    label = 'Order Cancelled';
    sub = 'As per your request';
  } else if (status === 'refund_processed') {
    icon = IndianRupee;
    iconBg = 'bg-success';
    label = 'Refund Successful';
    sub = `${formatPrice(Number(order.refund_amount ?? order.total))} refunded${
      order.refund_processed_at ? ` on ${formatDate(order.refund_processed_at)}` : ''
    }`;
    callout = {
      tone: 'success',
      text: 'Yay! Refund credited to source',
      icon: CreditCard,
    };
  } else if (status === 'return_requested') {
    icon = Undo2;
    iconBg = 'bg-primary';
    label = 'Return Requested';
    sub = 'We will get in touch shortly';
  } else if (status === 'return_approved') {
    icon = CheckCircle2;
    iconBg = 'bg-success';
    label = 'Return Approved';
    sub = order.refund_eta ? `Refund expected by ${formatDate(order.refund_eta)}` : null;
  } else if (status === 'return_picked_up') {
    icon = Truck;
    iconBg = 'bg-primary';
    label = 'Return Picked Up';
    sub = 'Refund will be initiated soon';
  } else if (status === 'return_rejected') {
    icon = Undo2;
    iconBg = 'bg-destructive';
    label = 'Return Rejected';
  } else if (status.startsWith('replacement')) {
    icon = RefreshCw;
    iconBg = 'bg-accent';
    label = status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    sub = 'Replacement in progress';
  }

  const Icon = icon;
  const CalloutIcon = callout?.icon;

  return (
    <section className="bg-card border-b border-border px-4 py-4">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={20} className="text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-base leading-snug">{label}</p>
          {sub && <p className="text-sm text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </div>

      {callout && CalloutIcon && (
        <div
          className={`mt-3 rounded-md px-3 py-2.5 flex items-center gap-2 ${
            callout.tone === 'success'
              ? 'bg-success/15 text-success'
              : callout.tone === 'danger'
                ? 'bg-destructive/15 text-destructive'
                : 'bg-primary/10 text-primary'
          }`}
        >
          <CalloutIcon size={16} className="flex-shrink-0" />
          <p className="text-sm font-medium">{callout.text}</p>
        </div>
      )}

      {/* Show full courier timeline toggle */}
      {order.tracking_awb &&
        !['cancelled', 'return_requested', 'return_approved', 'return_picked_up', 'refund_processed', 'return_rejected'].includes(status) && (
          <button
            type="button"
            onClick={onShowFullTimeline}
            className="mt-3 text-primary text-sm font-bold uppercase tracking-wide hover:opacity-80"
          >
            View Full Tracking
          </button>
        )}
    </section>
  );
};

/* ── Refund Timeline (5-step visual progress) ─────────────────────── */
const RefundTimeline = ({ order }: { order: Order }) => {
  const status = order.status;

  type StepKey = 'requested' | 'approved' | 'picked_up' | 'initiated' | 'refunded';

  // Determine which step the order has reached
  const reached: Record<StepKey, boolean> = {
    requested: ['return_requested', 'return_approved', 'return_picked_up', 'picked_up', 'refund_processed'].includes(status),
    approved: ['return_approved', 'return_picked_up', 'picked_up', 'refund_processed'].includes(status),
    picked_up: ['return_picked_up', 'picked_up', 'refund_processed'].includes(status),
    initiated: ['picked_up', 'refund_processed'].includes(status),
    refunded: status === 'refund_processed',
  };

  // Best-effort timestamps
  const ts: Record<StepKey, string | null> = {
    requested: order.created_at, // request submitted (close enough — created_at of return)
    approved: order.refund_eta ? null : null, // we don't track approval time separately
    picked_up: null,
    initiated: null,
    refunded: order.refund_processed_at,
  };

  const steps: { key: StepKey; label: string; sub: string }[] = [
    { key: 'requested', label: 'Return Requested', sub: 'We received your request' },
    { key: 'approved', label: 'Return Approved', sub: 'Pickup will be scheduled' },
    { key: 'picked_up', label: 'Package Picked Up', sub: 'Courier collected the package' },
    { key: 'initiated', label: 'Refund Initiated', sub: 'Sent to your bank/PayU' },
    { key: 'refunded', label: 'Refund Completed', sub: 'Money credited to source' },
  ];

  const formatStepDate = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : '';

  return (
    <ol className="relative">
      {steps.map((step, idx) => {
        const isReached = reached[step.key];
        const isCurrent =
          isReached &&
          (idx === steps.length - 1 || !reached[steps[idx + 1].key]);
        const isLast = idx === steps.length - 1;
        const date = formatStepDate(ts[step.key]);

        return (
          <li key={step.key} className="relative pl-8 pb-5 last:pb-0">
            {/* connector line */}
            {!isLast && (
              <span
                className={`absolute left-[11px] top-5 bottom-0 w-0.5 ${
                  reached[steps[idx + 1].key] ? 'bg-success' : 'bg-border'
                }`}
                aria-hidden="true"
              />
            )}
            {/* dot */}
            <span
              className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center ${
                isReached
                  ? isCurrent
                    ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                    : 'bg-success text-primary-foreground'
                  : 'bg-secondary text-muted-foreground border border-border'
              }`}
              aria-hidden="true"
            >
              {isReached ? (
                <CheckCircle2 size={14} />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
              )}
            </span>
            <div className="min-w-0">
              <p
                className={`text-sm font-bold leading-tight ${
                  isReached ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{step.sub}</p>
              {isReached && date && (
                <p className="text-[11px] text-muted-foreground mt-0.5">{date}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export default TrackOrder;
