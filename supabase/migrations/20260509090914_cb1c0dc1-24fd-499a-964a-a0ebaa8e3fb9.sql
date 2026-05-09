
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS two_factor_email text,
  ADD COLUMN IF NOT EXISTS two_factor_enabled boolean NOT NULL DEFAULT false;

-- Allow inserts to email_otp_codes from edge functions (service role bypasses RLS, so no policy change needed),
-- but ensure RLS still permits owner SELECT (already exists). No further change.
