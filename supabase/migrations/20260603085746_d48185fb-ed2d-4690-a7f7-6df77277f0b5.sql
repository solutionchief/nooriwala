-- Add per-user "show deleted messages" preference synced to backend
ALTER TABLE public.conversation_participants
  ADD COLUMN IF NOT EXISTS show_deleted_messages boolean NOT NULL DEFAULT false;

-- Allow service role to insert security events from edge functions
GRANT INSERT ON public.security_events TO service_role;