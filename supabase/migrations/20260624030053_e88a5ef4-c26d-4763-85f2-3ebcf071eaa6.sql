CREATE OR REPLACE FUNCTION public.get_product_stats(p_product_id text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH unique_viewers AS (
    SELECT DISTINCT COALESCE(user_id::text, session_id) AS viewer
    FROM public.product_views
    WHERE product_id = p_product_id
      AND COALESCE(user_id::text, session_id) IS NOT NULL
  )
  SELECT jsonb_build_object(
    'views', (SELECT count(*) FROM unique_viewers),
    'purchases', (
      SELECT COALESCE(SUM(oi.quantity), 0)::bigint
      FROM public.order_items oi
      JOIN public.orders o ON o.id = oi.order_id
      WHERE oi.product_id = p_product_id
        AND COALESCE(o.status, '') NOT IN ('cancelled', 'payment_failed', 'pending_payment')
    )
  )
$function$;