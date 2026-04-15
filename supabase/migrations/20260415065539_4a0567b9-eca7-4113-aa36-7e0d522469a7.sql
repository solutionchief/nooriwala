
-- Blocked users table
CREATE TABLE public.blocked_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL,
  blocked_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own blocks" ON public.blocked_users FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "Users can block others" ON public.blocked_users FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users can unblock" ON public.blocked_users FOR DELETE USING (auth.uid() = blocker_id);

-- Reports table
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  reported_user_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view their own reports" ON public.reports FOR SELECT USING (auth.uid() = reporter_id);

-- Typing indicators (ephemeral)
CREATE TABLE public.typing_indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_typing BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view typing" ON public.typing_indicators FOR SELECT
  USING (is_conversation_member(auth.uid(), conversation_id));
CREATE POLICY "Users can update their own typing" ON public.typing_indicators FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_conversation_member(auth.uid(), conversation_id));
CREATE POLICY "Users can modify their typing" ON public.typing_indicators FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their typing" ON public.typing_indicators FOR DELETE
  USING (auth.uid() = user_id);

-- Add forwarded_from_id to messages
ALTER TABLE public.messages ADD COLUMN forwarded_from_id UUID REFERENCES public.messages(id);

-- Add disappearing_duration to conversation_participants
ALTER TABLE public.conversation_participants ADD COLUMN disappearing_duration TEXT DEFAULT NULL;

-- Add role column for group admin support
ALTER TABLE public.conversation_participants ADD COLUMN role TEXT NOT NULL DEFAULT 'member';

-- Allow conversation members to update conversation details (for groups)
CREATE POLICY "Members can update group conversations" ON public.conversations
  FOR UPDATE USING (is_conversation_member(auth.uid(), id));

-- Enable realtime for typing indicators
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;

-- Enable realtime for statuses
ALTER PUBLICATION supabase_realtime ADD TABLE public.statuses;

-- Message media bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('message-media', 'message-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Auth users can upload message media" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'message-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Anyone can view message media" ON storage.objects FOR SELECT
  USING (bucket_id = 'message-media');
