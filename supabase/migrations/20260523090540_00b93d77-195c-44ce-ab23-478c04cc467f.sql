
-- Coupons: revoke access to operational columns from anon/authenticated
REVOKE SELECT (max_uses, used_count) ON public.coupons FROM anon, authenticated;

-- Staff invites: add explicit deny for non-owners (defense-in-depth)
DROP POLICY IF EXISTS "Deny non-owners from reading staff invites" ON public.staff_invites;
CREATE POLICY "Deny non-owners from reading staff invites"
ON public.staff_invites
AS RESTRICTIVE
FOR SELECT
TO authenticated, anon
USING (public.is_owner(auth.uid()));
