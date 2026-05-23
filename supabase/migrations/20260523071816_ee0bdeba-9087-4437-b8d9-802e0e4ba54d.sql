
-- 1. Coupons: only expose active, non-expired
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
CREATE POLICY "Anyone can view active coupons"
ON public.coupons
FOR SELECT
USING (
  is_active = true
  AND (expires_at IS NULL OR expires_at > now())
);

-- 2. Review images: enforce path = <auth.uid()>/...
DROP POLICY IF EXISTS "Authenticated users can upload review images" ON storage.objects;
CREATE POLICY "Users can upload review images to own folder"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'review-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own review images"
ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'review-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own review images"
ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'review-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Restrict listing of review-images (public direct URLs still work via CDN)
DROP POLICY IF EXISTS "Anyone can view review images" ON storage.objects;
CREATE POLICY "Owners can list own review images"
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'review-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Realtime channel authorization: restrict topic subscriptions to user-owned topics
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can subscribe to own topics" ON realtime.messages;
CREATE POLICY "Users can subscribe to own topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE '%' || auth.uid()::text || '%'
);

-- 4. Lock down email-queue SECURITY DEFINER helpers + fix mutable search_path
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;

REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_staff_activity(uuid, text, text, text, text, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
