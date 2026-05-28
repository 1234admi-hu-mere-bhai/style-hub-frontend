CREATE OR REPLACE FUNCTION public.is_owner(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = _uid
      AND lower(email) IN ('otw2003@gmail.com', 'kaliasgar776@gmail.com', 'muffigout@gmail.com')
  )
$function$;