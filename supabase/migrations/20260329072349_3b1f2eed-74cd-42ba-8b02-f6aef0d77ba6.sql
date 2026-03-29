
-- Fix 1: Reviews UPDATE policy - fix broken helpful subquery
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update their own reviews" ON public.reviews
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND verified = false
    AND helpful = (SELECT r.helpful FROM public.reviews r WHERE r.id = reviews.id)
  );

-- Fix 2: Referrals UPDATE policy - prevent users from modifying discount flags and status
DROP POLICY IF EXISTS "Users can update their own referrals" ON public.referrals;
CREATE POLICY "Users can update their own referrals" ON public.referrals
  FOR UPDATE TO authenticated
  USING ((auth.uid() = referrer_id) OR (auth.uid() = referred_id))
  WITH CHECK (
    (auth.uid() = referrer_id OR auth.uid() = referred_id)
    AND referrer_discount_applied = (SELECT r.referrer_discount_applied FROM public.referrals r WHERE r.id = referrals.id)
    AND referred_discount_applied = (SELECT r.referred_discount_applied FROM public.referrals r WHERE r.id = referrals.id)
    AND status = (SELECT r.status FROM public.referrals r WHERE r.id = referrals.id)
  );

-- Fix 3: push_config - add explicit deny-all SELECT policy for non-service-role
-- RLS is already enabled but has no policies, which means deny-all by default.
-- Add an explicit policy to make intent clear and prevent accidental future exposure.
CREATE POLICY "Deny all client access to push_config" ON public.push_config
  FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Fix 4: site_visits - restrict SELECT to deny reading others' data
-- Keep INSERT open for tracking, but remove public read access
DROP POLICY IF EXISTS "Anyone can view visits" ON public.site_visits;
