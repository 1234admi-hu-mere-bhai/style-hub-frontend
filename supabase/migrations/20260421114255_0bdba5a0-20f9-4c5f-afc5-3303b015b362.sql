-- Add user_id scoping to notifications table
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id uuid;

-- Add rejection_reason to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Drop old broad SELECT policy and replace with user-scoped one
DROP POLICY IF EXISTS "Authenticated users can view notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (user_id IS NULL OR user_id = auth.uid());

-- Allow users to mark their own notifications as read
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);