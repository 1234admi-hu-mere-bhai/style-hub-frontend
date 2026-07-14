
ALTER TABLE public.returns
  ADD COLUMN IF NOT EXISTS request_type text NOT NULL DEFAULT 'return',
  ADD COLUMN IF NOT EXISTS exchange_size text,
  ADD COLUMN IF NOT EXISTS exchange_color text;

ALTER TABLE public.returns
  DROP CONSTRAINT IF EXISTS returns_request_type_chk;
ALTER TABLE public.returns
  ADD CONSTRAINT returns_request_type_chk
  CHECK (request_type IN ('return', 'exchange'));

CREATE OR REPLACE FUNCTION public.validate_exchange_return()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.request_type = 'exchange' THEN
    IF COALESCE(NULLIF(trim(NEW.exchange_size), ''), NULLIF(trim(NEW.exchange_color), '')) IS NULL THEN
      RAISE EXCEPTION 'Exchange requests must specify a new size or color';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_exchange_return ON public.returns;
CREATE TRIGGER trg_validate_exchange_return
  BEFORE INSERT OR UPDATE ON public.returns
  FOR EACH ROW EXECUTE FUNCTION public.validate_exchange_return();
