-- 1. Archive flag on participants
ALTER TABLE public.conversation_participants
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_conv_participants_user_archived
  ON public.conversation_participants(user_id, is_archived);

-- 2. Change-number verification state
CREATE TABLE IF NOT EXISTS public.change_number_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  current_phone text,
  new_phone text NOT NULL,
  email text,
  phone_verified boolean NOT NULL DEFAULT false,
  email_verified boolean NOT NULL DEFAULT false,
  selfie_verified boolean NOT NULL DEFAULT false,
  selfie_url text,
  selfie_score numeric,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.change_number_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner view verification"
  ON public.change_number_verifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owner insert verification"
  ON public.change_number_verifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner update verification"
  ON public.change_number_verifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_change_number_verifications_updated_at
  BEFORE UPDATE ON public.change_number_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Email OTP codes
CREATE TABLE IF NOT EXISTS public.email_otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  code_hash text NOT NULL,
  purpose text NOT NULL DEFAULT 'change_number',
  attempts int NOT NULL DEFAULT 0,
  consumed boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_otp_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner view email codes"
  ON public.email_otp_codes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_email_otp_codes_user_email_purpose
  ON public.email_otp_codes(user_id, email, purpose);

-- 4. Selfies storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-selfies', 'verification-selfies', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own selfies"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'verification-selfies' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users read own selfies"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'verification-selfies' AND (storage.foldername(name))[1] = auth.uid()::text);
