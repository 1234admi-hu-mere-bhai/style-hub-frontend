
-- ============ WALLETS ============
CREATE TABLE public.wallets (
  user_id UUID PRIMARY KEY,
  balance NUMERIC NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own wallet" ON public.wallets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============ WALLET TRANSACTIONS ============
CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('topup','topup_bonus','purchase','refund','adjustment','reversal')),
  reference_type TEXT,
  reference_id TEXT,
  balance_after NUMERIC NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_wallet_tx_user ON public.wallet_transactions(user_id, created_at DESC);
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own wallet transactions" ON public.wallet_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============ ATOMIC WALLET ADJUSTMENT FUNCTION ============
CREATE OR REPLACE FUNCTION public.adjust_wallet_balance(
  _user_id UUID,
  _amount NUMERIC,
  _type TEXT,
  _reference_type TEXT,
  _reference_id TEXT,
  _description TEXT
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance NUMERIC;
BEGIN
  INSERT INTO public.wallets (user_id, balance)
    VALUES (_user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.wallets
    SET balance = balance + _amount,
        updated_at = now()
    WHERE user_id = _user_id
    RETURNING balance INTO new_balance;

  IF new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  INSERT INTO public.wallet_transactions
    (user_id, amount, type, reference_type, reference_id, balance_after, description)
    VALUES (_user_id, _amount, _type, _reference_type, _reference_id, new_balance, _description);

  RETURN new_balance;
END;
$$;

-- ============ ORDERS: wallet split ============
ALTER TABLE public.orders ADD COLUMN wallet_amount_used NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN payu_amount NUMERIC NOT NULL DEFAULT 0;

-- ============ RETURNS: refund choice flow ============
ALTER TABLE public.returns ADD COLUMN allowed_refund_methods TEXT[] NOT NULL DEFAULT ARRAY['source'];
ALTER TABLE public.returns ADD COLUMN selected_refund_method TEXT;
ALTER TABLE public.returns ADD COLUMN admin_window_expires_at TIMESTAMPTZ;

-- Allow user to update only their own selected_refund_method (within allowed list)
CREATE POLICY "Users select refund method on own returns" ON public.returns
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status IN ('return_approved'))
  WITH CHECK (
    auth.uid() = user_id
    AND selected_refund_method = ANY(allowed_refund_methods)
    AND selected_refund_method IN ('wallet','source')
  );

-- ============ PENDING PAYMENTS: wallet topup + partial wallet ============
ALTER TABLE public.pending_payments ADD COLUMN wallet_amount_used NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.pending_payments ADD COLUMN is_wallet_topup BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.pending_payments ADD COLUMN topup_bonus NUMERIC NOT NULL DEFAULT 0;

-- ============ AUTO-CREATE WALLET ROW ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance) VALUES (NEW.id, 0)
    ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_wallet
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_wallet();

-- ============ updated_at trigger on wallets ============
CREATE TRIGGER touch_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
