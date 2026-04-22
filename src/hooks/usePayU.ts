import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface PayUResponse {
  txnid: string;
  mihpayid: string;
  status: string;
  amount: string;
  productinfo: string;
}

interface UsePayUProps {
  onSuccess: (response: PayUResponse) => void;
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
  // Payment-method hint forwarded to PayU so its hosted page pre-selects
  // the user's chosen option (UPI app / card / netbanking / wallet).
  // pg: 'UPI' | 'CC' | 'DC' | 'NB' | 'CASH' | 'WALLET'
  // bankcode: e.g. 'TEZ' (GPay), 'PHONEPE', 'PAYTM', 'AMAZONPAY', 'BHIM',
  //           'UPI' (generic), 'PAYTMW', 'MOBIKWIK', etc.
  pg?: string;
  bankcode?: string;
  // Server-side persisted checkout payload (so order can be created via webhook
  // even if the browser session is lost during the PayU redirect).
  checkout?: {
    items: Array<{
      product_id: string;
      product_name: string;
      price: number;
      quantity: number;
      size?: string;
      color?: string;
      image?: string;
    }>;
    subtotal: number;
    shippingCost: number;
    total: number;
    address: Record<string, any>;
    isBuyNow?: boolean;
  };
}

const PAYU_BASE_URL = 'https://secure.payu.in/_payment'; // Production
// const PAYU_BASE_URL = 'https://sandboxsecure.payu.in/_payment'; // Sandbox/Test

const MAX_RETRIES = 3;
const RETRY_DELAYS = [30, 60, 120]; // seconds for each retry

export const usePayU = ({ onSuccess, onError, onDismiss }: UsePayUProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const pendingDetailsRef = useRef<PaymentDetails | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown timer
  useEffect(() => {
    if (retryCountdown <= 0) {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      return;
    }

    countdownRef.current = setInterval(() => {
      setRetryCountdown(prev => {
        if (prev <= 1) {
          setIsRateLimited(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [retryCountdown > 0]);

  const clearRetryState = useCallback(() => {
    setIsRateLimited(false);
    setRetryCountdown(0);
    setRetryAttempt(0);
    pendingDetailsRef.current = null;
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const submitToPayU = useCallback((params: Record<string, string>) => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = PAYU_BASE_URL;

    Object.entries(params).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  }, []);

  const initiatePayment = useCallback(async (details: PaymentDetails) => {
    setIsLoading(true);
    pendingDetailsRef.current = details;

    try {
      const txnid = `TXN${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      const amount = details.amount.toFixed(2);
      const productinfo = details.description || 'Order Payment';
      const firstname = details.customerName?.split(' ')[0] || 'Customer';
      const email = details.customerEmail || 'customer@example.com';
      const phone = details.customerPhone || '';

      // Get hash from edge function (also persists pending_payment server-side)
      const { data: hashData, error: hashError } = await supabase.functions.invoke('payu-hash', {
        body: { txnid, amount, productinfo, firstname, email, phone, checkout: details.checkout },
      });

      if (hashError || !hashData?.hash) {
        throw new Error('Failed to generate payment hash. Please try again.');
      }

      // Route surl/furl/curl through the server-side webhook so the order is
      // created even if the browser session is lost. The webhook then
      // 303-redirects back to /payu-callback with status & txnid params.
      const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
      const webhookBase = `${supabaseUrl}/functions/v1/payu-webhook`;
      const surl = `${webhookBase}?status=success`;
      const furl = `${webhookBase}?status=failure`;
      const curl = `${webhookBase}?status=cancel`;

      // Store payment details in sessionStorage for callback handling
      sessionStorage.setItem('payu_payment', JSON.stringify({
        txnid,
        amount: details.amount,
        description: productinfo,
      }));

      const params: Record<string, string> = {
        key: hashData.key,
        txnid,
        amount,
        productinfo,
        firstname,
        email,
        phone,
        surl,
        furl,
        curl,
        hash: hashData.hash,
      };

      clearRetryState();
      submitToPayU(params);
      // Page will redirect to PayU — loading state stays true
    } catch (error) {
      setIsLoading(false);
      const err = error instanceof Error ? error : new Error('Payment initialization failed');
      
      // Check if it's a rate limit scenario (detect from error message or response)
      const isRateLimit = err.message.toLowerCase().includes('too many') || 
                          err.message.toLowerCase().includes('rate limit') ||
                          err.message.includes('429');

      if (isRateLimit && retryAttempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS[retryAttempt] || 120;
        setIsRateLimited(true);
        setRetryCountdown(delay);
        setRetryAttempt(prev => prev + 1);
        toast.error(`PayU is temporarily busy. Auto-retrying in ${delay} seconds...`, {
          description: `Attempt ${retryAttempt + 1} of ${MAX_RETRIES}`,
          duration: 5000,
        });
      } else if (isRateLimit) {
        clearRetryState();
        const finalErr = new Error('PayU is experiencing high traffic. Please try again in a few minutes.');
        if (onError) {
          onError(finalErr);
        } else {
          toast.error(finalErr.message);
        }
      } else {
        clearRetryState();
        if (onError) {
          onError(err);
        } else {
          toast.error(err.message);
        }
      }
    }
  }, [onSuccess, onError, onDismiss, retryAttempt, clearRetryState, submitToPayU]);

  // Auto-retry when countdown reaches 0 and we have pending details
  useEffect(() => {
    if (retryCountdown === 0 && isRateLimited === false && retryAttempt > 0 && pendingDetailsRef.current) {
      initiatePayment(pendingDetailsRef.current);
    }
  }, [retryCountdown, isRateLimited, retryAttempt]);

  const retryNow = useCallback(() => {
    if (pendingDetailsRef.current) {
      setRetryCountdown(0);
      setIsRateLimited(false);
      initiatePayment(pendingDetailsRef.current);
    }
  }, [initiatePayment]);

  const cancelRetry = useCallback(() => {
    clearRetryState();
    setIsLoading(false);
    toast.info('Payment retry cancelled');
  }, [clearRetryState]);

  return {
    initiatePayment,
    isLoading,
    isRateLimited,
    retryCountdown,
    retryAttempt,
    retryNow,
    cancelRetry,
  };
};

export type { PaymentDetails };
