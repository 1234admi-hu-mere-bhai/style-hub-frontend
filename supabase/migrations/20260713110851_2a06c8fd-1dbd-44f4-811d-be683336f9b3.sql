
-- 1) Update notify_back_in_stock trigger to authenticate the http call with the service role key
CREATE OR REPLACE FUNCTION public.notify_back_in_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  fn_url TEXT;
  service_key TEXT;
BEGIN
  IF COALESCE(OLD.in_stock, false) = false AND COALESCE(NEW.in_stock, false) = true THEN
    fn_url := 'https://zybjzfffkylezzvotcnn.supabase.co/functions/v1/notify-back-in-stock';
    BEGIN
      service_key := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key');
    EXCEPTION WHEN OTHERS THEN
      service_key := NULL;
    END;

    IF service_key IS NOT NULL THEN
      PERFORM net.http_post(
        url := fn_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_key
        ),
        body := jsonb_build_object('product_id', NEW.id::text)
      );
    END IF;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$function$;

-- 2) Fix returns UPDATE RLS: replace self-referencing check with a BEFORE UPDATE trigger
--    that only permits changing selected_refund_method (and updated_at). All other user-facing
--    UPDATEs snap fields back to their OLD values, so the WITH CHECK cannot be bypassed.

DROP POLICY IF EXISTS "Users select refund method on own returns" ON public.returns;

CREATE POLICY "Users select refund method on own returns"
ON public.returns
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'return_approved')
WITH CHECK (
  auth.uid() = user_id
  AND selected_refund_method = ANY (ARRAY['wallet'::text, 'source'::text])
  AND selected_refund_method = ANY (allowed_refund_methods)
);

CREATE OR REPLACE FUNCTION public.enforce_returns_user_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  is_staff boolean;
BEGIN
  -- Bypass restrictions for service_role (edge functions / admin RPCs)
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Bypass for active staff (admins/staff already gated via edge functions,
  -- but keep parity in case of direct authenticated staff updates).
  BEGIN
    is_staff := public.is_active_staff(auth.uid());
  EXCEPTION WHEN OTHERS THEN
    is_staff := false;
  END;
  IF is_staff THEN
    RETURN NEW;
  END IF;

  -- Regular authenticated users may only mutate selected_refund_method + updated_at.
  NEW.status                   := OLD.status;
  NEW.refund_amount            := OLD.refund_amount;
  NEW.allowed_refund_methods   := OLD.allowed_refund_methods;
  NEW.refund_method            := OLD.refund_method;
  NEW.order_id                 := OLD.order_id;
  NEW.user_id                  := OLD.user_id;
  NEW.reason_code              := OLD.reason_code;
  NEW.reason_details           := OLD.reason_details;
  NEW.auto_approved            := OLD.auto_approved;
  NEW.payu_refund_id           := OLD.payu_refund_id;
  NEW.refunded_at              := OLD.refunded_at;
  NEW.picked_up_at             := OLD.picked_up_at;
  NEW.manual_review_reason     := OLD.manual_review_reason;
  NEW.admin_window_expires_at  := OLD.admin_window_expires_at;
  NEW.created_at               := OLD.created_at;
  NEW.id                       := OLD.id;

  -- Prevent re-selecting once already set (matches select-refund-method edge function).
  IF OLD.selected_refund_method IS NOT NULL
     AND NEW.selected_refund_method IS DISTINCT FROM OLD.selected_refund_method THEN
    RAISE EXCEPTION 'Refund method already selected';
  END IF;

  -- Enforce 6h selection window if set.
  IF OLD.admin_window_expires_at IS NOT NULL
     AND OLD.admin_window_expires_at < now()
     AND NEW.selected_refund_method IS DISTINCT FROM OLD.selected_refund_method THEN
    RAISE EXCEPTION 'Selection window has expired';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS enforce_returns_user_update_trg ON public.returns;
CREATE TRIGGER enforce_returns_user_update_trg
BEFORE UPDATE ON public.returns
FOR EACH ROW
EXECUTE FUNCTION public.enforce_returns_user_update();
