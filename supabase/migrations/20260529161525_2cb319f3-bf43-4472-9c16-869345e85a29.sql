ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS fit text,
  ADD COLUMN IF NOT EXISTS fabric text,
  ADD COLUMN IF NOT EXISTS occasion text,
  ADD COLUMN IF NOT EXISTS color_family text,
  ADD COLUMN IF NOT EXISTS sleeve_type text,
  ADD COLUMN IF NOT EXISTS neck_type text,
  ADD COLUMN IF NOT EXISTS collection text;

CREATE INDEX IF NOT EXISTS idx_products_fit ON public.products (fit);
CREATE INDEX IF NOT EXISTS idx_products_fabric ON public.products (fabric);
CREATE INDEX IF NOT EXISTS idx_products_occasion ON public.products (occasion);
CREATE INDEX IF NOT EXISTS idx_products_color_family ON public.products (color_family);
CREATE INDEX IF NOT EXISTS idx_products_sleeve_type ON public.products (sleeve_type);
CREATE INDEX IF NOT EXISTS idx_products_neck_type ON public.products (neck_type);
CREATE INDEX IF NOT EXISTS idx_products_collection ON public.products (collection);