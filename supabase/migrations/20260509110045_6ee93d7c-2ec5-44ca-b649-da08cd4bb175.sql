
-- 1. Security events table
CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_security_events_user_created ON public.security_events(user_id, created_at DESC);
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own security events"
  ON public.security_events FOR SELECT
  USING (auth.uid() = user_id);

-- 2. OTP rate limit table
CREATE TABLE IF NOT EXISTS public.otp_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  purpose text NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_otp_rate_user_purpose ON public.otp_rate_limits(user_id, purpose, attempted_at DESC);
ALTER TABLE public.otp_rate_limits ENABLE ROW LEVEL SECURITY;
-- no public policies; only edge functions (service role) write/read

-- 3. Drop redundant public-read SELECT policies on public buckets (CDN-accessible already)
DROP POLICY IF EXISTS "Public avatar access" ON storage.objects;
DROP POLICY IF EXISTS "Public cover access" ON storage.objects;
DROP POLICY IF EXISTS "Public read message-media" ON storage.objects;
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
DROP POLICY IF EXISTS "Public read status-media" ON storage.objects;
DROP POLICY IF EXISTS "Public status media access" ON storage.objects;
DROP POLICY IF EXISTS "Public theme access" ON storage.objects;

-- 4. Restrict EXECUTE on SECURITY DEFINER functions
-- Trigger-only functions: revoke from anon and authenticated
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.community_add_creator() FROM PUBLIC, anon, authenticated;

-- RLS-helper functions: revoke from anon (still callable by authenticated for RLS evaluation)
REVOKE EXECUTE ON FUNCTION public.is_community_admin(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_community_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_conversation_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.shares_conversation(uuid, uuid) FROM PUBLIC, anon;
