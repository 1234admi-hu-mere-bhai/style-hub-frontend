
CREATE TABLE public.product_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  user_id uuid,
  session_id text,
  viewed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX product_views_product_id_idx ON public.product_views(product_id);
CREATE INDEX product_views_viewed_at_idx ON public.product_views(viewed_at DESC);

GRANT INSERT ON public.product_views TO anon, authenticated;
GRANT ALL ON public.product_views TO service_role;

ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record a view"
  ON public.product_views FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.product_views;

CREATE OR REPLACE FUNCTION public.get_product_stats(p_product_id text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'views', (SELECT count(*) FROM public.product_views WHERE product_id = p_product_id),
    'purchases', (
      SELECT COALESCE(SUM(oi.quantity), 0)::bigint
      FROM public.order_items oi
      JOIN public.orders o ON o.id = oi.order_id
      WHERE oi.product_id = p_product_id
        AND COALESCE(o.status, '') NOT IN ('cancelled', 'payment_failed', 'pending_payment')
    )
  )
$$;

GRANT EXECUTE ON FUNCTION public.get_product_stats(text) TO anon, authenticated;
