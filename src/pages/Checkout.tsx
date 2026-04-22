import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, Truck, MapPin, ChevronRight, Loader2, LogIn, Clock, Tag, X, ChevronDown, Heart, Check, Plus, Edit2, Zap, Banknote, LocateFixed } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { INDIAN_STATES, fetchCityStateFromPincode } from '@/data/indianStates';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/hooks/useCurrency';
import { createOrder } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { usePayU, PayUResponse } from '@/hooks/usePayU';

import { supabase } from '@/integrations/supabase/client';
import { useAddresses } from '@/hooks/useAddresses';
import { Address } from '@/data/user';
import { checkoutAddressSchema } from '@/lib/validations';
import { detectCurrentLocation } from '@/lib/geolocation';
import { checkCodEligibility, COD_FEE } from '@/lib/codEligibility';
import { calculateShipping } from '@/lib/shipping';

const getEstimatedDeliveryDate = (days?: string | number) => {
  const deliveryDays = typeof days === 'number' ? days : days ? parseInt(days) : 5;
  const date = new Date();
  date.setDate(date.getDate() + deliveryDays);
  return date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
};

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { items: cartItems, totalPrice: cartTotalPrice, clearCart, buyNowItem, setBuyNowItem, removeFromCart, revalidateCartPrices } = useCart();
  const [flashSaleExpired, setFlashSaleExpired] = useState(false);

  // Revalidate flash sale prices on checkout load and every 30s
  useEffect(() => {
    const check = async () => {
      const ended = await revalidateCartPrices();
      if (ended) {
        setFlashSaleExpired(true);
        toast.warning('⚡ The Flash Sale has ended. Prices have been reset to standard.', { duration: 8000 });
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);
  const { addToWishlist } = useWishlist();
  const { user, isLoading: authLoading } = useAuth();
  const { formatPrice } = useCurrency();
  const isBuyNow = searchParams.get('buyNow') === 'true' && buyNowItem !== null;
  const items = isBuyNow ? [buyNowItem!] : cartItems;
  const totalPrice = isBuyNow ? buyNowItem!.price * buyNowItem!.quantity : cartTotalPrice;
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [step, setStep] = useState<'address' | 'payment' | 'summary'>('address');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showPriceDetails, setShowPriceDetails] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount_type: string; discount_value: number } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [savingsOpen, setSavingsOpen] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [expandedCoupon, setExpandedCoupon] = useState<string | null>(null);

  // Fetch available coupons
  useEffect(() => {
    const fetchCoupons = async () => {
      const { data } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .order('discount_value', { ascending: false });
      if (data) setAvailableCoupons(data);
    };
    fetchCoupons();
  }, []);
  
  // Saved addresses
  const { addresses: savedAddresses, setAddresses: setSavedAddresses } = useAddresses();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // Form state for new address (only used when adding new)
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

  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});
  const [deliveryInfo, setDeliveryInfo] = useState<{ estimatedDays: string; zone: string } | null>(null);

  // Auto-select default address
  useEffect(() => {
    if (savedAddresses.length > 0 && !selectedAddressId) {
      const defaultAddr = savedAddresses.find(a => a.isDefault) || savedAddresses[0];
      setSelectedAddressId(defaultAddr.id);
      // Populate addressForm from selected address for order creation
      setAddressForm({
        firstName: defaultAddr.fullName.split(' ')[0] || '',
        lastName: defaultAddr.fullName.split(' ').slice(1).join(' ') || '',
        phone: defaultAddr.phone,
        address: defaultAddr.address,
        city: defaultAddr.city,
        state: defaultAddr.state,
        pincode: defaultAddr.pincode,
        landmark: defaultAddr.landmark || '',
      });
    }
  }, [savedAddresses]);

  // Calculate product-level discounts (originalPrice vs price)
  const flashSaleDiscount = useMemo(() => {
    return items.reduce((sum, item) => {
      if (item.originalPrice && item.originalPrice > item.price) {
        return sum + (item.originalPrice - item.price) * item.quantity;
      }
      return sum;
    }, 0);
  }, [items]);

  const hasFlashSaleItems = useMemo(() => {
    return items.some(item => item.originalPrice && item.originalPrice > item.price);
  }, [items]);

  const allFlashSaleItems = useMemo(() => {
    return items.length > 0 && items.every(item => item.originalPrice && item.originalPrice > item.price);
  }, [items]);

  const nonFlashSaleTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      if (item.originalPrice && item.originalPrice > item.price) return sum;
      return sum + item.price * item.quantity;
    }, 0);
  }, [items]);

  // Calculate coupon discount — applies only to non-flash-sale items
  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    const couponBase = hasFlashSaleItems ? nonFlashSaleTotal : totalPrice;
    if (couponBase <= 0) return 0;
    if (appliedCoupon.discount_type === 'percentage') {
      return Math.round(couponBase * (appliedCoupon.discount_value / 100));
    }
    return Math.min(appliedCoupon.discount_value, couponBase);
  }, [appliedCoupon, totalPrice, hasFlashSaleItems, nonFlashSaleTotal]);

  const totalProductDiscount = flashSaleDiscount;

  const totalOriginalPrice = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = item.originalPrice || item.price;
      return sum + price * item.quantity;
    }, 0);
  }, [items]);

  const totalSavings = totalProductDiscount + discountAmount;

  // Shipping rules: WB intra-state ₹20 handling (7 days), Outside WB ₹99 / FREE ≥ ₹999 (10 days)
  const hasTestItem = items.some(i => i.price <= 1);
  const shippingQuote = useMemo(
    () => calculateShipping({
      subtotal: totalPrice,
      state: addressForm.state,
      pincode: addressForm.pincode,
      hasTestItem,
    }),
    [totalPrice, addressForm.state, addressForm.pincode, hasTestItem],
  );
  const shippingCost = shippingQuote.cost;

  // COD eligibility: subtotal after coupon, no flash items, serviceable pincode
  const postCouponSubtotal = totalPrice - discountAmount;
  const codEligibility = useMemo(
    () =>
      checkCodEligibility({
        postCouponSubtotal,
        hasFlashSaleItems,
        pincode: addressForm.pincode,
      }),
    [postCouponSubtotal, hasFlashSaleItems, addressForm.pincode],
  );

  // Auto-switch back to online if user picked COD then became ineligible
  useEffect(() => {
    if (paymentMethod === 'cod' && !codEligibility.eligible) {
      setPaymentMethod('online');
    }
  }, [codEligibility.eligible, paymentMethod]);

  const codFee = paymentMethod === 'cod' && codEligibility.eligible ? COD_FEE : 0;
  const finalTotal = totalPrice - discountAmount + shippingCost + codFee;

  const handleApplyCoupon = useCallback(async (codeOverride?: string) => {
    if (allFlashSaleItems) { toast.error('Coupons cannot be combined with Flash Sale items.'); return; }
    const code = (codeOverride || couponCode).trim().toUpperCase();
    if (!code) { toast.error('Please enter a coupon code.'); return; }
    setCouponLoading(true);
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('code, discount_type, discount_value, is_active, min_order_value, max_uses, used_count, expires_at')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (error || !data) { toast.error('This coupon code is not valid.'); setCouponLoading(false); return; }
      if (data.expires_at && new Date(data.expires_at) < new Date()) { toast.error('This coupon has expired.'); setCouponLoading(false); return; }
      if (data.max_uses && data.used_count !== null && data.used_count >= data.max_uses) { toast.error('This coupon has reached its usage limit.'); setCouponLoading(false); return; }
      if (data.min_order_value && totalPrice < data.min_order_value) { toast.error(`A minimum order of ₹${data.min_order_value} is required for this coupon.`); setCouponLoading(false); return; }

      setAppliedCoupon({ code: data.code, discount_type: data.discount_type, discount_value: data.discount_value });
      setCouponCode(data.code);
      setSavingsOpen(false);
      const couponBase = hasFlashSaleItems ? nonFlashSaleTotal : totalPrice;
      const savedAmount = data.discount_type === 'percentage' ? Math.round(couponBase * (data.discount_value / 100)) : Math.min(data.discount_value, couponBase);
      toast.success(`Coupon "${data.code}" applied — you save ₹${savedAmount}${hasFlashSaleItems ? ' (on non-sale items)' : ''}.`);
    } catch {
      toast.error('We could not validate this coupon. Please try again.');
    } finally {
      setCouponLoading(false);
    }
  }, [couponCode, totalPrice, allFlashSaleItems]);

  const removeCoupon = () => { setAppliedCoupon(null); setCouponCode(''); toast.info('Coupon removed.'); };

  const getCouponSavings = (coupon: any) => {
    const base = hasFlashSaleItems ? nonFlashSaleTotal : totalPrice;
    if (coupon.discount_type === 'percentage') return Math.round(base * (coupon.discount_value / 100));
    return Math.min(coupon.discount_value, base);
  };

  const getAmountNeeded = (coupon: any) => {
    if (coupon.min_order_value && totalPrice < coupon.min_order_value) return coupon.min_order_value - totalPrice;
    return 0;
  };

  const handleMoveToWishlist = (item: typeof items[0]) => {
    addToWishlist({ id: item.id, name: item.name, price: item.price, originalPrice: item.originalPrice, image: item.image });
    if (!isBuyNow) {
      removeFromCart(item.id, item.size, item.color);
    }
    toast.success('Moved to wishlist');
  };

  const handleRemoveItem = (item: typeof items[0]) => {
    if (!isBuyNow) {
      removeFromCart(item.id, item.size, item.color);
      toast.success('Item removed');
    }
  };

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
      codFee,
      address: addressForm,
      paymentMethod: paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment (PayU)',
    };
    if (isBuyNow) { setBuyNowItem(null); } else { clearCart(); }
    navigate('/order-confirmation', { state: orderDetails });
  };

  // PayU integration
  const { initiatePayment, isLoading: isPaymentLoading, isRateLimited, retryCountdown, retryAttempt, retryNow, cancelRetry } = usePayU({
    onSuccess: async (response: PayUResponse) => {
      toast.success('Payment successful', {
        description: `Transaction ID: ${response.txnid}`,
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
          paymentMethod: 'Online Payment (PayU)',
          paymentId: response.txnid,
        });
        navigateToConfirmation(order.order_number, response.txnid);
      } catch (error) {
        console.error('Failed to create order:', error);
        toast.error('We could not create your order. Please contact support.');
      } finally {
        setIsPlacingOrder(false);
      }
    },
    onError: async (error) => {
      toast.error('Payment unsuccessful', { description: error.message });
      const ended = await revalidateCartPrices();
      if (ended) {
        setFlashSaleExpired(true);
        toast.warning('⚡ The Flash Sale has ended. Prices have been updated — please review your order.', { duration: 10000 });
      }
    },
    onDismiss: async () => {
      toast.info('Payment cancelled.');
      const ended = await revalidateCartPrices();
      if (ended) {
        setFlashSaleExpired(true);
        toast.warning('⚡ The Flash Sale has ended. Prices have been updated — please review your order.', { duration: 10000 });
      }
    },
  });

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('Please sign in to place your order.');
      navigate('/auth');
      return;
    }

    // ── Cash on Delivery branch ──
    if (paymentMethod === 'cod') {
      if (!codEligibility.eligible) {
        toast.error(codEligibility.reason || 'Cash on Delivery is not available for this order.');
        return;
      }
      try {
        setIsPlacingOrder(true);
        const order = await createOrder({
          userId: user.id,
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
          codFee,
          total: finalTotal,
          shippingAddress: addressForm,
          paymentMethod: 'Cash on Delivery',
        });
        toast.success('Order placed — pay on delivery.');
        navigateToConfirmation(order.order_number);
      } catch (error) {
        console.error('Failed to create COD order:', error);
        toast.error('We could not place your order. Please try again.');
      } finally {
        setIsPlacingOrder(false);
      }
      return;
    }

    // ── PayU (online) branch ──
    sessionStorage.setItem('payu_checkout', JSON.stringify({
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
      address: addressForm,
      isBuyNow,
    }));

    const checkoutItems = items.map(item => ({
      product_id: item.id,
      product_name: item.name,
      price: item.price,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      image: item.image,
    }));
    await initiatePayment({
      amount: finalTotal,
      customerName: `${addressForm.firstName} ${addressForm.lastName}`,
      customerEmail: user.email,
      customerPhone: addressForm.phone,
      description: `Order of ${items.length} item(s) from MUFFIGOUT APPAREL HUB`,
      checkout: {
        items: checkoutItems,
        subtotal: totalPrice,
        shippingCost,
        total: finalTotal,
        address: addressForm,
        isBuyNow,
      },
    });
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setAddressForm(prev => ({ ...prev, [id]: value }));
    setAddressErrors(prev => ({ ...prev, [id]: '' }));

    // Auto-fetch city & state when pincode is 6 digits
    if (id === 'pincode' && /^\d{6}$/.test(value)) {
      fetchCityStateFromPincode(value).then(result => {
        if (result) {
          setAddressForm(prev => ({ ...prev, city: result.city, state: result.state }));
        }
      });
    }
  };

  const selectSavedAddress = (addr: Address) => {
    setSelectedAddressId(addr.id);
    setAddressForm({
      firstName: addr.fullName.split(' ')[0] || '',
      lastName: addr.fullName.split(' ').slice(1).join(' ') || '',
      phone: addr.phone,
      address: addr.address,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      landmark: addr.landmark || '',
    });
    setShowNewAddressForm(false);
  };

  const handleSaveNewAddress = () => {
    const result = checkoutAddressSchema.safeParse(addressForm);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) newErrors[err.path[0] as string] = err.message;
      });
      setAddressErrors(newErrors);
      return;
    }
    setAddressErrors({});
    const newAddr: Address = {
      id: Date.now().toString(),
      fullName: `${addressForm.firstName} ${addressForm.lastName}`.trim(),
      phone: addressForm.phone,
      address: addressForm.address,
      city: addressForm.city,
      state: addressForm.state,
      pincode: addressForm.pincode,
      landmark: addressForm.landmark || undefined,
      isDefault: savedAddresses.length === 0,
    };
    setSavedAddresses([...savedAddresses, newAddr]);
    setSelectedAddressId(newAddr.id);
    setShowNewAddressForm(false);
    setEditingAddressId(null);
    toast.success('Address saved.');
  };

  const handleEditAddress = (addr: Address) => {
    setEditingAddressId(addr.id);
    setShowNewAddressForm(true);
    setSelectedAddressId(null);
    setAddressForm({
      firstName: addr.fullName.split(' ')[0] || '',
      lastName: addr.fullName.split(' ').slice(1).join(' ') || '',
      phone: addr.phone,
      address: addr.address,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      landmark: addr.landmark || '',
    });
  };

  const handleUpdateAddress = () => {
    const result = checkoutAddressSchema.safeParse(addressForm);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) newErrors[err.path[0] as string] = err.message;
      });
      setAddressErrors(newErrors);
      return;
    }
    setAddressErrors({});
    setSavedAddresses(savedAddresses.map(a => 
      a.id === editingAddressId
        ? {
            ...a,
            fullName: `${addressForm.firstName} ${addressForm.lastName}`.trim(),
            phone: addressForm.phone,
            address: addressForm.address,
            city: addressForm.city,
            state: addressForm.state,
            pincode: addressForm.pincode,
            landmark: addressForm.landmark || undefined,
          }
        : a
    ));
    setSelectedAddressId(editingAddressId);
    setShowNewAddressForm(false);
    setEditingAddressId(null);
    toast.success('Address updated.');
  };

  const stepLabels = ['Address', 'Review', 'Payment'];
  const stepKeys: Array<typeof step> = ['address', 'summary', 'payment'];
  const currentStepIndex = stepKeys.indexOf(step);

  const handleContinue = () => {
    if (step === 'address') {
      if (showNewAddressForm) {
        toast.error('Please save your new address before continuing.');
        return;
      }
      // If user has saved addresses, they must select one
      if (savedAddresses.length > 0 && !selectedAddressId) {
        toast.error('Please select a delivery address.');
        return;
      }
      // If no saved addresses, validate the inline form
      if (savedAddresses.length === 0) {
        const result = checkoutAddressSchema.safeParse(addressForm);
        if (!result.success) {
          const newErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) newErrors[err.path[0] as string] = err.message;
          });
          setAddressErrors(newErrors);
          toast.error('Please fill in all required address fields');
          return;
        }
        setAddressErrors({});
      }
      if (!addressForm.firstName || !addressForm.address) {
        toast.error('Please fill in your delivery address');
        return;
      }
      setStep('summary');
    } else if (step === 'summary') {
      setStep('payment');
    } else if (step === 'payment') {
      handlePlaceOrder();
    }
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
          <h1 className="font-serif text-3xl font-bold mb-4">Your bag is empty</h1>
          <p className="text-muted-foreground mb-8">
            Add items to your bag to continue to checkout.
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
            <h1 className="font-serif text-3xl font-bold mb-4">Sign in to continue</h1>
            <p className="text-muted-foreground mb-8">
              Please sign in to your account to complete your purchase. Your bag will be saved.
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
    <div className="min-h-screen bg-background pb-32 lg:pb-28">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Steps - Updated to match reference */}
        <div className="flex items-center justify-center mb-8">
          {stepLabels.map((label, index) => (
            <div key={label} className="flex items-center">
              <button
                onClick={() => {
                  // Only allow navigating to completed steps or current step
                  if (index <= currentStepIndex) setStep(stepKeys[index]);
                }}
                disabled={index > currentStepIndex}
                className={`flex flex-col items-center gap-1 ${index > currentStepIndex ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm transition-colors ${
                  index < currentStepIndex
                    ? 'bg-success text-success-foreground'
                    : index === currentStepIndex
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground'
                }`}>
                  {index < currentStepIndex ? <Check size={16} /> : index + 1}
                </div>
                <span className={`text-xs font-medium ${
                  index === currentStepIndex ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {label}
                </span>
              </button>
              {index < 2 && (
                <div className={`w-12 sm:w-20 h-0.5 mx-2 ${
                  index < currentStepIndex ? 'bg-success' : 'bg-border'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Flash Sale Expired Banner */}
        {flashSaleExpired && (
          <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg animate-fade-in">
            <Zap size={20} className="text-destructive shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">⚡ Flash Sale has ended</p>
              <p className="text-xs text-muted-foreground">Pricing has been reset to standard. Please review your order total before proceeding.</p>
            </div>
            <button onClick={() => setFlashSaleExpired(false)} className="ml-auto shrink-0 text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-4">

            {/* Delivery Address Bar (visible on summary/payment) */}
            {(step === 'summary' || step === 'payment') && addressForm.firstName && (
              <div className="bg-card p-4 rounded-lg border border-border">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-primary mt-0.5 shrink-0" />
                    <div>
                      <h3 className="font-semibold text-sm">Delivery Address</h3>
                      <p className="text-sm font-medium mt-1">
                        {addressForm.firstName} {addressForm.lastName}
                        <span className="text-muted-foreground"> • {addressForm.phone}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {addressForm.address}{addressForm.landmark ? `, ${addressForm.landmark}` : ''}, {addressForm.city}, {addressForm.state}, {addressForm.pincode}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setStep('address')}>
                    Change
                  </Button>
                </div>
              </div>
            )}

            {step === 'address' && (
              <div className="bg-card p-6 rounded-lg border border-border">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <MapPin size={20} />
                  Delivery Address
                </h2>

                {/* Saved Addresses List */}
                {savedAddresses.length > 0 && !showNewAddressForm && (
                  <div className="space-y-3 mb-4">
                    <p className="text-sm text-muted-foreground">Choose a saved address for delivery:</p>
                    {savedAddresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`relative rounded-xl border-2 transition-all ${
                          selectedAddressId === addr.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-muted-foreground/40'
                        }`}
                      >
                        <button
                          onClick={() => selectSavedAddress(addr)}
                          className="w-full text-left p-4"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              selectedAddressId === addr.id ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                            }`}>
                              {selectedAddressId === addr.id && <Check size={12} className="text-primary-foreground" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-semibold text-sm">{addr.fullName}</span>
                                {addr.isDefault && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-primary/10 text-primary rounded">Default</span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{addr.phone}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {addr.address}{addr.landmark ? `, ${addr.landmark}` : ''}, {addr.city}, {addr.state} - {addr.pincode}
                              </p>
                            </div>
                          </div>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditAddress(addr); }}
                          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors"
                          title="Edit address"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    ))}

                    <button
                      onClick={() => {
                        setShowNewAddressForm(true);
                        setEditingAddressId(null);
                        setSelectedAddressId(null);
                        setAddressForm({ firstName: '', lastName: '', phone: '', address: '', city: '', state: '', pincode: '', landmark: '' });
                      }}
                      className="w-full flex items-center gap-2 p-3 rounded-xl border-2 border-dashed border-border hover:border-primary/50 text-sm font-medium text-primary transition-colors"
                    >
                      <Plus size={16} />
                      Add New Address
                    </button>
                  </div>
                )}

                {/* New Address Form (shown when no saved addresses or user clicks Add New) */}
                {(savedAddresses.length === 0 || showNewAddressForm) && (
                  <div className="space-y-4">
                    {showNewAddressForm && (
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">{editingAddressId ? 'Edit Address' : 'Add New Address'}</p>
                        {savedAddresses.length > 0 && (
                          <Button variant="ghost" size="sm" onClick={() => {
                            setShowNewAddressForm(false);
                            setEditingAddressId(null);
                            const defaultAddr = savedAddresses.find(a => a.isDefault) || savedAddresses[0];
                            if (defaultAddr) selectSavedAddress(defaultAddr);
                          }}>
                            Cancel
                          </Button>
                        )}
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={locatingUser}
                      onClick={async () => {
                        setLocatingUser(true);
                        try {
                          const loc = await detectCurrentLocation();
                          setAddressForm(prev => ({
                            ...prev,
                            address: loc.address || prev.address,
                            city: loc.city || prev.city,
                            state: loc.state || prev.state,
                            pincode: loc.pincode || prev.pincode,
                          }));
                          setAddressErrors({});
                          toast.success('Location detected — please verify and fill remaining details.');
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : 'Could not detect your location.');
                        } finally {
                          setLocatingUser(false);
                        }
                      }}
                      className="w-full sm:w-auto gap-2"
                    >
                      {locatingUser ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <LocateFixed className="h-4 w-4" />
                      )}
                      {locatingUser ? 'Detecting…' : 'Detect Current Location'}
                    </Button>
                    <form className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input id="firstName" placeholder="First Name" value={addressForm.firstName} onChange={handleAddressChange} className={addressErrors.firstName ? 'border-destructive' : ''} />
                          {addressErrors.firstName && <p className="text-xs text-destructive">{addressErrors.firstName}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input id="lastName" placeholder="Last Name" value={addressForm.lastName} onChange={handleAddressChange} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" type="tel" placeholder="Phone Number" value={addressForm.phone} onChange={handleAddressChange} className={addressErrors.phone ? 'border-destructive' : ''} />
                        {addressErrors.phone && <p className="text-xs text-destructive">{addressErrors.phone}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input id="address" placeholder="Street Address" value={addressForm.address} onChange={handleAddressChange} className={addressErrors.address ? 'border-destructive' : ''} />
                        {addressErrors.address && <p className="text-xs text-destructive">{addressErrors.address}</p>}
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="pincode">PIN Code</Label>
                          <Input id="pincode" placeholder="PIN Code" value={addressForm.pincode} onChange={handleAddressChange} className={addressErrors.pincode ? 'border-destructive' : ''} maxLength={6} />
                          {addressErrors.pincode && <p className="text-xs text-destructive">{addressErrors.pincode}</p>}
                        </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input id="city" placeholder="City" value={addressForm.city} onChange={handleAddressChange} className={addressErrors.city ? 'border-destructive' : ''} />
                          {addressErrors.city && <p className="text-xs text-destructive">{addressErrors.city}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">State</Label>
                          <Select value={addressForm.state} onValueChange={(val) => { setAddressForm(prev => ({ ...prev, state: val })); setAddressErrors(prev => ({ ...prev, state: '' })); }}>
                            <SelectTrigger className={addressErrors.state ? 'border-destructive' : ''}>
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            <SelectContent>
                              {INDIAN_STATES.map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {addressErrors.state && <p className="text-xs text-destructive">{addressErrors.state}</p>}
                        </div>
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="landmark">Landmark (Optional)</Label>
                          <Input id="landmark" placeholder="Landmark" value={addressForm.landmark} onChange={handleAddressChange} />
                        </div>

                    </form>
                    {(savedAddresses.length === 0 || showNewAddressForm) && showNewAddressForm && (
                      <Button onClick={editingAddressId ? handleUpdateAddress : handleSaveNewAddress} className="w-full" size="lg">
                        {editingAddressId ? 'Update Address' : 'Save Address & Continue'}
                      </Button>
                    )}
                    {savedAddresses.length === 0 && (
                      <Button onClick={handleContinue} className="w-full" size="lg">
                        Continue to Review
                      </Button>
                    )}
                  </div>
                )}

                {/* Continue button for saved address selection */}
                {savedAddresses.length > 0 && !showNewAddressForm && selectedAddressId && (
                  <Button onClick={handleContinue} className="w-full" size="lg">
                    Deliver to this Address
                  </Button>
                )}
              </div>
            )}

            {/* Cart Items with enhanced cards */}
            {(step === 'address' || step === 'summary') && (
              <div className="space-y-3">
                {/* Wishlist shortcut */}
                <Link
                  to="/wishlist"
                  className="flex items-center justify-between bg-accent/50 border border-border rounded-lg px-4 py-3 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Heart size={16} className="text-destructive" />
                    <span>View your Wishlist</span>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </Link>
                {items.map((item) => {
                  const hasDiscount = item.originalPrice && item.originalPrice > item.price;
                  const discountPercent = hasDiscount ? Math.round(((item.originalPrice! - item.price) / item.originalPrice!) * 100) : 0;
                  return (
                    <div key={`${item.id}-${item.size}-${item.color}`} className="bg-card rounded-lg border border-border overflow-hidden">
                      <div className="p-4 flex gap-4">
                        <div className="relative">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-24 h-28 object-cover rounded"
                          />
                          {hasDiscount && (
                            <span className="absolute top-1 left-1 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">
                              SALE ⚡
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2">{item.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-bold">{formatPrice(item.price)}</span>
                            {hasDiscount && (
                              <>
                                <span className="text-muted-foreground line-through text-xs">{formatPrice(item.originalPrice!)}</span>
                                <span className="text-success text-xs font-semibold">{discountPercent}% Off</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs border border-border rounded px-2 py-1">Size: {item.size}</span>
                            <span className="text-xs border border-border rounded px-2 py-1">Qty: {item.quantity}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <Truck size={12} />
                            <span>Estimated Delivery by {getEstimatedDeliveryDate(deliveryInfo?.estimatedDays)}</span>
                          </div>
                        </div>
                      </div>
                      {/* Action buttons */}
                      {!isBuyNow && (
                        <div className="flex border-t border-border divide-x divide-border">
                          <button
                            onClick={() => handleMoveToWishlist(item)}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                          >
                            <Heart size={14} />
                            Move to Wishlist
                          </button>
                          <button
                            onClick={() => handleRemoveItem(item)}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                          >
                            <X size={14} />
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Mobile Coupon Section - visible on mobile only */}
            {step === 'summary' && (
              <div className="lg:hidden bg-card p-4 rounded-lg border border-border space-y-3">
                {allFlashSaleItems ? (
                  <>
                  <div className="flex items-center gap-2 p-3 bg-accent/10 rounded-lg border border-accent/30">
                    <Zap size={16} className="text-accent" />
                     <span className="text-sm font-medium text-foreground">⚡ Flash Sale discount applied — coupons not available</span>
                  </div>
                  {availableCoupons.length > 0 && (
                    <div className="space-y-2 pt-2 opacity-60">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Available Offers</p>
                      {availableCoupons.map((coupon) => (
                        <div key={coupon.id} className="border border-border rounded-lg overflow-hidden">
                          <div className="flex">
                            <div className="w-14 bg-primary/10 flex items-center justify-center shrink-0">
                              <span className="text-[10px] font-bold text-primary -rotate-90 whitespace-nowrap">
                                {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `₹${coupon.discount_value} OFF`}
                              </span>
                            </div>
                            <div className="flex-1 p-3">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-sm">{coupon.code}</span>
                                <span className="text-xs font-semibold text-muted-foreground cursor-not-allowed">APPLY</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {coupon.discount_type === 'percentage'
                                  ? `Flat ${coupon.discount_value}% off on orders above ₹${coupon.min_order_value || 0}`
                                  : `Flat ₹${coupon.discount_value} off on orders above ₹${coupon.min_order_value || 0}`}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  </>
                ) : appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg border border-success/30">
                    <div className="flex items-center gap-2">
                      <Tag size={16} className="text-success" />
                      <span className="text-sm font-semibold text-success">{appliedCoupon.code} applied ✓{hasFlashSaleItems ? ' (non-sale items only)' : ''}</span>
                    </div>
                    <button onClick={removeCoupon} className="text-xs text-destructive hover:underline">Remove</button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <Tag size={18} className="text-primary" />
                      <h3 className="font-semibold text-sm">Coupons & Offers</h3>
                    </div>
                    <div className="flex gap-2 items-stretch">
                      <Input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Enter Coupon Code"
                        className="flex-1 text-sm uppercase bg-background border-2 border-primary/40 focus-visible:border-primary placeholder:text-muted-foreground"
                      />
                      <Button
                        size="default"
                        onClick={() => handleApplyCoupon()}
                        disabled={couponLoading}
                        className="shrink-0 h-12 px-5"
                      >
                        {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'APPLY'}
                      </Button>
                    </div>

                    {availableCoupons.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Available Offers</p>
                        {availableCoupons.map((coupon) => {
                          const amountNeeded = getAmountNeeded(coupon);
                          const isEligible = amountNeeded === 0;
                          return (
                            <div key={coupon.id} className="border border-border rounded-lg overflow-hidden">
                              <div className="flex">
                                <div className="w-14 bg-primary/10 flex items-center justify-center shrink-0">
                                  <span className="text-[10px] font-bold text-primary -rotate-90 whitespace-nowrap">
                                    {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `₹${coupon.discount_value} OFF`}
                                  </span>
                                </div>
                                <div className="flex-1 p-3">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-sm">{coupon.code}</span>
                                    <button
                                      onClick={() => isEligible ? handleApplyCoupon(coupon.code) : null}
                                      disabled={!isEligible || couponLoading}
                                      className={`text-xs font-semibold px-3 py-1 rounded ${isEligible ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
                                    >
                                      APPLY
                                    </button>
                                  </div>
                                  {!isEligible && (
                                    <p className="text-xs text-primary mt-1">Add ₹{amountNeeded} more to avail</p>
                                  )}
                                  {isEligible && (
                                    <p className="text-xs text-success mt-1 font-medium">You save ₹{getCouponSavings(coupon)}!</p>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {coupon.discount_type === 'percentage'
                                      ? `Flat ${coupon.discount_value}% off on orders above ₹${coupon.min_order_value || 0}`
                                      : `Flat ₹${coupon.discount_value} off on orders above ₹${coupon.min_order_value || 0}`}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {step === 'payment' && (
              <div className="bg-card p-6 rounded-lg border border-border">
                <h2 className="font-semibold text-lg mb-6 flex items-center gap-2">
                  <CreditCard size={20} />
                  Payment Method
                </h2>

                <div className="space-y-3">
                  {/* Online (PayU) */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('online')}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === 'online'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        paymentMethod === 'online' ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                      }`}>
                        {paymentMethod === 'online' && <Check size={12} className="text-primary-foreground" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CreditCard size={16} className="text-primary" />
                          <span className="font-semibold text-sm">Pay Online (UPI / Cards / Net Banking)</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Secure payment via PayU. UPI, Credit/Debit Cards, Net Banking and Wallets supported.
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Cash on Delivery */}
                  <button
                    type="button"
                    disabled={!codEligibility.eligible}
                    onClick={() => codEligibility.eligible && setPaymentMethod('cod')}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      !codEligibility.eligible
                        ? 'border-border bg-muted/30 opacity-60 cursor-not-allowed'
                        : paymentMethod === 'cod'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        paymentMethod === 'cod' && codEligibility.eligible
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground/40'
                      }`}>
                        {paymentMethod === 'cod' && codEligibility.eligible && (
                          <Check size={12} className="text-primary-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Banknote size={16} className="text-primary" />
                          <span className="font-semibold text-sm">Cash on Delivery</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-accent/15 text-accent rounded">
                            +{formatPrice(COD_FEE)} fee
                          </span>
                        </div>
                        {codEligibility.eligible ? (
                          <p className="text-xs text-muted-foreground mt-1">
                            Pay in cash when your order arrives. A {formatPrice(COD_FEE)} handling fee applies.
                          </p>
                        ) : (
                          <p className="text-xs text-destructive mt-1">{codEligibility.reason}</p>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Price Details Section - only on summary/review step */}
            {step === 'summary' && (
              <div className="bg-card p-4 rounded-lg border border-border">
                <h3 className="font-semibold text-sm mb-3">Price Details ({items.length} Item{items.length > 1 ? 's' : ''})</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Product Price</span>
                    <span>+ {formatPrice(totalOriginalPrice)}</span>
                  </div>
                  {totalProductDiscount > 0 && (
                    <div className="flex justify-between text-success">
                      <span className="flex items-center gap-1">
                        {hasFlashSaleItems && <Zap size={14} className="text-accent" />}
                        {hasFlashSaleItems ? 'Flash Sale Discount' : 'Product Discount'}
                      </span>
                      <span>- {formatPrice(totalProductDiscount)}</span>
                    </div>
                  )}
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-success">
                      <span>Coupon ({appliedCoupon?.code}){hasFlashSaleItems ? ' — non-sale items' : ''}</span>
                      <span>- {formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className={shippingCost === 0 ? 'text-success' : ''}>
                      {shippingCost === 0 ? 'FREE' : `+ ${formatPrice(shippingCost)}`}
                    </span>
                  </div>
                  {codFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">COD Handling Fee</span>
                      <span>+ {formatPrice(codFee)}</span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-base">
                    <span>Order Total</span>
                    <span>{formatPrice(finalTotal)}</span>
                  </div>
                </div>
                {totalSavings > 0 && (
                  <div className="mt-3 p-3 bg-success/10 rounded-lg flex items-center gap-2 text-sm font-medium text-success">
                    {hasFlashSaleItems ? <Zap size={16} /> : <Tag size={16} />}
                    Yay! You're saving {formatPrice(totalSavings)}{hasFlashSaleItems ? ' with Flash Sale' : ''}{discountAmount > 0 ? ' + coupon' : ''}!
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Order Summary Sidebar - Review step only */}
          {step === 'summary' && (
            <div className="lg:col-span-1 hidden lg:block">
              <div className="bg-card p-6 rounded-lg border border-border sticky top-28">
                {/* Savings Corner (top) */}
                <div className="space-y-3">
                  {allFlashSaleItems ? (
                    <>
                    <div className="flex items-center gap-2 p-3 bg-accent/10 rounded-lg border border-accent/30">
                      <Zap size={16} className="text-accent" />
                      <span className="text-sm font-medium text-foreground">⚡ Flash Sale discount applied — coupons not available</span>
                    </div>
                    {availableCoupons.length > 0 && (
                      <div className="space-y-2 opacity-60">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Available Offers</p>
                        {availableCoupons.map((coupon) => (
                          <div key={coupon.id} className="border border-border rounded-lg overflow-hidden">
                            <div className="flex">
                              <div className="w-16 bg-muted flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-bold text-muted-foreground -rotate-90 whitespace-nowrap">
                                  {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `₹${coupon.discount_value} OFF`}
                                </span>
                              </div>
                              <div className="flex-1 p-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-sm">{coupon.code}</span>
                                  <span className="text-xs font-semibold text-muted-foreground cursor-not-allowed">APPLY</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {coupon.discount_type === 'percentage'
                                    ? `Flat ${coupon.discount_value}% off on orders above ₹${coupon.min_order_value || 0}`
                                    : `Flat ₹${coupon.discount_value} off on orders above ₹${coupon.min_order_value || 0}`}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    </>
                  ) : appliedCoupon ? (
                    <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg border border-success/30">
                      <div className="flex items-center gap-2">
                        <Tag size={16} className="text-success" />
                        <span className="text-sm font-semibold text-success">{appliedCoupon.code} applied ✓{hasFlashSaleItems ? ' (non-sale items only)' : ''}</span>
                      </div>
                      <button onClick={removeCoupon} className="text-xs text-destructive hover:underline">Remove</button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => setSavingsOpen(!savingsOpen)}
                        className="w-full flex items-center justify-between p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Tag size={16} className="text-primary" />
                          <span className="text-sm font-medium">Apply Coupon</span>
                        </div>
                        <ChevronDown size={16} className={`text-muted-foreground transition-transform ${savingsOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {savingsOpen && (
                        <div className="space-y-3 animate-fade-in">
                          <div className="flex gap-2 items-stretch">
                            <Input
                              value={couponCode}
                              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                              placeholder="Enter Coupon Code"
                              className="flex-1 text-sm uppercase bg-background border-2 border-primary/40 focus-visible:border-primary placeholder:text-muted-foreground"
                            />
                            <Button
                              size="default"
                              onClick={() => handleApplyCoupon()}
                              disabled={couponLoading}
                              className="shrink-0 h-12 px-5"
                            >
                              {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'APPLY'}
                            </Button>
                          </div>

                          {availableCoupons.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Available Offers</p>
                              {availableCoupons.map((coupon) => {
                                const amountNeeded = getAmountNeeded(coupon);
                                const isEligible = amountNeeded === 0;
                                return (
                                  <div key={coupon.id} className="border border-border rounded-lg overflow-hidden">
                                    <div className="flex">
                                      <div className="w-16 bg-muted flex items-center justify-center shrink-0">
                                        <span className="text-[10px] font-bold text-muted-foreground -rotate-90 whitespace-nowrap">
                                          {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `₹${coupon.discount_value} OFF`}
                                        </span>
                                      </div>
                                      <div className="flex-1 p-3">
                                        <div className="flex items-center justify-between">
                                          <span className="font-bold text-sm">{coupon.code}</span>
                                          <button
                                            onClick={() => isEligible ? handleApplyCoupon(coupon.code) : null}
                                            disabled={!isEligible || couponLoading}
                                            className={`text-xs font-semibold ${isEligible ? 'text-primary hover:underline cursor-pointer' : 'text-muted-foreground cursor-not-allowed'}`}
                                          >
                                            APPLY
                                          </button>
                                        </div>
                                        {!isEligible && (
                                          <p className="text-xs text-primary mt-1">Add ₹{amountNeeded} more to avail this offer</p>
                                        )}
                                        {isEligible && (
                                          <p className="text-xs text-success mt-1">You save ₹{getCouponSavings(coupon)}!</p>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {coupon.discount_type === 'percentage'
                                            ? `Get FLAT ${coupon.discount_value}% off on orders above ₹${coupon.min_order_value || 0}`
                                            : `Use code ${coupon.code} & get Flat ₹${coupon.discount_value} off on orders above ₹${coupon.min_order_value || 0}`}
                                        </p>
                                        {expandedCoupon === coupon.id && (
                                          <div className="mt-2 pt-2 border-t border-dashed border-border text-xs text-muted-foreground space-y-1">
                                            <p>• Only one coupon can be applied per order</p>
                                            {coupon.min_order_value > 0 && <p>• Minimum order value: ₹{coupon.min_order_value}</p>}
                                            {coupon.expires_at && <p>• Valid till: {new Date(coupon.expires_at).toLocaleDateString()}</p>}
                                          </div>
                                        )}
                                        <button
                                          onClick={() => setExpandedCoupon(expandedCoupon === coupon.id ? null : coupon.id)}
                                          className="text-xs font-semibold text-foreground mt-1 hover:underline"
                                        >
                                          {expandedCoupon === coupon.id ? '- LESS' : '+ MORE'}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <Separator className="my-4" />

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
                      <span>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-success">
                      <span className="flex items-center gap-1">
                        Discount ({appliedCoupon.code})
                        <button onClick={removeCoupon} className="text-destructive hover:text-destructive/80">
                          <X size={14} />
                        </button>
                      </span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className={shippingCost === 0 ? 'text-success' : ''}>
                      {shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}
                    </span>
                  </div>
                  {codFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">COD Fee</span>
                      <span>{formatPrice(codFee)}</span>
                    </div>
                  )}
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(finalTotal)}</span>
                </div>

                {shippingCost > 0 && (
                  <p className="text-xs text-muted-foreground mt-4">
                    Add {formatPrice(999 - totalPrice)} more for free shipping
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
          )}
        </div>
      </main>

      {/* Sticky Bottom Bar (mobile & desktop) */}
      {step !== 'address' && (
        <div className="fixed left-0 right-0 bottom-[3.75rem] md:bottom-0 bg-card border-t-2 border-border z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-lg">{formatPrice(finalTotal)}</p>
              <button
                onClick={() => setShowPriceDetails(!showPriceDetails)}
                className="text-xs font-semibold text-primary"
              >
                {showPriceDetails ? 'HIDE DETAILS' : 'VIEW PRICE DETAILS'}
              </button>
            </div>
            {isRateLimited ? (
              <div className="w-full space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 animate-pulse text-primary" />
                  <span>Payment gateway is busy. Retrying in <strong className="text-foreground">{retryCountdown}s</strong> · Attempt {retryAttempt} of 3</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${(retryCountdown / [30, 60, 120][retryAttempt - 1]) * 100}%` }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={retryNow} size="sm" className="flex-1">
                    <Zap className="mr-1 h-3 w-3" /> Retry Now
                  </Button>
                  <Button onClick={cancelRetry} variant="outline" size="sm" className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={handleContinue}
                disabled={isPaymentLoading || isPlacingOrder}
                className="px-8"
                size="lg"
              >
                {isPaymentLoading || isPlacingOrder ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing…
                  </>
                ) : step === 'payment' ? (
                  paymentMethod === 'cod' ? `Place Order · ${formatPrice(finalTotal)}` : `Pay ${formatPrice(finalTotal)}`
                ) : (
                  'Continue'
                )}
              </Button>
            )}
          </div>

          {/* Expandable price details */}
          {showPriceDetails && (
            <div className="mt-3 pt-3 border-t border-border space-y-2 text-sm animate-fade-in">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Product Price</span>
                <span>+ {formatPrice(totalOriginalPrice)}</span>
              </div>
              {totalSavings > 0 && (
                <div className="flex justify-between text-success">
                  <span>Total Discounts</span>
                  <span>- {formatPrice(totalSavings)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className={shippingCost === 0 ? 'text-success' : ''}>
                  {shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}
                </span>
              </div>
              {codFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">COD Fee</span>
                  <span>{formatPrice(codFee)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Order Total</span>
                <span>{formatPrice(finalTotal)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      <Footer />
    </div>
  );
};

export default Checkout;
