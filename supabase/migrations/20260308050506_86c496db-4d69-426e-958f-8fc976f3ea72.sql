
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text NOT NULL DEFAULT '',
  price numeric NOT NULL,
  original_price numeric,
  discount integer DEFAULT 0,
  category text NOT NULL DEFAULT 'men',
  subcategory text NOT NULL DEFAULT '',
  image text NOT NULL DEFAULT '',
  additional_images text[] DEFAULT '{}',
  stock_quantity integer DEFAULT 0,
  low_stock_threshold integer DEFAULT 10,
  sizes text[] DEFAULT '{}',
  colors jsonb DEFAULT '[]',
  tags text[] DEFAULT '{}',
  in_stock boolean DEFAULT true,
  description text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Public read access for storefront
CREATE POLICY "Anyone can view products"
  ON public.products FOR SELECT
  USING (true);

-- No direct insert/update/delete from client - handled via edge functions with admin check
