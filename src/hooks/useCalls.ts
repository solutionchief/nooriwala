import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CallRecord {
  id: string;
  conversation_id: string | null;
  caller_id: string;
  callee_id: string;
  call_type: 'audio' | 'video';
  status: 'ringing' | 'ongoing' | 'completed' | 'missed' | 'declined' | 'canceled';
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  other_user_id: string;
  other_name: string;
  other_avatar: string | null;
  direction: 'incoming' | 'outgoing';
}

export interface IncomingCall {
  callId: string;
  callerId: string;
  callerName: string;
  callerAvatar: string | null;
  callType: 'audio' | 'video';
  conversationId: string | null;
}

export function useCalls() {
  const { user } = useAuth();
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const incomingCallRef = useRef<IncomingCall | null>(null);
  useEffect(() => { incomingCallRef.current = incomingCall; }, [incomingCall]);

  const fetch = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('calls')
      .select('*')
      .or(`caller_id.eq.${user.id},callee_id.eq.${user.id}`)
      .order('started_at', { ascending: false })
      .limit(100);

    if (!data) { setCalls([]); setLoading(false); return; }

    const otherIds = [...new Set(data.map(c => c.caller_id === user.id ? c.callee_id : c.caller_id))];
    const profMap: Record<string, any> = {};
    if (otherIds.length) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', otherIds);
      profs?.forEach(p => { profMap[p.user_id] = p; });
    }

    setCalls(data.map(c => {
      const otherId = c.caller_id === user.id ? c.callee_id : c.caller_id;
      return {
        ...c,
        call_type: c.call_type as 'audio' | 'video',
        status: c.status as CallRecord['status'],
        other_user_id: otherId,
        other_name: profMap[otherId]?.display_name || 'Unknown',
        other_avatar: profMap[otherId]?.avatar_url || null,
        direction: c.caller_id === user.id ? 'outgoing' as const : 'incoming' as const,
      };
    }));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetch();
    if (!user) return;
    const channel = supabase
      .channel(`calls-feed-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calls' }, async (payload) => {
        // Detect a new incoming ringing call for this user
        if (payload.eventType === 'INSERT') {
          const row: any = payload.new;
          if (row.callee_id === user.id && row.status === 'ringing') {
            const { data: prof } = await supabase
              .from('profiles')
              .select('display_name, avatar_url')
              .eq('user_id', row.caller_id)
              .maybeSingle();
            setIncomingCall({
              callId: row.id,
              callerId: row.caller_id,
              callerName: prof?.display_name || 'Unknown',
              callerAvatar: prof?.avatar_url || null,
              callType: row.call_type,
              conversationId: row.conversation_id,
            });
          }
        }
        if (payload.eventType === 'UPDATE') {
          const row: any = payload.new;
          // If our incoming call was canceled / answered elsewhere, dismiss
          const current = incomingCallRef.current;
          if (current && row.id === current.callId && row.status !== 'ringing') {
            setIncomingCall(null);
          }
        }
        fetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, fetch]);

  const startCall = async (calleeId: string, callType: 'audio' | 'video', conversationId?: string) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('calls')
      .insert({
        caller_id: user.id,
        callee_id: calleeId,
        call_type: callType,
        status: 'ringing',
        conversation_id: conversationId || null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  };

  const updateCallStatus = async (callId: string, status: CallRecord['status']) => {
    await supabase.from('calls').update({ status }).eq('id', callId);
  };

  const endCall = async (callId: string, status: CallRecord['status'], durationSeconds = 0) => {
    await supabase
      .from('calls')
      .update({ status, ended_at: new Date().toISOString(), duration_seconds: durationSeconds })
      .eq('id', callId);
  };

  const dismissIncoming = () => setIncomingCall(null);

  return { calls, loading, startCall, endCall, updateCallStatus, refetch: fetch, incomingCall, dismissIncoming };
}
