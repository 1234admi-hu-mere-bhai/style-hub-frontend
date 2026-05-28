GRANT EXECUTE ON FUNCTION public.is_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_owner(uuid) TO service_role;

GRANT EXECUTE ON FUNCTION public.staff_has_module(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_has_module(uuid, text) TO service_role;

GRANT EXECUTE ON FUNCTION public.is_active_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_staff(uuid) TO service_role;