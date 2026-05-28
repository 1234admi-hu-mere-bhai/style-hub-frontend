DROP POLICY IF EXISTS "Users can update their own referrals" ON public.referrals;

CREATE POLICY "Users can update their own referrals"
ON public.referrals
FOR UPDATE
TO authenticated
USING ((auth.uid() = referrer_id) OR (auth.uid() = referred_id))
WITH CHECK (
  ((auth.uid() = referrer_id) OR (auth.uid() = referred_id))
  AND referrer_id = (SELECT r.referrer_id FROM public.referrals r WHERE r.id = referrals.id)
  AND referral_code = (SELECT r.referral_code FROM public.referrals r WHERE r.id = referrals.id)
  AND referrer_discount_applied = (SELECT r.referrer_discount_applied FROM public.referrals r WHERE r.id = referrals.id)
  AND referred_discount_applied = (SELECT r.referred_discount_applied FROM public.referrals r WHERE r.id = referrals.id)
  AND status = (SELECT r.status FROM public.referrals r WHERE r.id = referrals.id)
  AND created_at = (SELECT r.created_at FROM public.referrals r WHERE r.id = referrals.id)
);