import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface RazorpayOptions {
  key: string;
  amount: number; // in paise (1 INR = 100 paise)
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id?: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

interface RazorpayInstance {
  open: () => void;
  close: () => void;
  on: (event: string, callback: () => void) => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface UseRazorpayProps {
  onSuccess: (response: RazorpayResponse) => void;
  onError?: (error: Error) => void;
  onDismiss?: () => void;
}

interface PaymentDetails {
  amount: number; // in INR
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  description?: string;
  orderId?: string;
}

export const useRazorpay = ({ onSuccess, onError, onDismiss }: UseRazorpayProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // Load Razorpay script
  const loadScript = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (isScriptLoaded || window.Razorpay) {
        setIsScriptLoaded(true);
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      
      script.onload = () => {
        setIsScriptLoaded(true);
        resolve(true);
      };
      
      script.onerror = () => {
        resolve(false);
      };
      
      document.body.appendChild(script);
    });
  }, [isScriptLoaded]);

  // Initialize payment
  const initiatePayment = useCallback(async (details: PaymentDetails, razorpayKey?: string) => {
    setIsLoading(true);

    try {
      // Load Razorpay script if not already loaded
      const scriptLoaded = await loadScript();
      
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay SDK. Please check your internet connection.');
      }

      // Use provided key or fallback to demo mode
      const key = razorpayKey || 'rzp_test_DEMO_KEY';
      
      if (!razorpayKey) {
        // Demo mode - simulate payment
        toast.info('Demo Mode: Razorpay key not configured', {
          description: 'Simulating payment flow...',
        });
        
        // Simulate payment processing
        await new Promise((resolve) => setTimeout(resolve, 2000));
        
        // Simulate success
        const demoResponse: RazorpayResponse = {
          razorpay_payment_id: `pay_demo_${Date.now()}`,
          razorpay_order_id: details.orderId || `order_demo_${Date.now()}`,
          razorpay_signature: 'demo_signature',
        };
        
        onSuccess(demoResponse);
        setIsLoading(false);
        return;
      }

      // Real Razorpay integration
      const options: RazorpayOptions = {
        key,
        amount: details.amount * 100, // Convert to paise
        currency: 'INR',
        name: 'MUFFI GOUT APPAREL HUB',
        description: details.description || 'Order Payment',
        handler: (response) => {
          setIsLoading(false);
          onSuccess(response);
        },
        prefill: {
          name: details.customerName,
          email: details.customerEmail,
          contact: details.customerPhone,
        },
        notes: {
          order_id: details.orderId || '',
        },
        theme: {
          color: '#C65D3B', // Primary terracotta color
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
            if (onDismiss) {
              onDismiss();
            }
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      setIsLoading(false);
      const err = error instanceof Error ? error : new Error('Payment initialization failed');
      
      if (onError) {
        onError(err);
      } else {
        toast.error(err.message);
      }
    }
  }, [loadScript, onSuccess, onError, onDismiss]);

  return {
    initiatePayment,
    isLoading,
    isScriptLoaded,
  };
};

export type { RazorpayResponse, PaymentDetails };
