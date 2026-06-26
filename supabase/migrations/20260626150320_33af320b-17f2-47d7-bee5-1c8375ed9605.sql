
CREATE TABLE IF NOT EXISTS public.stock_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.stock_notifications TO authenticated;
GRANT ALL ON public.stock_notifications TO service_role;

ALTER TABLE public.stock_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert their own stock alerts"
  ON public.stock_notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view their own stock alerts"
  ON public.stock_notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete their own stock alerts"
  ON public.stock_notifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_stock_notifications_product
  ON public.stock_notifications(product_id) WHERE notified_at IS NULL;

-- Trigger: when in_stock flips false -> true, invoke edge function
CREATE OR REPLACE FUNCTION public.notify_back_in_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fn_url TEXT;
  service_key TEXT;
BEGIN
  IF COALESCE(OLD.in_stock, false) = false AND COALESCE(NEW.in_stock, false) = true THEN
    fn_url := 'https://zybjzfffkylezzvotcnn.supabase.co/functions/v1/notify-back-in-stock';
    service_key := current_setting('app.settings.service_role_key', true);

    PERFORM net.http_post(
      url := fn_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('product_id', NEW.id::text)
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_back_in_stock() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_products_back_in_stock ON public.products;
CREATE TRIGGER trg_products_back_in_stock
AFTER UPDATE OF in_stock ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.notify_back_in_stock();
