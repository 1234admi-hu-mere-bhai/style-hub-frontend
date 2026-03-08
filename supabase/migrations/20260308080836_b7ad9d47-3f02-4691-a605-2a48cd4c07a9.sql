-- Create site visits tracking table
CREATE TABLE public.site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page text NOT NULL DEFAULT '/',
  visitor_id text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert visits (anonymous tracking)
CREATE POLICY "Anyone can insert visits"
ON public.site_visits FOR INSERT
WITH CHECK (true);

-- Allow anyone to read visits (for admin analytics)
CREATE POLICY "Anyone can view visits"
ON public.site_visits FOR SELECT
USING (true);

-- Create index for fast date queries
CREATE INDEX idx_site_visits_created_at ON public.site_visits (created_at DESC);
CREATE INDEX idx_site_visits_page ON public.site_visits (page);
