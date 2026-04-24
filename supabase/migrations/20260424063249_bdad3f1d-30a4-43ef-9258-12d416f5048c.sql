
ALTER TABLE public.push_campaigns
  ADD COLUMN IF NOT EXISTS delivered_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clicked_count integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.push_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.push_campaigns(id) ON DELETE CASCADE,
  dedupe_key text,
  user_id uuid,
  event_type text NOT NULL CHECK (event_type IN ('delivered','clicked','dismissed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS push_events_campaign_idx ON public.push_events(campaign_id);
CREATE INDEX IF NOT EXISTS push_events_dedupe_idx ON public.push_events(dedupe_key);

ALTER TABLE public.push_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages push events"
  ON public.push_events FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Anyone can insert push events"
  ON public.push_events FOR INSERT
  WITH CHECK (true);
