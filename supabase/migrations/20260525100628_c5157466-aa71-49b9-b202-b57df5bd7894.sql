-- 1) Lock down coupon usage counters from public/anon/authenticated reads
REVOKE SELECT (max_uses, used_count) ON public.coupons FROM anon, authenticated;

-- 2) Stop direct client inserts into orders / order_items.
--    All order creation now goes exclusively through service-role edge functions
--    (payu-webhook for prepaid, create-cod-order for COD), which perform
--    server-side price validation from the products table.
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert their own order items" ON public.order_items;