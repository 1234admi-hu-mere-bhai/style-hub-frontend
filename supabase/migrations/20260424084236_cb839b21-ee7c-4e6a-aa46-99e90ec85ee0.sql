-- Pending staff changes queue
CREATE TABLE IF NOT EXISTS public.staff_pending_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_user_id uuid NOT NULL,
  staff_email text NOT NULL DEFAULT '',
  module text NOT NULL,                       -- products | coupons | blog | reviews | flash-sales | orders
  target_table text NOT NULL,                 -- e.g. products, coupons, blog_posts, reviews, flash_sales, orders
  action text NOT NULL,                       -- create | update | delete
  target_id text,                             -- id of the row being changed (null for create)
  proposed_data jsonb,                        -- new values
  previous_data jsonb,                        -- snapshot before change (for diff)
  summary text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',     -- pending | approved | rejected | cancelled
  reviewer_id uuid,
  reviewer_email text,
  reviewer_notes text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS staff_pending_changes_status_idx
  ON public.staff_pending_changes(status, created_at DESC);
CREATE INDEX IF NOT EXISTS staff_pending_changes_staff_idx
  ON public.staff_pending_changes(staff_user_id, created_at DESC);

ALTER TABLE public.staff_pending_changes ENABLE ROW LEVEL SECURITY;

-- Owners can do everything
CREATE POLICY "Owners manage pending changes"
ON public.staff_pending_changes
FOR ALL
TO authenticated
USING (public.is_owner(auth.uid()))
WITH CHECK (public.is_owner(auth.uid()));

-- Staff can view their own
CREATE POLICY "Staff view own pending changes"
ON public.staff_pending_changes
FOR SELECT
TO authenticated
USING (staff_user_id = auth.uid());

-- Staff can cancel their own (only while still pending)
CREATE POLICY "Staff cancel own pending changes"
ON public.staff_pending_changes
FOR UPDATE
TO authenticated
USING (staff_user_id = auth.uid() AND status = 'pending')
WITH CHECK (staff_user_id = auth.uid() AND status = 'cancelled');

-- updated_at trigger
CREATE TRIGGER touch_staff_pending_changes
BEFORE UPDATE ON public.staff_pending_changes
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
