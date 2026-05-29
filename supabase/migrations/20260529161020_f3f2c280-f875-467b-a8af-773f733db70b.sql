-- Allow staff/owners to read push campaigns via client
CREATE POLICY "Staff can view push campaigns"
ON public.push_campaigns
FOR SELECT
TO authenticated
USING (public.is_active_staff(auth.uid()));

GRANT SELECT ON public.push_campaigns TO authenticated;

-- Tighten referrals UPDATE: drop the no-op client policy that allowed
-- the referred user to touch rows. All referral state changes happen
-- server-side via service role / SECURITY DEFINER functions.
DROP POLICY IF EXISTS "Users can update their own referrals" ON public.referrals;