import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { createOrder } from '@/hooks/useOrders';
import { supabase } from '@/integrations/supabase/client';

const PayUCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items: cartItems, totalPrice: cartTotalPrice, clearCart, buyNowItem, setBuyNowItem } = useCart();
  const [processing, setProcessing] = useState(true);
  const status = searchParams.get('status');

  useEffect(() => {
    const handleCallback = async () => {
      const paymentData = sessionStorage.getItem('payu_payment');
      const checkoutData = sessionStorage.getItem('payu_checkout');

      if (status === 'success' && paymentData && checkoutData) {
        try {
          const payment = JSON.parse(paymentData);
          const checkout = JSON.parse(checkoutData);

          if (!user) {
            toast.error('Session expired. Please log in again.');
            navigate('/auth');
            return;
          }

          // Create order with pending payment status
          const order = await createOrder({
            userId: user.id,
            items: checkout.items,
            subtotal: checkout.subtotal,
            shippingCost: checkout.shippingCost,
            total: checkout.total,
            shippingAddress: checkout.address,
            paymentMethod: 'Online Payment (PayU)',
            paymentId: payment.txnid,
          });

          // Verify payment server-side — this updates payment_status to 'paid' if verified
          try {
            const { data: verifyResult, error: verifyError } = await supabase.functions.invoke('verify-payment', {
              body: {
                orderId: order.id,
                txnid: payment.txnid,
              },
            });

            if (verifyError || !verifyResult?.success) {
              console.warn('Payment verification pending:', verifyError || verifyResult?.message);
              toast.warning('Payment is being verified. You will be notified once confirmed.');
            }
          } catch (verifyErr) {
            console.error('Payment verification call failed:', verifyErr);
          }

          // Clean up
          sessionStorage.removeItem('payu_payment');
          sessionStorage.removeItem('payu_checkout');

          if (checkout.isBuyNow) {
            setBuyNowItem(null);
          } else {
            clearCart();
          }

          navigate('/order-confirmation', {
            state: {
              orderId: order.order_number,
              paymentId: payment.txnid,
              items: checkout.items.map((item: any) => ({
                id: item.product_id,
                name: item.product_name,
                price: item.price,
                quantity: item.quantity,
                size: item.size,
                color: item.color,
                image: item.image,
              })),
              total: checkout.total,
              shippingCost: checkout.shippingCost,
              address: checkout.address,
              paymentMethod: 'Online Payment (PayU)',
            },
          });
        } catch (error) {
          console.error('Order creation failed:', error);
          toast.error('Payment was successful but order creation failed. Please contact support.');
          navigate('/');
        }
      } else if (status === 'failure') {
        toast.error('Payment failed. Please try again.');
        sessionStorage.removeItem('payu_payment');
        sessionStorage.removeItem('payu_checkout');
        navigate('/checkout');
      } else if (status === 'cancel') {
        toast.info('Payment was cancelled.');
        sessionStorage.removeItem('payu_payment');
        sessionStorage.removeItem('payu_checkout');
        navigate('/checkout');
      } else {
        navigate('/');
      }

      setProcessing(false);
    };

    handleCallback();
  }, [status, user]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      {processing ? (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-lg font-medium">Processing your payment...</p>
          <p className="text-sm text-muted-foreground">Please wait, do not close this page.</p>
        </>
      ) : status === 'success' ? (
        <>
          <CheckCircle2 className="h-10 w-10 text-green-500" />
          <p className="text-lg font-medium">Redirecting...</p>
        </>
      ) : (
        <>
          <XCircle className="h-10 w-10 text-destructive" />
          <p className="text-lg font-medium">Redirecting...</p>
        </>
      )}
    </div>
  );
};

export default PayUCallback;
