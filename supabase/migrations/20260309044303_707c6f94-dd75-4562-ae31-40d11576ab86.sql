
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;

CREATE POLICY "Users can update their own reviews" ON public.reviews
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND verified = false
    AND helpful = (SELECT helpful FROM public.reviews WHERE id = reviews.id)
  );
