-- 1. Notification preferences (per-category toggles, all ON by default)
CREATE TABLE public.notification_preferences (
  user_id UUID NOT NULL PRIMARY KEY,
  orders BOOLEAN NOT NULL DEFAULT true,
  offers BOOLEAN NOT NULL DEFAULT true,
  wishlist BOOLEAN NOT NULL DEFAULT true,
  cart_reminders BOOLEAN NOT NULL DEFAULT true,
  flash_sales BOOLEAN NOT NULL DEFAULT true,
  new_arrivals BOOLEAN NOT NULL DEFAULT true,
  announcements BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own prefs" ON public.notification_preferences
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own prefs" ON public.notification_preferences
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own prefs" ON public.notification_preferences
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_notification_prefs_updated
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-create prefs row on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_prefs()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_prefs();

-- Backfill existing users
INSERT INTO public.notification_preferences (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- 2. Wishlist items (server-side)
CREATE TABLE public.wishlist_items (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  last_seen_price NUMERIC NOT NULL,
  last_seen_in_stock BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own wishlist" ON public.wishlist_items
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_wishlist_items_product ON public.wishlist_items(product_id);

-- 3. Cart snapshot (one row per user, latest cart)
CREATE TABLE public.cart_snapshots (
  user_id UUID NOT NULL PRIMARY KEY,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  item_count INTEGER NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_reminder_sent_at TIMESTAMPTZ
);

ALTER TABLE public.cart_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own cart" ON public.cart_snapshots
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_cart_snapshots_updated
  BEFORE UPDATE ON public.cart_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4. Push send log — prevents duplicates
CREATE TABLE public.push_send_log (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  category TEXT NOT NULL,
  dedupe_key TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, dedupe_key)
);

ALTER TABLE public.push_send_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages push log" ON public.push_send_log
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE INDEX idx_push_send_log_sent_at ON public.push_send_log(sent_at DESC);

-- 5. Push campaigns (admin-composed broadcasts)
CREATE TABLE public.push_campaigns (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  url TEXT,
  category TEXT NOT NULL DEFAULT 'announcements',
  audience TEXT NOT NULL DEFAULT 'all',
  status TEXT NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  recipients_count INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.push_campaigns ENABLE ROW LEVEL SECURITY;

-- Only service role manages campaigns (admin uses edge function)
CREATE POLICY "Service role manages campaigns" ON public.push_campaigns
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER trg_push_campaigns_updated
  BEFORE UPDATE ON public.push_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_push_campaigns_status ON public.push_campaigns(status, scheduled_at);
