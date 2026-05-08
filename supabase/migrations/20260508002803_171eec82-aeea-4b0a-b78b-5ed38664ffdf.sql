-- 1. PROFILES: replace permissive SELECT with self + shared-conversation visibility
DROP POLICY IF EXISTS "Anyone authenticated can view profiles" ON public.profiles;

CREATE OR REPLACE FUNCTION public.shares_conversation(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants p1
    JOIN public.conversation_participants p2
      ON p1.conversation_id = p2.conversation_id
    WHERE p1.user_id = _a AND p2.user_id = _b
  );
$$;

REVOKE EXECUTE ON FUNCTION public.shares_conversation(uuid, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.shares_conversation(uuid, uuid) TO authenticated;

CREATE POLICY "View self or shared-conversation profiles"
ON public.profiles
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.shares_conversation(auth.uid(), user_id)
);

-- 2. STATUSES: enforce privacy column
DROP POLICY IF EXISTS "Anyone authenticated can view statuses" ON public.statuses;

CREATE POLICY "View own or permitted statuses"
ON public.statuses
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR (privacy = 'everyone' AND public.shares_conversation(auth.uid(), user_id))
  OR privacy = 'everyone'
);

-- 3. MESSAGE-MEDIA bucket: make private + restrict
UPDATE storage.buckets SET public = false WHERE id = 'message-media';

DROP POLICY IF EXISTS "Anyone can view message media" ON storage.objects;
DROP POLICY IF EXISTS "Public can read message-media" ON storage.objects;
DROP POLICY IF EXISTS "message-media public read" ON storage.objects;

CREATE POLICY "Authenticated read message-media"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'message-media');

-- 4. STATUS-MEDIA bucket: require auth
DROP POLICY IF EXISTS "Anyone can view status media" ON storage.objects;
DROP POLICY IF EXISTS "Public can read status-media" ON storage.objects;

CREATE POLICY "Authenticated read status-media"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'status-media');

-- 5. CONVERSATION_PARTICIPANTS: tighten INSERT, add DELETE
DROP POLICY IF EXISTS "Conversation creators and members can add participants" ON public.conversation_participants;

CREATE POLICY "Self join or creator add"
ON public.conversation_participants
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id AND c.created_by = auth.uid()
  )
);

CREATE POLICY "Self leave participation"
ON public.conversation_participants
FOR DELETE TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id AND c.created_by = auth.uid()
  )
);

-- 6. MESSAGE_REACTIONS: enforce conversation membership on INSERT
DROP POLICY IF EXISTS "Users can add reactions" ON public.message_reactions;

CREATE POLICY "Members can add reactions"
ON public.message_reactions
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = message_id
      AND public.is_conversation_member(auth.uid(), m.conversation_id)
  )
);

-- 7. Revoke EXECUTE on internal SECURITY DEFINER helpers from public/anon
REVOKE EXECUTE ON FUNCTION public.is_conversation_member(uuid, uuid) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.is_community_member(uuid, uuid)   FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.is_community_admin(uuid, uuid)    FROM public, anon;
GRANT  EXECUTE ON FUNCTION public.is_conversation_member(uuid, uuid) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.is_community_member(uuid, uuid)    TO authenticated;
GRANT  EXECUTE ON FUNCTION public.is_community_admin(uuid, uuid)     TO authenticated;