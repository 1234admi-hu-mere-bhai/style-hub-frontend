CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referral_code text NOT NULL UNIQUE,
  referred_email text DEFAULT NULL,
  referred_id uuid DEFAULT NULL,
  status text NOT NULL DEFAULT 'pending',
  referrer_discount_applied boolean DEFAULT false,
  referred_discount_applied boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  used_at timestamp with time zone DEFAULT NULL
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referrals" ON public.referrals FOR SELECT TO authenticated USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
CREATE POLICY "Authenticated users can create referrals" ON public.referrals FOR INSERT TO authenticated WITH CHECK (auth.uid() = referrer_id);
CREATE POLICY "Users can update their own referrals" ON public.referrals FOR UPDATE TO authenticated USING (auth.uid() = referrer_id OR auth.uid() = referred_id);