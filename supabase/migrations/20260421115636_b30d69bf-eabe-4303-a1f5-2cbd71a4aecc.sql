CREATE TABLE IF NOT EXISTS public.pending_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  txnid TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  user_email TEXT,
  items JSONB NOT NULL,
  subtotal NUMERIC NOT NULL,
  shipping_cost NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL,
  shipping_address JSONB NOT NULL,
  is_buy_now BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  order_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pending_payments_txnid ON public.pending_payments(txnid);
CREATE INDEX IF NOT EXISTS idx_pending_payments_user_id ON public.pending_payments(user_id);

ALTER TABLE public.pending_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No client access to pending_payments"
  ON public.pending_payments FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE TRIGGER update_pending_payments_updated_at
  BEFORE UPDATE ON public.pending_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();