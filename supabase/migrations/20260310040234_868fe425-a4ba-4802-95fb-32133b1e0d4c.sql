
CREATE TABLE public.flash_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  discount_percentage INTEGER NOT NULL DEFAULT 10,
  product_ids UUID[] NOT NULL DEFAULT '{}',
  banner_color TEXT DEFAULT '#7C3AED',
  is_active BOOLEAN DEFAULT false,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active flash sales"
  ON public.flash_sales
  FOR SELECT
  TO public
  USING (is_active = true AND end_time > now());
