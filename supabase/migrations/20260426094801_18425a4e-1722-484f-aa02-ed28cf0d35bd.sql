-- WebRTC signaling table
CREATE TABLE public.call_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  signal_type text NOT NULL CHECK (signal_type IN ('offer','answer','ice','hangup','accept','decline')),
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_call_signals_call_id ON public.call_signals(call_id, created_at);

ALTER TABLE public.call_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants view signals"
ON public.call_signals FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.calls c
    WHERE c.id = call_signals.call_id
      AND (c.caller_id = auth.uid() OR c.callee_id = auth.uid())
  )
);

CREATE POLICY "Participants insert signals"
ON public.call_signals FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.calls c
    WHERE c.id = call_signals.call_id
      AND (c.caller_id = auth.uid() OR c.callee_id = auth.uid())
  )
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.call_signals;
ALTER TABLE public.call_signals REPLICA IDENTITY FULL;