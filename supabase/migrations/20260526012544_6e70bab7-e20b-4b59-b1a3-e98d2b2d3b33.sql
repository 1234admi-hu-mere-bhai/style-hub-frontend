-- Prevent leaking other users' emails via products.visible_to_emails column.
-- The RLS policy still references this column server-side; we only block clients from selecting it.
REVOKE SELECT (visible_to_emails) ON public.products FROM anon, authenticated;