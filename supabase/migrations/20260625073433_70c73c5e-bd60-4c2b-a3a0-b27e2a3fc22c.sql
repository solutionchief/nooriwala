
-- Helper: is the user an admin of a conversation (group)?
CREATE OR REPLACE FUNCTION public.is_conversation_admin(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE user_id = _user_id
      AND conversation_id = _conversation_id
      AND role = 'admin'
  )
$$;
REVOKE ALL ON FUNCTION public.is_conversation_admin(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_conversation_admin(uuid, uuid) TO authenticated;

-- Allow group admins (in addition to creator/self-join) to add participants
DROP POLICY IF EXISTS "Self join or creator add" ON public.conversation_participants;
CREATE POLICY "Self join, creator or admin add" ON public.conversation_participants
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR (
      (
        EXISTS (
          SELECT 1 FROM public.conversations c
          WHERE c.id = conversation_participants.conversation_id
            AND c.created_by = auth.uid()
        )
        OR public.is_conversation_admin(auth.uid(), conversation_id)
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.blocked_users b
        WHERE b.blocker_id = conversation_participants.user_id
          AND b.blocked_id = auth.uid()
        )
    )
  );

-- Allow self-leave, plus group admins/creators to remove other members
DROP POLICY IF EXISTS "Self leave or admin remove participant" ON public.conversation_participants;
CREATE POLICY "Self leave or admin remove participant" ON public.conversation_participants
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR public.is_conversation_admin(auth.uid(), conversation_id)
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_participants.conversation_id
        AND c.created_by = auth.uid()
    )
  );

-- Allow group admins to update a participant's role (promote/demote)
DROP POLICY IF EXISTS "Admins manage participant role" ON public.conversation_participants;
CREATE POLICY "Admins manage participant role" ON public.conversation_participants
  FOR UPDATE
  USING (
    public.is_conversation_admin(auth.uid(), conversation_id)
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_participants.conversation_id
        AND c.created_by = auth.uid()
    )
    OR auth.uid() = user_id
  )
  WITH CHECK (
    public.is_conversation_admin(auth.uid(), conversation_id)
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_participants.conversation_id
        AND c.created_by = auth.uid()
    )
    OR auth.uid() = user_id
  );
