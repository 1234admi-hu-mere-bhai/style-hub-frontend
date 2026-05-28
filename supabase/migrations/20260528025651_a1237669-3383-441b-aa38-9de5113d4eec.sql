ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS mannequin_image text,
  ADD COLUMN IF NOT EXISTS rotation_frames text[] DEFAULT '{}'::text[];