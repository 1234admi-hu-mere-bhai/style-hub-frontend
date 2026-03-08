-- Fix 1: Restrict orders UPDATE policy to only allow cancellation
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
CREATE POLICY "Users can cancel their own orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status IN ('placed', 'confirmed'))
  WITH CHECK (auth.uid() = user_id AND status = 'cancelled');

-- Fix 2: blog_posts SELECT policy should check is_published
DROP POLICY IF EXISTS "Anyone can view published blog posts" ON public.blog_posts;
CREATE POLICY "Anyone can view published blog posts"
  ON public.blog_posts FOR SELECT
  USING (is_published = true);

-- Fix 3: Remove open storage upload/delete policies for product-images
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;
