import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MessageData {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  content_type: string;
  media_url: string | null;
  status: string;
  deleted_by_sender: boolean;
  reply_to_id: string | null;
  forwarded_from_id: string | null;
  created_at: string;
  reactions: { user_id: string; emoji: string }[];
}

export function useMessages(conversationId: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    const { data: msgs } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_id, content, content_type, media_url, status, deleted_by_sender, reply_to_id, forwarded_from_id, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(50);

    if (!msgs) { setMessages([]); setLoading(false); return; }

    const msgIds = msgs.map(m => m.id);
    const { data: reactions } = await supabase
      .from('message_reactions')
      .select('message_id, user_id, emoji')
      .in('message_id', msgIds);

    const reactionMap: Record<string, { user_id: string; emoji: string }[]> = {};
    reactions?.forEach(r => {
      if (!reactionMap[r.message_id]) reactionMap[r.message_id] = [];
      reactionMap[r.message_id].push({ user_id: r.user_id, emoji: r.emoji });
    });

    setMessages(msgs.map(m => ({
      ...m,
      reactions: reactionMap[m.id] || [],
    })));
    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        const newMsg = payload.new as any;
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, { ...newMsg, reactions: [] }];
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        const updated = payload.new as any;
        setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, fetchMessages]);

  const sendMessage = async (content: string, contentType = 'text', mediaUrl?: string, replyToId?: string) => {
    if (!user) return;
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
      content_type: contentType,
      media_url: mediaUrl || null,
      reply_to_id: replyToId || null,
      status: 'sent',
    });
  };

  const forwardMessage = async (msg: MessageData, targetConvId: string) => {
    if (!user) return;
    await supabase.from('messages').insert({
      conversation_id: targetConvId,
      sender_id: user.id,
      content: msg.content,
      content_type: msg.content_type,
      media_url: msg.media_url,
      forwarded_from_id: msg.id,
      status: 'sent',
    });
  };

  const deleteForSelf = async (messageId: string) => {
    if (!user) return;
    await supabase
      .from('messages')
      .update({ deleted_by_sender: true })
      .eq('id', messageId)
      .eq('sender_id', user.id);
  };

  const addReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    await supabase.from('message_reactions').insert({
      message_id: messageId,
      user_id: user.id,
      emoji,
    });
    fetchMessages();
  };

  return { messages, loading, sendMessage, deleteForSelf, addReaction, forwardMessage };
}
