CREATE SCHEMA IF NOT EXISTS app_private;

CREATE OR REPLACE FUNCTION app_private.can_manage_product_images(_uid uuid, _email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE u.id = _uid
      AND lower(u.email) IN ('otw2003@gmail.com', 'kaliasgar776@gmail.com', 'muffigout@gmail.com')
  )
  OR lower(coalesce(_email, '')) IN ('otw2003@gmail.com', 'kaliasgar776@gmail.com', 'muffigout@gmail.com')
  OR EXISTS (
    SELECT 1
    FROM public.staff_members sm
    WHERE sm.user_id = _uid
      AND sm.status = 'active'
      AND COALESCE((sm.permissions ->> 'products')::boolean, false) = true
  )
$$;

GRANT USAGE ON SCHEMA app_private TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.can_manage_product_images(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.can_manage_product_images(uuid, text) TO service_role;

DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;

CREATE POLICY "Admins can upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND app_private.can_manage_product_images(auth.uid(), auth.jwt() ->> 'email')
);

CREATE POLICY "Admins can update product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND app_private.can_manage_product_images(auth.uid(), auth.jwt() ->> 'email')
)
WITH CHECK (
  bucket_id = 'product-images'
  AND app_private.can_manage_product_images(auth.uid(), auth.jwt() ->> 'email')
);

CREATE POLICY "Admins can delete product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND app_private.can_manage_product_images(auth.uid(), auth.jwt() ->> 'email')
);

REVOKE SELECT ON public.staff_members FROM authenticated;