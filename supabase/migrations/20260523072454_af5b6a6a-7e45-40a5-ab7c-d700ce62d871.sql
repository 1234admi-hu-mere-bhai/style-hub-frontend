
REVOKE EXECUTE ON FUNCTION public.is_owner(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_active_staff(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_owner_of_order(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.staff_has_module(uuid, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_email_by_phone(text) FROM PUBLIC, anon, authenticated;
