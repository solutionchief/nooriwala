-- Audit trail for permanent-message rule: log every attempt to delete a message.
-- Receiver visibility (deleted_by_sender flag) remains the only public signal; this table
-- captures the timestamp + who tried + what was attempted for QA / abuse review.

CREATE TABLE public.message_delete_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL,
  conversation_id UUID NOT NULL,
  attempted_by UUID NOT NULL,
  attempt_type TEXT NOT NULL DEFAULT 'delete_for_self',
  prior_content TEXT,
  prior_content_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_message_delete_audit_message ON public.message_delete_audit(message_id);
CREATE INDEX idx_message_delete_audit_user ON public.message_delete_audit(attempted_by);

ALTER TABLE public.message_delete_audit ENABLE ROW LEVEL SECURITY;

-- The user who attempted the delete can see their own audit entries (for transparency).
CREATE POLICY "Owner views own delete audits"
ON public.message_delete_audit
FOR SELECT
TO authenticated
USING (auth.uid() = attempted_by);

-- Only the sender of the message can write an audit row about their own message.
CREATE POLICY "Sender writes audit for own message"
ON public.message_delete_audit
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = attempted_by
  AND EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = message_id AND m.sender_id = auth.uid()
  )
);
-- No UPDATE/DELETE policies — audit rows are immutable.