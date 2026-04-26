CREATE TABLE public.call_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('caller','callee')),
  call_type text NOT NULL CHECK (call_type IN ('audio','video')),
  ring_ms integer,
  connect_ms integer,
  duration_ms integer,
  end_reason text,
  failure_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_call_metrics_user ON public.call_metrics(user_id, created_at DESC);

ALTER TABLE public.call_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner view metrics" ON public.call_metrics
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Owner insert metrics" ON public.call_metrics
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);