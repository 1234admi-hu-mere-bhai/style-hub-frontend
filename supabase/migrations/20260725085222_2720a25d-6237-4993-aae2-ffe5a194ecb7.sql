ALTER TABLE public.flash_sales ADD COLUMN IF NOT EXISTS campaign_label text;
ALTER TABLE public.bank_offers ADD COLUMN IF NOT EXISTS badge_text text;
ALTER TABLE public.bank_offers ADD COLUMN IF NOT EXISTS footer_text text;