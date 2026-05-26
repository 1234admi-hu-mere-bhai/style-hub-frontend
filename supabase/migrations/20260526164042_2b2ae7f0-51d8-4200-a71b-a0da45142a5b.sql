
DROP POLICY IF EXISTS "Users select refund method on own returns" ON public.returns;

CREATE POLICY "Users select refund method on own returns"
ON public.returns
FOR UPDATE
TO authenticated
USING ((auth.uid() = user_id) AND (status = 'return_approved'))
WITH CHECK (
  auth.uid() = user_id
  AND selected_refund_method = ANY (allowed_refund_methods)
  AND selected_refund_method = ANY (ARRAY['wallet','source'])
  AND status = (SELECT r.status FROM public.returns r WHERE r.id = returns.id)
  AND refund_amount = (SELECT r.refund_amount FROM public.returns r WHERE r.id = returns.id)
  AND allowed_refund_methods = (SELECT r.allowed_refund_methods FROM public.returns r WHERE r.id = returns.id)
  AND refund_method = (SELECT r.refund_method FROM public.returns r WHERE r.id = returns.id)
  AND order_id = (SELECT r.order_id FROM public.returns r WHERE r.id = returns.id)
  AND user_id = (SELECT r.user_id FROM public.returns r WHERE r.id = returns.id)
  AND reason_code = (SELECT r.reason_code FROM public.returns r WHERE r.id = returns.id)
  AND COALESCE(reason_details,'') = COALESCE((SELECT r.reason_details FROM public.returns r WHERE r.id = returns.id),'')
  AND auto_approved = (SELECT r.auto_approved FROM public.returns r WHERE r.id = returns.id)
  AND payu_refund_id IS NOT DISTINCT FROM (SELECT r.payu_refund_id FROM public.returns r WHERE r.id = returns.id)
  AND refunded_at IS NOT DISTINCT FROM (SELECT r.refunded_at FROM public.returns r WHERE r.id = returns.id)
  AND picked_up_at IS NOT DISTINCT FROM (SELECT r.picked_up_at FROM public.returns r WHERE r.id = returns.id)
  AND manual_review_reason IS NOT DISTINCT FROM (SELECT r.manual_review_reason FROM public.returns r WHERE r.id = returns.id)
  AND admin_window_expires_at IS NOT DISTINCT FROM (SELECT r.admin_window_expires_at FROM public.returns r WHERE r.id = returns.id)
);
