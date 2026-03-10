-- Add RLS policies so authenticated users can view notifications
CREATE POLICY "Authenticated users can view notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;