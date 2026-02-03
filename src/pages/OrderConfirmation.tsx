import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, Package, Truck, MapPin } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface OrderDetails {
  orderId: string;
  paymentId?: string;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    size: string;
    color: string;
    image: string;
  }[];
  total: number;
  shippingCost: number;
  address: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  paymentMethod: string;
}

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const orderDetails = location.state as OrderDetails | null;

  useEffect(() => {
    // Redirect if no order details
    if (!orderDetails) {
      navigate('/');
    }
  }, [orderDetails, navigate]);

  if (!orderDetails) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Success Banner */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-success" />
          </div>
          <h1 className="font-serif text-3xl lg:text-4xl font-bold mb-3">
            Order Confirmed!
          </h1>
          <p className="text-muted-foreground text-lg">
            Thank you for your purchase. Your order has been placed successfully.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {/* Order Info Card */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-sm text-muted-foreground">Order ID</p>
                <p className="font-mono font-semibold text-lg">{orderDetails.orderId}</p>
              </div>
              {orderDetails.paymentId && (
                <div className="sm:text-right">
                  <p className="text-sm text-muted-foreground">Payment ID</p>
                  <p className="font-mono text-sm">{orderDetails.paymentId}</p>
                </div>
              )}
            </div>

            <Separator className="my-4" />

            {/* Order Items */}
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Package size={18} />
              Order Items
            </h3>
            <div className="space-y-4">
              {orderDetails.items.map((item, index) => (
                <div key={index} className="flex gap-4">
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

            <Separator className="my-4" />

            {/* Delivery Address */}
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MapPin size={18} />
              Delivery Address
            </h3>
            <p className="text-muted-foreground">
              {orderDetails.address.firstName} {orderDetails.address.lastName}
              <br />
              {orderDetails.address.address}
              <br />
              {orderDetails.address.city}, {orderDetails.address.state} - {orderDetails.address.pincode}
            </p>

            <Separator className="my-4" />

            {/* Payment Summary */}
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
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method</span>
                <span>{orderDetails.paymentMethod}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total Paid</span>
                <span>₹{orderDetails.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="bg-secondary/50 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Truck className="w-6 h-6 text-primary" />
              <h3 className="font-semibold">Estimated Delivery</h3>
            </div>
            <p className="text-muted-foreground">
              Your order will be delivered within 3-5 business days. You'll receive tracking updates via email and SMS.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              className="flex-1"
              onClick={() => navigate('/track-order')}
            >
              Track Your Order
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/products')}
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderConfirmation;
