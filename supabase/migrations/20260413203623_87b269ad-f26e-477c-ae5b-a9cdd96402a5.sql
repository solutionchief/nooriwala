
DROP POLICY "Authenticated users can add participants" ON public.conversation_participants;

CREATE POLICY "Conversation creators and members can add participants"
  ON public.conversation_participants FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR public.is_conversation_member(auth.uid(), conversation_id)
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND c.created_by = auth.uid()
    )
  );
