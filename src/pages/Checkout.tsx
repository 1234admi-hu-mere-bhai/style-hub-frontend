import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Truck, MapPin, ChevronRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [step, setStep] = useState<'address' | 'payment' | 'summary'>('address');

  const shippingCost = totalPrice >= 999 ? 0 : 99;
  const finalTotal = totalPrice + shippingCost;

  const handlePlaceOrder = () => {
    toast.success('Order placed successfully! (Demo)', {
      description: 'You will receive a confirmation email shortly.',
    });
    clearCart();
  };

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
                      <Input id="firstName" placeholder="John" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" placeholder="Doe" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" placeholder="+91 98765 43210" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" placeholder="House No, Street Name" required />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" placeholder="Mumbai" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input id="state" placeholder="Maharashtra" required />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pincode">PIN Code</Label>
                      <Input id="pincode" placeholder="400001" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="landmark">Landmark (Optional)</Label>
                      <Input id="landmark" placeholder="Near..." />
                    </div>
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
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  className="space-y-4"
                >
                  <div
                    className={`flex items-center space-x-4 p-4 border rounded-lg cursor-pointer ${
                      paymentMethod === 'cod'
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                  >
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="flex-1 cursor-pointer">
                      <span className="font-medium">Cash on Delivery (COD)</span>
                      <p className="text-sm text-muted-foreground">
                        Pay when your order arrives
                      </p>
                    </Label>
                  </div>
                  <div
                    className={`flex items-center space-x-4 p-4 border rounded-lg cursor-pointer ${
                      paymentMethod === 'online'
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                  >
                    <RadioGroupItem value="online" id="online" />
                    <Label htmlFor="online" className="flex-1 cursor-pointer">
                      <span className="font-medium">Online Payment</span>
                      <p className="text-sm text-muted-foreground">
                        UPI, Cards, Net Banking
                      </p>
                    </Label>
                  </div>
                </RadioGroup>

                {paymentMethod === 'online' && (
                  <div className="mt-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiry">Expiry Date</Label>
                        <Input id="expiry" placeholder="MM/YY" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvv">CVV</Label>
                        <Input id="cvv" placeholder="123" />
                      </div>
                    </div>
                  </div>
                )}

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
                    <span>Mumbai, Maharashtra - 400001</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Method</span>
                    <span>
                      {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated Delivery</span>
                    <span>3-5 Business Days</span>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep('payment')}
                  >
                    Back
                  </Button>
                  <Button className="flex-1" onClick={handlePlaceOrder}>
                    Place Order
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
                  <span>Estimated delivery: 3-5 business days</span>
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
