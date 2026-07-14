
-- 1. Fix reviews UPDATE policy: replace flawed self-referential subquery with a trigger
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;

CREATE POLICY "Users can update their own reviews"
ON public.reviews
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND verified = false);

CREATE OR REPLACE FUNCTION public.protect_review_immutable_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service role / edge functions bypass
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Regular authenticated users cannot change helpful count, verified flag,
  -- product_id, user_id, or user_name via direct table update.
  NEW.helpful    := OLD.helpful;
  NEW.verified   := OLD.verified;
  NEW.product_id := OLD.product_id;
  NEW.user_id    := OLD.user_id;
  NEW.user_name  := OLD.user_name;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_review_immutable_fields ON public.reviews;
CREATE TRIGGER trg_protect_review_immutable_fields
BEFORE UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.protect_review_immutable_fields();

-- 2. Add explicit public SELECT policy for review-images bucket
DROP POLICY IF EXISTS "Public can view review images" ON storage.objects;
CREATE POLICY "Public can view review images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'review-images');
