
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_seen_visibility text NOT NULL DEFAULT 'everyone',
  ADD COLUMN IF NOT EXISTS profile_photo_visibility text NOT NULL DEFAULT 'everyone';
