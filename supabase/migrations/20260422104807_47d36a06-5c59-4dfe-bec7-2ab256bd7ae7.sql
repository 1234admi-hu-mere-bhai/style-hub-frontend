-- Add COD and refund method fields to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cod_fee numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refund_method text;

-- Returns table
CREATE TABLE IF NOT EXISTS public.returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reason_code text NOT NULL,
  reason_details text DEFAULT '',
  images text[] DEFAULT '{}',
  refund_method text NOT NULL DEFAULT 'source',
  refund_amount numeric NOT NULL DEFAULT 0,
  auto_approved boolean NOT NULL DEFAULT false,
  manual_review_reason text,
  picked_up_at timestamp with time zone,
  refunded_at timestamp with time zone,
  payu_refund_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_returns_user_id ON public.returns(user_id);
CREATE INDEX IF NOT EXISTS idx_returns_order_id ON public.returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON public.returns(status);

ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own returns"
  ON public.returns FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create returns for own orders"
  ON public.returns FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_owner_of_order(order_id));

-- No client UPDATE/DELETE: server (edge function with service role) only

-- Wallet credits table
CREATE TABLE IF NOT EXISTS public.wallet_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL,
  description text DEFAULT '',
  order_id uuid,
  return_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_user_id ON public.wallet_credits(user_id);

ALTER TABLE public.wallet_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallet credits"
  ON public.wallet_credits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- No client INSERT/UPDATE/DELETE — server only

-- Wallet balance helper
CREATE OR REPLACE FUNCTION public.get_wallet_balance(p_user_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(
    CASE
      WHEN type = 'redemption' THEN -ABS(amount)
      ELSE ABS(amount)
    END
  ), 0)
  FROM public.wallet_credits
  WHERE user_id = p_user_id;
$$;

-- updated_at trigger for returns
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_returns_touch ON public.returns;
CREATE TRIGGER trg_returns_touch
  BEFORE UPDATE ON public.returns
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();