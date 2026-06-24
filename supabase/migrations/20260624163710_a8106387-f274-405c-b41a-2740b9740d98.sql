-- 1) Lock chat_messages.role to safe values to prevent prompt injection
ALTER TABLE public.chat_messages
  ADD CONSTRAINT chat_messages_role_check
  CHECK (role IN ('user', 'assistant'));

-- 2) Restrict coupons SELECT to non-sensitive columns (hide used_count / max_uses)
REVOKE SELECT ON public.coupons FROM anon, authenticated;
GRANT SELECT (id, code, discount_type, discount_value, min_order_value, expires_at, is_active, created_at)
  ON public.coupons TO authenticated;
-- service_role retains ALL via existing grants (used by edge functions and admin export)
