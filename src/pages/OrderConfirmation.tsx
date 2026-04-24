import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Package, FileText, ArrowRight, Truck, MapPin, ExternalLink, Copy } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import OrderSuccessHero from '@/components/OrderSuccessHero';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  image: string;
}

interface OrderDetails {
  orderId: string;
  paymentId?: string;
  items: OrderItem[];
  total: number;
  shippingCost: number;
  address: {
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };
  paymentMethod: string;
}

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const orderDetails = location.state as OrderDetails | null;
  const [awb, setAwb] = useState<string | null>(null);

  useEffect(() => {
    if (!orderDetails) {
      navigate('/');
    }
  }, [orderDetails, navigate]);

  // Poll for AWB — Delhivery shipment is created shortly after order confirmation by admin/automation.
  // Check immediately, then every 30s for up to 10 minutes.
  useEffect(() => {
    if (!orderDetails?.orderId) return;
    let attempts = 0;
    const maxAttempts = 20;
    let cancelled = false;

    const checkAwb = async () => {
      const { data } = await supabase
        .from('orders')
        .select('tracking_awb')
        .eq('order_number', orderDetails.orderId)
        .maybeSingle();
      if (cancelled) return;
      if (data?.tracking_awb) {
        setAwb(data.tracking_awb);
        return true;
      }
      return false;
    };

    checkAwb().then((found) => {
      if (found) return;
      const id = window.setInterval(async () => {
        attempts++;
        const found = await checkAwb();
        if (found || attempts >= maxAttempts) window.clearInterval(id);
      }, 30000);
      return () => window.clearInterval(id);
    });

    return () => {
      cancelled = true;
    };
  }, [orderDetails?.orderId]);

  if (!orderDetails) {
    return null;
  }

  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <h1 className="font-serif text-3xl font-bold mb-2">Order Confirmed</h1>
            <p className="text-muted-foreground">
              Thank you for shopping with MUFFIGOUT. A confirmation email is on its way.
            </p>
          </div>

          {/* Order Info Card */}
          <div className="bg-card p-6 rounded-lg border border-border mb-6">
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-muted-foreground">Order Number</p>
                <p className="font-semibold font-mono text-lg">{orderDetails.orderId}</p>
              </div>
              {orderDetails.paymentId && (
                <div>
                  <p className="text-sm text-muted-foreground">Payment ID</p>
                  <p className="font-semibold font-mono">{orderDetails.paymentId}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <p className="font-semibold">{orderDetails.paymentMethod}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estimated Delivery</p>
                <p className="font-semibold">
                  {estimatedDelivery.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Order Items */}
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Package size={18} />
              Order Items
            </h3>
            <div className="space-y-4">
              {orderDetails.items.map((item) => (
                <div
                  key={`${item.id}-${item.size}-${item.color}`}
                  className="flex gap-4"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Size: {item.size} | Color: {item.color} | Qty: {item.quantity}
                    </p>
                    <p className="font-semibold mt-1">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-6" />

            {/* Delivery Address */}
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MapPin size={18} />
              Delivery Address
            </h3>
            <p className="text-muted-foreground">
              {orderDetails.address.firstName} {orderDetails.address.lastName}<br />
              {orderDetails.address.address}
              {orderDetails.address.landmark && `, ${orderDetails.address.landmark}`}<br />
              {orderDetails.address.city}, {orderDetails.address.state} - {orderDetails.address.pincode}<br />
              {orderDetails.address.phone && `Phone: ${orderDetails.address.phone}`}
            </p>

            <Separator className="my-6" />

            {/* Pricing */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{(orderDetails.total - orderDetails.shippingCost).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className={orderDetails.shippingCost === 0 ? 'text-success' : ''}>
                  {orderDetails.shippingCost === 0 ? 'FREE' : `₹${orderDetails.shippingCost}`}
                </span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>₹{orderDetails.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="bg-secondary/50 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Truck className="w-6 h-6 text-primary" />
              <h3 className="font-semibold">Estimated Delivery</h3>
            </div>
            <p className="text-muted-foreground">
              Your order is expected to arrive within 3–5 business days. Tracking updates will be sent via email and SMS.
            </p>
          </div>

          {/* Shipment Tracking (courier-agnostic) */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <Package className="w-6 h-6 text-primary" />
              <h3 className="font-semibold">Shipment Tracking</h3>
            </div>
            {awb ? (
              <div className="space-y-3">
                <div className="bg-primary/5 border border-primary/20 rounded-md p-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium mb-1">Tracking / AWB Number</p>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <p className="font-mono font-bold text-base text-primary break-all">{awb}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={() => {
                        navigator.clipboard?.writeText(awb);
                        toast.success('Tracking number copied to clipboard');
                      }}
                    >
                      <Copy size={14} className="mr-1.5" /> Copy
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Use this tracking number on your courier partner's official website (Delhivery, Bluedart, DTDC, India Post) to view live shipment status.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Your tracking number will appear here once your order is dispatched (typically within 24 hours). It will also be available in your{' '}
                <Link to="/orders" className="text-primary hover:underline font-medium">order history</Link>.
              </p>
            )}
          </div>

          {/* Invoice Note */}
          <div className="bg-secondary/50 p-4 rounded-lg mb-6">
            <div className="flex items-start gap-3">
              <FileText size={20} className="text-primary mt-0.5" />
              <div>
                <p className="font-medium">Invoice</p>
                <p className="text-sm text-muted-foreground">
                  {orderDetails.paymentId 
                    ? 'Your invoice is being generated and will be available shortly in your order history.'
                    : 'Your invoice will be available in your order history once delivery is complete.'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild className="flex-1">
              <Link to={`/track-order?id=${orderDetails.orderId}`}>
                <Package size={18} className="mr-2" />
                Track Order
              </Link>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link to="/orders">
                View All Orders
                <ArrowRight size={18} className="ml-2" />
              </Link>
            </Button>
          </div>

          <div className="text-center mt-8">
            <Link to="/products" className="text-primary hover:underline">
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderConfirmation;
