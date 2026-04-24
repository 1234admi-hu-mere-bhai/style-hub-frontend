-- Add allowlist column (NULL/empty = public, populated = restricted)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS visible_to_emails text[] DEFAULT NULL;

-- Replace the public SELECT policy with an allowlist-aware one
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;

CREATE POLICY "Products visible to everyone or allowlisted emails"
ON public.products
FOR SELECT
TO public
USING (
  visible_to_emails IS NULL
  OR array_length(visible_to_emails, 1) IS NULL
  OR (
    auth.uid() IS NOT NULL
    AND lower((auth.jwt() ->> 'email')) = ANY (
      SELECT lower(e) FROM unnest(visible_to_emails) AS e
    )
  )
);