import { supabase } from '@/integrations/supabase/client';

export interface CallMetric {
  callId: string;
  userId: string;
  role: 'caller' | 'callee';
  callType: 'audio' | 'video';
  ringMs?: number;
  connectMs?: number;
  durationMs?: number;
  endReason?: string;
  failureReason?: string;
}

/** Fire-and-forget anonymized metric recording. Never throws. */
export async function recordCallMetric(m: CallMetric): Promise<void> {
  try {
    await supabase.from('call_metrics').insert({
      call_id: m.callId,
      user_id: m.userId,
      role: m.role,
      call_type: m.callType,
      ring_ms: m.ringMs ?? null,
      connect_ms: m.connectMs ?? null,
      duration_ms: m.durationMs ?? null,
      end_reason: m.endReason ?? null,
      failure_reason: m.failureReason ?? null,
    });
  } catch (e) {
    console.warn('[metrics] failed to record', e);
  }
}
