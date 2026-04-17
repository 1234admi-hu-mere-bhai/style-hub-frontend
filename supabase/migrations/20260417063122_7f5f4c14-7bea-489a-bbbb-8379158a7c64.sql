-- Add refund tracking columns to orders
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS refund_amount numeric,
  ADD COLUMN IF NOT EXISTS refund_eta timestamp with time zone,
  ADD COLUMN IF NOT EXISTS refund_processed_at timestamp with time zone;

-- Trigger: when status transitions to return_approved, auto-set refund_amount (= order total) and refund_eta (= now + 7 days).
-- When status transitions to refund_processed, stamp refund_processed_at.
CREATE OR REPLACE FUNCTION public.set_refund_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'return_approved' AND (OLD.status IS DISTINCT FROM 'return_approved') THEN
    IF NEW.refund_amount IS NULL THEN
      NEW.refund_amount := NEW.total;
    END IF;
    IF NEW.refund_eta IS NULL THEN
      NEW.refund_eta := now() + interval '7 days';
    END IF;
  END IF;

  IF NEW.status = 'refund_processed' AND (OLD.status IS DISTINCT FROM 'refund_processed') THEN
    IF NEW.refund_processed_at IS NULL THEN
      NEW.refund_processed_at := now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_refund_metadata ON public.orders;
CREATE TRIGGER trg_set_refund_metadata
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_refund_metadata();