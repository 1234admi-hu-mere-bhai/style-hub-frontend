
-- 1) product_views: stop realtime broadcast & add restrictive SELECT policy
ALTER PUBLICATION supabase_realtime DROP TABLE public.product_views;

CREATE POLICY "Users can read their own product views"
  ON public.product_views FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 2) coupons: column-level SELECT (hide used_count, max_uses, created_at, updated_at, description)
DROP POLICY IF EXISTS "Authenticated users can view active coupons" ON public.coupons;

REVOKE SELECT ON public.coupons FROM anon, authenticated;
GRANT SELECT (id, code, discount_type, discount_value, min_order_value, expires_at, is_active)
  ON public.coupons TO authenticated;

CREATE POLICY "Authenticated users can view active coupons"
  ON public.coupons FOR SELECT TO authenticated
  USING ((is_active = true) AND ((expires_at IS NULL) OR (expires_at > now())));

-- 3) Move VAPID private key out of public schema
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO service_role;

CREATE TABLE IF NOT EXISTS private.push_vapid_keys (
  id int PRIMARY KEY,
  public_key text NOT NULL,
  private_key text NOT NULL,
  subject text,
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON private.push_vapid_keys FROM PUBLIC, anon, authenticated;
GRANT ALL ON private.push_vapid_keys TO service_role;

INSERT INTO private.push_vapid_keys (id, public_key, private_key, subject)
SELECT 1, public_key, private_key, subject
FROM public.push_config
ORDER BY created_at ASC
LIMIT 1
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.push_config DROP COLUMN IF EXISTS private_key;

-- 4) SECURITY DEFINER functions: revoke EXECUTE from anon/authenticated for internal-only functions.
-- Kept callable by clients/RLS helpers: is_owner, is_owner_of_order, is_active_staff, staff_has_module,
-- get_email_by_phone (phone-login lookup), get_product_stats (public stats card).
REVOKE EXECUTE ON FUNCTION public.adjust_wallet_balance(uuid, numeric, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_staff_activity(uuid, text, text, text, text, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_prefs() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_wallet() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_refund_metadata() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
