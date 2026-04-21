import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';

const PayUCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { clearCart, setBuyNowItem } = useCart();
  const [processing, setProcessing] = useState(true);
  const [statusText, setStatusText] = useState('Processing your payment...');
  const status = searchParams.get('status');
  const txnid = searchParams.get('txnid');

  useEffect(() => {
    if (authLoading) return;

    const handleCallback = async () => {
      if (status === 'failure') {
        toast.error('Payment failed. Please try again.');
        sessionStorage.removeItem('payu_payment');
        sessionStorage.removeItem('payu_checkout');
        navigate('/checkout');
        return;
      }
      if (status === 'cancel') {
        toast.info('Payment was cancelled.');
        sessionStorage.removeItem('payu_payment');
        sessionStorage.removeItem('payu_checkout');
        navigate('/checkout');
        return;
      }
      if (status !== 'success') {
        navigate('/');
        return;
      }

      // Recover txnid from sessionStorage if not in URL (legacy redirect)
      let activeTxnid = txnid;
      if (!activeTxnid) {
        const paymentData = sessionStorage.getItem('payu_payment');
        if (paymentData) {
          try { activeTxnid = JSON.parse(paymentData).txnid; } catch { /* ignore */ }
        }
      }

      // Read isBuyNow before clearing
      let isBuyNow = false;
      try {
        const checkoutData = sessionStorage.getItem('payu_checkout');
        if (checkoutData) isBuyNow = !!JSON.parse(checkoutData).isBuyNow;
      } catch { /* ignore */ }

      if (!user) {
        // Session lost — order is being created server-side via webhook.
        // Just inform the user and redirect to orders page.
        toast.success('Payment received! Please log in to view your order.');
        navigate('/auth?redirect=/orders');
        return;
      }

      if (!activeTxnid) {
        toast.warning('Payment received, but we could not match it to your session. Please check your orders shortly.');
        navigate('/orders');
        return;
      }

      // Poll for the order to appear (webhook creates it server-side)
      setStatusText('Confirming your order...');
      const maxAttempts = 15;
      const interval = 2000;
      let foundOrder: any = null;

      for (let i = 0; i < maxAttempts; i++) {
        const { data } = await supabase
          .from('orders')
          .select('id, order_number, total, shipping_cost, payment_method, shipping_address, payment_id')
          .eq('user_id', user.id)
          .or(`payment_id.eq.${activeTxnid},payment_id.like.${activeTxnid}%`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) {
          // Also fetch items
          const { data: items } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', data.id);
          foundOrder = { ...data, items: items || [] };
          break;
        }
        await new Promise(r => setTimeout(r, interval));
      }

      // Clean up
      sessionStorage.removeItem('payu_payment');
      sessionStorage.removeItem('payu_checkout');
      if (isBuyNow) setBuyNowItem(null);
      else clearCart();

      if (foundOrder) {
        const addr = foundOrder.shipping_address as any;
        navigate('/order-confirmation', {
          state: {
            orderId: foundOrder.order_number,
            paymentId: foundOrder.payment_id,
            items: foundOrder.items.map((it: any) => ({
              id: it.product_id,
              name: it.product_name,
              price: Number(it.price),
              quantity: it.quantity,
              size: it.size,
              color: it.color,
              image: it.image,
            })),
            total: Number(foundOrder.total),
            shippingCost: Number(foundOrder.shipping_cost),
            address: addr,
            paymentMethod: foundOrder.payment_method,
          },
        });
      } else {
        toast.warning('Payment received. Your order is being processed and will appear in your account shortly.');
        navigate('/orders');
      }
      setProcessing(false);
    };

    handleCallback();
  }, [status, txnid, user, authLoading]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4 text-center">
      {processing ? (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-lg font-medium">{statusText}</p>
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
