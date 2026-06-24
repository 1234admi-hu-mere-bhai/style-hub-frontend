
-- Revoke EXECUTE on internal-only SECURITY DEFINER functions from anon/authenticated.
-- Keep grants for functions intentionally called by clients/RLS:
--   get_product_stats (public stats), get_email_by_phone (phone login),
--   is_owner / is_active_staff / is_owner_of_order / staff_has_module (RLS helpers).

REVOKE EXECUTE ON FUNCTION public.touch_updated_at()               FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column()       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_prefs()          FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_wallet()         FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_refund_metadata()            FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb)     FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint)                 FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb)                 FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer)   FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.log_staff_activity(uuid, text, text, text, text, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.adjust_wallet_balance(uuid, numeric, text, text, text, text)              FROM PUBLIC, anon, authenticated;
