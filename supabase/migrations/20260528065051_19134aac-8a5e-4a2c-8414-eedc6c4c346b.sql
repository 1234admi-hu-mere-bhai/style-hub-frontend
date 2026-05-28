
-- 1) Restrict coupons SELECT to authenticated users only
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;

CREATE POLICY "Authenticated users can view active coupons"
ON public.coupons
FOR SELECT
TO authenticated
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

REVOKE SELECT ON public.coupons FROM anon;
GRANT SELECT ON public.coupons TO authenticated;

-- 2) Explicit deny on client inserts into staff_activity_log
CREATE POLICY "Deny client inserts on staff_activity_log"
ON public.staff_activity_log
AS RESTRICTIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (false);
