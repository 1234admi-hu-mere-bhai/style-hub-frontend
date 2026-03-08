import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, Truck, MapPin, ChevronRight, Loader2, LogIn, Clock } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/hooks/useCurrency';
import { createOrder } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useRazorpay, RazorpayResponse } from '@/hooks/useRazorpay';
import PincodeChecker from '@/components/PincodeChecker';

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { items: cartItems, totalPrice: cartTotalPrice, clearCart, buyNowItem, setBuyNowItem } = useCart();
  const { user, isLoading: authLoading } = useAuth();
  const { formatPrice } = useCurrency();
  const isBuyNow = searchParams.get('buyNow') === 'true' && buyNowItem !== null;
  const items = isBuyNow ? [buyNowItem!] : cartItems;
  const totalPrice = isBuyNow ? buyNowItem!.price * buyNowItem!.quantity : cartTotalPrice;
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [step, setStep] = useState<'address' | 'payment' | 'summary'>('address');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  
  // Form state for address
  const [addressForm, setAddressForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
  });

  const [deliveryInfo, setDeliveryInfo] = useState<{ estimatedDays: string; zone: string } | null>(null);

  const shippingCost = totalPrice >= 999 ? 0 : 99;
  const finalTotal = totalPrice + shippingCost;

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user && items.length > 0) {
      // Don't auto-redirect, show login prompt instead
    }
  }, [user, authLoading, items.length]);

  // Navigate to order confirmation
  const navigateToConfirmation = (orderNumber: string, paymentId?: string) => {
    const orderDetails = {
      orderId: orderNumber,
      paymentId,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        image: item.image,
      })),
      total: finalTotal,
      shippingCost,
      address: addressForm,
      paymentMethod: 'Online Payment (Razorpay)',
    };
    if (isBuyNow) { setBuyNowItem(null); } else { clearCart(); }
    navigate('/order-confirmation', { state: orderDetails });
  };

  // Razorpay integration
  const { initiatePayment, isLoading: isPaymentLoading } = useRazorpay({
    onSuccess: async (response: RazorpayResponse) => {
      toast.success('Payment successful!', {
        description: `Payment ID: ${response.razorpay_payment_id}`,
      });
      
      try {
        setIsPlacingOrder(true);
        const order = await createOrder({
          userId: user!.id,
          items: items.map(item => ({
            product_id: item.id,
            product_name: item.name,
            price: item.price,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
            image: item.image,
          })),
          subtotal: totalPrice,
          shippingCost,
          total: finalTotal,
          shippingAddress: addressForm,
          paymentMethod: 'Online Payment (Razorpay)',
          paymentId: response.razorpay_payment_id,
        });
        navigateToConfirmation(order.order_number, response.razorpay_payment_id);
      } catch (error) {
        console.error('Failed to create order:', error);
        toast.error('Failed to create order. Please contact support.');
      } finally {
        setIsPlacingOrder(false);
      }
    },
    onError: (error) => {
      toast.error('Payment failed', {
        description: error.message,
      });
    },
    onDismiss: () => {
      toast.info('Payment cancelled');
    },
  });

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('Please log in to place an order');
      navigate('/auth');
      return;
    }

    // Initiate Razorpay payment
    await initiatePayment({
      amount: finalTotal,
      customerName: `${addressForm.firstName} ${addressForm.lastName}`,
      customerPhone: addressForm.phone,
      description: `Order of ${items.length} item(s) from MUFFI GOUT APPAREL HUB`,
    });
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddressForm({ ...addressForm, [e.target.id]: e.target.value });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-serif text-3xl font-bold mb-4">Your Cart is Empty</h1>
          <p className="text-muted-foreground mb-8">
            Add some items to your cart before checking out.
          </p>
          <Button asChild>
            <Link to="/products">Continue Shopping</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  // Show login prompt if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <LogIn size={48} className="mx-auto text-muted-foreground mb-4" />
            <h1 className="font-serif text-3xl font-bold mb-4">Sign In Required</h1>
            <p className="text-muted-foreground mb-8">
              Please sign in to your account to proceed with checkout. Your cart items will be saved.
            </p>
            <div className="flex flex-col gap-4">
              <Button asChild size="lg">
                <Link to="/auth">Sign In / Create Account</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/products">Continue Shopping</Link>
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="font-serif text-3xl font-bold mb-8">Checkout</h1>

        {/* Steps */}
        <div className="flex items-center justify-center mb-8">
          {['address', 'payment', 'summary'].map((s, index) => (
            <div key={s} className="flex items-center">
              <button
                onClick={() => setStep(s as typeof step)}
                className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                  step === s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {index + 1}
              </button>
              <span
                className={`ml-2 text-sm font-medium capitalize hidden sm:block ${
                  step === s ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {s}
              </span>
              {index < 2 && (
                <ChevronRight className="w-4 h-4 mx-4 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            {step === 'address' && (
              <div className="bg-card p-6 rounded-lg border border-border">
                <h2 className="font-semibold text-lg mb-6 flex items-center gap-2">
                  <MapPin size={20} />
                  Delivery Address
                </h2>
                <form className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input 
                        id="firstName" 
                        placeholder="John" 
                        value={addressForm.firstName}
                        onChange={handleAddressChange}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input 
                        id="lastName" 
                        placeholder="Doe" 
                        value={addressForm.lastName}
                        onChange={handleAddressChange}
                        required 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      placeholder="+91 98765 43210" 
                      value={addressForm.phone}
                      onChange={handleAddressChange}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input 
                      id="address" 
                      placeholder="House No, Street Name" 
                      value={addressForm.address}
                      onChange={handleAddressChange}
                      required 
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input 
                        id="city" 
                        placeholder="Mumbai" 
                        value={addressForm.city}
                        onChange={handleAddressChange}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input 
                        id="state" 
                        placeholder="Maharashtra" 
                        value={addressForm.state}
                        onChange={handleAddressChange}
                        required 
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pincode">PIN Code</Label>
                      <Input 
                        id="pincode" 
                        placeholder="400001" 
                        value={addressForm.pincode}
                        onChange={handleAddressChange}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="landmark">Landmark (Optional)</Label>
                      <Input 
                        id="landmark" 
                        placeholder="Near..." 
                        value={addressForm.landmark}
                        onChange={handleAddressChange}
                      />
                    </div>
                  </div>

                  {/* Pincode Delivery Checker */}
                  <div className="bg-secondary/30 p-4 rounded-lg space-y-2">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <Clock size={16} className="text-primary" />
                      Check Delivery Availability
                    </h3>
                    <PincodeChecker
                      pincode={addressForm.pincode}
                      onDeliveryInfo={setDeliveryInfo}
                    />
                  </div>

                  <Button
                    type="button"
                    className="w-full mt-4"
                    onClick={() => setStep('payment')}
                  >
                    Continue to Payment
                  </Button>
                </form>
              </div>
            )}

            {step === 'payment' && (
              <div className="bg-card p-6 rounded-lg border border-border">
                <h2 className="font-semibold text-lg mb-6 flex items-center gap-2">
                  <CreditCard size={20} />
                  Payment Method
                </h2>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <img 
                      src="https://razorpay.com/assets/razorpay-logo.svg" 
                      alt="Razorpay" 
                      className="h-6 dark:invert"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You will be redirected to Razorpay's secure payment gateway to complete your payment.
                    Supports UPI, Credit/Debit Cards, Net Banking, and Wallets.
                  </p>
                </div>

                <div className="flex gap-4 mt-6">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep('address')}
                  >
                    Back
                  </Button>
                  <Button className="flex-1" onClick={() => setStep('summary')}>
                    Review Order
                  </Button>
                </div>
              </div>
            )}

            {step === 'summary' && (
              <div className="bg-card p-6 rounded-lg border border-border">
                <h2 className="font-semibold text-lg mb-6">Order Summary</h2>
                <div className="space-y-4">
                  {items.map((item) => (
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

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery Address</span>
                    <span className="text-right">
                      {addressForm.address ? `${addressForm.address}, ${addressForm.city}` : 'Not provided'}, 
                      {addressForm.state} - {addressForm.pincode}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Method</span>
                    <span>Online Payment (Razorpay)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated Delivery</span>
                    <span>{deliveryInfo ? `${deliveryInfo.estimatedDays} Business Days` : '3-5 Business Days'}</span>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep('payment')}
                    disabled={isPaymentLoading || isPlacingOrder}
                  >
                    Back
                  </Button>
                  <Button 
                    className="flex-1" 
                    onClick={handlePlaceOrder}
                    disabled={isPaymentLoading || isPlacingOrder}
                  >
                    {isPaymentLoading || isPlacingOrder ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Pay ₹${finalTotal.toLocaleString()}`
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card p-6 rounded-lg border border-border sticky top-28">
              <h3 className="font-semibold text-lg mb-4">Order Details</h3>
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div
                    key={`${item.id}-${item.size}-${item.color}`}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-muted-foreground">
                      {item.name} x{item.quantity}
                    </span>
                    <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className={shippingCost === 0 ? 'text-success' : ''}>
                    {shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}
                  </span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>₹{finalTotal.toLocaleString()}</span>
              </div>

              {shippingCost > 0 && (
                <p className="text-xs text-muted-foreground mt-4">
                  Add ₹{999 - totalPrice} more for free shipping
                </p>
              )}

              <div className="mt-6 p-4 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Truck size={16} className="text-primary" />
                  <span>Estimated delivery: {deliveryInfo ? `${deliveryInfo.estimatedDays} business days (${deliveryInfo.zone})` : 'Enter pincode for estimate'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
