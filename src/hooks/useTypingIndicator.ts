import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useTypingIndicator(conversationId: string) {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const channel = supabase
      .channel(`typing-${conversationId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'typing_indicators',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        const row = payload.new as any;
        if (!row || row.user_id === user?.id) return;
        setTypingUsers(prev => {
          if (row.is_typing && !prev.includes(row.user_id)) return [...prev, row.user_id];
          if (!row.is_typing) return prev.filter(id => id !== row.user_id);
          return prev;
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, user]);

  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!user) return;
    await supabase.from('typing_indicators').upsert({
      conversation_id: conversationId,
      user_id: user.id,
      is_typing: isTyping,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'conversation_id,user_id' });
  }, [conversationId, user]);

  const onType = useCallback(() => {
    setTyping(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setTyping(false), 3000);
  }, [setTyping]);

  const stopTyping = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setTyping(false);
  }, [setTyping]);

  return { typingUsers, onType, stopTyping };
}
