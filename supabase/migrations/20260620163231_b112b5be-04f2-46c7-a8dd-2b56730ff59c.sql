
-- 1. Statuses: remove bare 'everyone' OR branch
DROP POLICY IF EXISTS "View own or permitted statuses" ON public.statuses;
CREATE POLICY "View own or permitted statuses" ON public.statuses
  FOR SELECT USING (
    auth.uid() = user_id
    OR (privacy = 'everyone'::text AND public.shares_conversation(auth.uid(), user_id))
  );

-- 2. Messages: stricter UPDATE — must still be a conversation member, and cannot reassign sender/conversation
DROP POLICY IF EXISTS "Senders can mark their own messages as deleted" ON public.messages;
CREATE POLICY "Senders can mark their own messages as deleted" ON public.messages
  FOR UPDATE
  USING (auth.uid() = sender_id AND public.is_conversation_member(auth.uid(), conversation_id))
  WITH CHECK (auth.uid() = sender_id AND public.is_conversation_member(auth.uid(), conversation_id));

-- 3. Conversation participants: creators can't add users who blocked them
DROP POLICY IF EXISTS "Self join or creator add" ON public.conversation_participants;
CREATE POLICY "Self join or creator add" ON public.conversation_participants
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR (
      EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = conversation_participants.conversation_id
          AND c.created_by = auth.uid()
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.blocked_users b
        WHERE b.blocker_id = conversation_participants.user_id
          AND b.blocked_id = auth.uid()
      )
    )
  );

-- 4. Profiles: restrict phone and 2FA fields to owner only via column privileges
REVOKE SELECT (phone, two_factor_email, two_factor_enabled) ON public.profiles FROM anon, authenticated, PUBLIC;

-- Self-only access function for sensitive profile fields
CREATE OR REPLACE FUNCTION public.get_my_private_profile()
RETURNS TABLE(phone text, two_factor_email text, two_factor_enabled boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT phone, two_factor_email, two_factor_enabled
  FROM public.profiles
  WHERE user_id = auth.uid()
$$;
REVOKE ALL ON FUNCTION public.get_my_private_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_private_profile() TO authenticated;

-- 5. otp_rate_limits: add explicit deny-all policy so linter is satisfied (service role bypasses RLS)
DROP POLICY IF EXISTS "No client access" ON public.otp_rate_limits;
CREATE POLICY "No client access" ON public.otp_rate_limits FOR ALL TO authenticated, anon USING (false) WITH CHECK (false);
