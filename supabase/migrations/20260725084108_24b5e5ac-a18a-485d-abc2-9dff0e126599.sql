
CREATE TABLE IF NOT EXISTS public.bank_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  banks text[] NOT NULL DEFAULT '{}'::text[],
  discount_type text NOT NULL DEFAULT 'percent' CHECK (discount_type IN ('percent','flat')),
  discount_value numeric NOT NULL DEFAULT 0,
  max_discount numeric,
  min_order numeric NOT NULL DEFAULT 0,
  applies_to text NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all','prepaid','cod')),
  priority integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  start_time timestamptz,
  end_time timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.bank_offers TO anon, authenticated;
GRANT ALL ON public.bank_offers TO service_role;

ALTER TABLE public.bank_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active bank offers are publicly readable"
  ON public.bank_offers FOR SELECT
  USING (
    is_active = true
    AND (start_time IS NULL OR start_time <= now())
    AND (end_time IS NULL OR end_time > now())
  );

CREATE POLICY "Owners manage bank offers"
  ON public.bank_offers FOR ALL
  USING (public.is_owner(auth.uid()))
  WITH CHECK (public.is_owner(auth.uid()));

CREATE TRIGGER bank_offers_touch_updated_at
  BEFORE UPDATE ON public.bank_offers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.bank_offers (title, description, banks, discount_type, discount_value, max_discount, min_order, applies_to, priority)
VALUES (
  'Mega Deal',
  '10% instant discount with select bank cards & UPI',
  ARRAY['HDFC','ICICI','SBI','Axis','Kotak','UPI'],
  'percent',
  10,
  100,
  499,
  'prepaid',
  10
);
