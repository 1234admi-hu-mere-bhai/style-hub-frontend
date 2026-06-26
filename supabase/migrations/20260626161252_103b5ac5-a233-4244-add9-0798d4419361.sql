
CREATE OR REPLACE FUNCTION public.increment_coupon_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
BEGIN
  -- Skip cancelled / failed / pending payment states
  IF TG_OP = 'INSERT' THEN
    v_code := NULLIF(trim(NEW.coupon_code), '');
    IF v_code IS NOT NULL
       AND COALESCE(NEW.status, '') NOT IN ('cancelled', 'payment_failed', 'pending_payment') THEN
      UPDATE public.coupons
         SET used_count = COALESCE(used_count, 0) + 1
       WHERE upper(code) = upper(v_code);
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- If a previously pending order transitions to a non-failed state, count it once.
    v_code := NULLIF(trim(NEW.coupon_code), '');
    IF v_code IS NOT NULL
       AND COALESCE(OLD.status, '') IN ('pending_payment')
       AND COALESCE(NEW.status, '') NOT IN ('cancelled', 'payment_failed', 'pending_payment') THEN
      UPDATE public.coupons
         SET used_count = COALESCE(used_count, 0) + 1
       WHERE upper(code) = upper(v_code);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_coupon_usage() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_increment_coupon_usage_ins ON public.orders;
CREATE TRIGGER trg_increment_coupon_usage_ins
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.increment_coupon_usage();

DROP TRIGGER IF EXISTS trg_increment_coupon_usage_upd ON public.orders;
CREATE TRIGGER trg_increment_coupon_usage_upd
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.increment_coupon_usage();
