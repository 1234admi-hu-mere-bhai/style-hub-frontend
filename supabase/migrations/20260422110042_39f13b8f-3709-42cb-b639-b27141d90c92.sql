-- Drop wallet feature
DROP FUNCTION IF EXISTS public.get_wallet_balance(uuid);
DROP TABLE IF EXISTS public.wallet_credits;

-- Phone lookup function: given a phone number, return the matching user's email.
-- Used to support "login with phone + password" without storing duplicate auth records.
-- SECURITY DEFINER so it can read auth.users; restricted to phone-string input only.
CREATE OR REPLACE FUNCTION public.get_email_by_phone(p_phone text)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.email::text
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.phone = p_phone
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.get_email_by_phone(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_email_by_phone(text) TO anon, authenticated;

-- Ensure refund_method is always 'source' going forward (we removed wallet option)
UPDATE public.orders SET refund_method = 'source' WHERE refund_method IS NULL OR refund_method = 'wallet';
UPDATE public.returns SET refund_method = 'source' WHERE refund_method = 'wallet';

-- Add a unique constraint on phone in profiles so phone login is unambiguous
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique_idx ON public.profiles (phone) WHERE phone IS NOT NULL AND phone <> '';