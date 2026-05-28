GRANT SELECT ON public.staff_members TO authenticated;
GRANT ALL ON public.staff_members TO service_role;

DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;

CREATE POLICY "Admins can upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND (
    lower(coalesce(auth.jwt() ->> 'email', '')) IN ('otw2003@gmail.com', 'kaliasgar776@gmail.com', 'muffigout@gmail.com')
    OR EXISTS (
      SELECT 1
      FROM public.staff_members sm
      WHERE sm.user_id = auth.uid()
        AND sm.status = 'active'
        AND COALESCE((sm.permissions ->> 'products')::boolean, false) = true
    )
  )
);

CREATE POLICY "Admins can update product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (
    lower(coalesce(auth.jwt() ->> 'email', '')) IN ('otw2003@gmail.com', 'kaliasgar776@gmail.com', 'muffigout@gmail.com')
    OR EXISTS (
      SELECT 1
      FROM public.staff_members sm
      WHERE sm.user_id = auth.uid()
        AND sm.status = 'active'
        AND COALESCE((sm.permissions ->> 'products')::boolean, false) = true
    )
  )
)
WITH CHECK (
  bucket_id = 'product-images'
  AND (
    lower(coalesce(auth.jwt() ->> 'email', '')) IN ('otw2003@gmail.com', 'kaliasgar776@gmail.com', 'muffigout@gmail.com')
    OR EXISTS (
      SELECT 1
      FROM public.staff_members sm
      WHERE sm.user_id = auth.uid()
        AND sm.status = 'active'
        AND COALESCE((sm.permissions ->> 'products')::boolean, false) = true
    )
  )
);

CREATE POLICY "Admins can delete product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (
    lower(coalesce(auth.jwt() ->> 'email', '')) IN ('otw2003@gmail.com', 'kaliasgar776@gmail.com', 'muffigout@gmail.com')
    OR EXISTS (
      SELECT 1
      FROM public.staff_members sm
      WHERE sm.user_id = auth.uid()
        AND sm.status = 'active'
        AND COALESCE((sm.permissions ->> 'products')::boolean, false) = true
    )
  )
);

REVOKE EXECUTE ON FUNCTION public.is_owner(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.staff_has_module(uuid, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_active_staff(uuid) FROM authenticated;