
-- Trigger functions: not meant to be called directly
REVOKE EXECUTE ON FUNCTION public.set_refund_metadata() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_prefs() FROM PUBLIC, anon, authenticated;

-- Internal logging / admin: only service role
REVOKE EXECUTE ON FUNCTION public.log_staff_activity(uuid, text, text, text, text, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;

-- Email queue helpers: server-only (already revoked previously, ensure)
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;

-- RLS helper functions: revoke from anon/public, keep for authenticated (needed during RLS evaluation as RPC parity)
REVOKE EXECUTE ON FUNCTION public.is_owner(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_active_staff(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_owner_of_order(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.staff_has_module(uuid, text) FROM PUBLIC, anon;

-- get_email_by_phone: needed at sign-in (anon) for phone -> email lookup; keep anon, but ensure no extra grants
-- (left as-is intentionally)
