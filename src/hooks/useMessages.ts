import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { enqueue, flush, isOnline } from '@/lib/outbox';

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

    const hiddenKey = `nw-hidden-${user?.id}-${conversationId}`;
    const hidden = new Set<string>(JSON.parse(localStorage.getItem(hiddenKey) || '[]'));
    setMessages(msgs.filter(m => !hidden.has(m.id)).map(m => ({
      ...m,
      reactions: reactionMap[m.id] || [],
    })));
    setLoading(false);
  }, [conversationId, user?.id]);

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
    const client_id = `${user.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    // Always enqueue first — guarantees delivery if connection drops mid-send.
    await enqueue({
      client_id,
      user_id: user.id,
      conversation_id: conversationId,
      content,
      content_type: contentType,
      media_url: mediaUrl || null,
      reply_to_id: replyToId || null,
      created_at: new Date().toISOString(),
    });
    if (isOnline()) flush();
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

  const logAudit = async (messageId: string, target: MessageData | undefined, type: 'delete_for_self' | 'delete_for_everyone') => {
    try {
      await supabase.from('message_delete_audit').insert({
        message_id: messageId,
        conversation_id: conversationId,
        attempted_by: user!.id,
        attempt_type: type,
        prior_content: target?.content ?? null,
        prior_content_type: target?.content_type ?? null,
      });
    } catch (e) {
      console.warn('[audit] failed to log delete attempt', e);
    }
  };

  const deleteForSelf = async (messageId: string) => {
    if (!user) return;
    const target = messages.find(m => m.id === messageId);
    // Hide locally for this user only — receiver continues to see the message.
    const key = `nw-hidden-${user.id}-${conversationId}`;
    const hidden: string[] = JSON.parse(localStorage.getItem(key) || '[]');
    if (!hidden.includes(messageId)) {
      hidden.push(messageId);
      localStorage.setItem(key, JSON.stringify(hidden));
    }
    setMessages(prev => prev.filter(m => m.id !== messageId));
    await logAudit(messageId, target, 'delete_for_self');
  };

  // Per Noori Wala policy: senders may attempt "delete for everyone", but if the
  // receiver has already received the message, the receiver continues to see it.
  // We flip deleted_by_sender so the sender's UI hides it; the receiver's UI keeps
  // showing the original content. Every attempt is audited.
  const deleteForEveryone = async (messageId: string) => {
    if (!user) return;
    const target = messages.find(m => m.id === messageId);
    await supabase
      .from('messages')
      .update({ deleted_by_sender: true })
      .eq('id', messageId)
      .eq('sender_id', user.id);
    await logAudit(messageId, target, 'delete_for_everyone');
  };

  // Send media that was already uploaded (e.g. by CameraCaptureScreen) to
  // an arbitrary conversation by id. Used by the camera→chat attach flow.
  const sendCapturedMediaTo = async (
    targetConvId: string,
    mediaUrl: string,
    type: 'image' | 'video',
    caption?: string,
  ) => {
    if (!user) return;
    await supabase.from('messages').insert({
      conversation_id: targetConvId,
      sender_id: user.id,
      content: caption || null,
      content_type: type,
      media_url: mediaUrl,
      status: 'sent',
    });
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

  return { messages, loading, sendMessage, deleteForSelf, deleteForEveryone, addReaction, forwardMessage, sendCapturedMediaTo };
}
