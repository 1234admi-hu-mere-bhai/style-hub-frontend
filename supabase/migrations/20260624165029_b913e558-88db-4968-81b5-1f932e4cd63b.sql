CREATE TABLE public.pincode_estimates (
  pincode TEXT PRIMARY KEY,
  serviceable BOOLEAN NOT NULL DEFAULT false,
  city TEXT,
  state TEXT,
  cod_available BOOLEAN NOT NULL DEFAULT false,
  prepaid_available BOOLEAN NOT NULL DEFAULT true,
  tat_days INTEGER,
  estimated_days TEXT,
  zone TEXT,
  raw JSONB,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pincode_estimates TO anon, authenticated;
GRANT ALL ON public.pincode_estimates TO service_role;

ALTER TABLE public.pincode_estimates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pincode estimates"
  ON public.pincode_estimates FOR SELECT
  USING (true);

CREATE TRIGGER pincode_estimates_touch_updated_at
  BEFORE UPDATE ON public.pincode_estimates
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();