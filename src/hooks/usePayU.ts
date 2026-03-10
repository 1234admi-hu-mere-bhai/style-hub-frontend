import { useState, useCallback } from 'react';
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
}

const PAYU_BASE_URL = 'https://secure.payu.in/_payment'; // Production
// const PAYU_BASE_URL = 'https://sandboxsecure.payu.in/_payment'; // Sandbox/Test

export const usePayU = ({ onSuccess, onError, onDismiss }: UsePayUProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const initiatePayment = useCallback(async (details: PaymentDetails) => {
    setIsLoading(true);

    try {
      const txnid = `TXN${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      const amount = details.amount.toFixed(2);
      const productinfo = details.description || 'Order Payment';
      const firstname = details.customerName?.split(' ')[0] || 'Customer';
      const email = details.customerEmail || 'customer@example.com';
      const phone = details.customerPhone || '';

      // Get hash from edge function
      const { data: hashData, error: hashError } = await supabase.functions.invoke('payu-hash', {
        body: { txnid, amount, productinfo, firstname, email, phone },
      });

      if (hashError || !hashData?.hash) {
        throw new Error('Failed to generate payment hash. Please try again.');
      }

      // Build the success/failure URLs
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const surl = `${window.location.origin}/payu-callback?status=success`;
      const furl = `${window.location.origin}/payu-callback?status=failure`;
      const curl = `${window.location.origin}/payu-callback?status=cancel`;

      // Store payment details in sessionStorage for callback handling
      sessionStorage.setItem('payu_payment', JSON.stringify({
        txnid,
        amount: details.amount,
        description: productinfo,
      }));

      // Create a form and submit to PayU
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = PAYU_BASE_URL;

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

      Object.entries(params).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
      // Page will redirect to PayU — loading state stays true
    } catch (error) {
      setIsLoading(false);
      const err = error instanceof Error ? error : new Error('Payment initialization failed');
      if (onError) {
        onError(err);
      } else {
        toast.error(err.message);
      }
    }
  }, [onSuccess, onError, onDismiss]);

  return {
    initiatePayment,
    isLoading,
  };
};

export type { PaymentDetails };
