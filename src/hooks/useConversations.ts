import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ConversationWithDetails {
  id: string;
  type: string;
  name: string | null;
  avatar_url: string | null;
  participant_user_id: string;
  participant_name: string;
  participant_avatar: string | null;
  participant_online: boolean;
  participant_last_seen: string | null;
  is_pinned: boolean;
  custom_theme_url: string | null;
  unread_count: number;
  is_archived: boolean;
  is_muted: boolean;
  marked_unread: boolean;
  last_message_content: string | null;
  last_message_time: string | null;
  last_message_sender: string | null;
  updated_at: string;
}

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    // Get user's conversation participations
    const { data: participations } = await supabase
      .from('conversation_participants')
      .select('conversation_id, is_pinned, custom_theme_url, unread_count, is_archived')
      .eq('user_id', user.id);

    if (!participations?.length) { setConversations([]); setLoading(false); return; }

    const convIds = participations.map(p => p.conversation_id);

    // Get conversations
    const { data: convs } = await supabase
      .from('conversations')
      .select('*')
      .in('id', convIds);

    // Get other participants
    const { data: otherParticipants } = await supabase
      .from('conversation_participants')
      .select('conversation_id, user_id')
      .in('conversation_id', convIds)
      .neq('user_id', user.id);

    const otherUserIds = [...new Set(otherParticipants?.map(p => p.user_id) || [])];
    
    let profiles: Record<string, any> = {};
    if (otherUserIds.length) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, is_online, last_seen')
        .in('user_id', otherUserIds);
      profs?.forEach(p => { profiles[p.user_id] = p; });
    }

    // Get last messages (one per conversation) - bandwidth-optimized: only fetch needed fields
    const { data: lastMsgs } = await supabase
      .from('messages')
      .select('conversation_id, content, created_at, sender_id')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: false });

    const lastMsgMap: Record<string, any> = {};
    lastMsgs?.forEach(m => {
      if (!lastMsgMap[m.conversation_id]) lastMsgMap[m.conversation_id] = m;
    });

    const result: ConversationWithDetails[] = [];
    for (const conv of (convs || [])) {
      const part = participations.find(p => p.conversation_id === conv.id)!;
      const otherPart = otherParticipants?.find(p => p.conversation_id === conv.id);
      const otherProfile = otherPart ? profiles[otherPart.user_id] : null;
      const lastMsg = lastMsgMap[conv.id];

      result.push({
        id: conv.id,
        type: conv.type,
        name: conv.name,
        avatar_url: conv.avatar_url,
        participant_user_id: otherPart?.user_id || '',
        participant_name: otherProfile?.display_name || 'Unknown',
        participant_avatar: otherProfile?.avatar_url || null,
        participant_online: otherProfile?.is_online || false,
        participant_last_seen: otherProfile?.last_seen || null,
        is_pinned: part.is_pinned,
        custom_theme_url: part.custom_theme_url,
        unread_count: part.unread_count,
        is_archived: (part as any).is_archived ?? false,
        last_message_content: lastMsg?.content || null,
        last_message_time: lastMsg?.created_at || conv.updated_at,
        last_message_sender: lastMsg?.sender_id || null,
        updated_at: conv.updated_at,
      });
    }

    // Sort: pinned first, then by last message time
    result.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return new Date(b.last_message_time || 0).getTime() - new Date(a.last_message_time || 0).getTime();
    });

    setConversations(result);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchConversations();

    // Listen for realtime changes on conversation_participants
    if (!user) return;
    const channel = supabase
      .channel('conv-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_participants', filter: `user_id=eq.${user.id}` }, () => {
        fetchConversations();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchConversations, user]);

  const togglePin = async (conversationId: string) => {
    if (!user) return;
    const conv = conversations.find(c => c.id === conversationId);
    if (!conv) return;
    
    if (!conv.is_pinned) {
      const pinnedCount = conversations.filter(c => c.is_pinned).length;
      if (pinnedCount >= 5) throw new Error('Maximum 5 pinned conversations allowed');
    }

    await supabase
      .from('conversation_participants')
      .update({ is_pinned: !conv.is_pinned })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);

    fetchConversations();
  };

  const setChatTheme = async (conversationId: string, file: File | null) => {
    if (!user) return;
    let url: string | null = null;

    if (file) {
      const path = `${user.id}/${conversationId}.${file.name.split('.').pop()}`;
      await supabase.storage.from('chat-themes').upload(path, file, { upsert: true });
      const { data: { publicUrl } } = supabase.storage.from('chat-themes').getPublicUrl(path);
      url = publicUrl;
    }

    await supabase
      .from('conversation_participants')
      .update({ custom_theme_url: url })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);

    fetchConversations();
  };

  const createConversation = async (otherUserId: string) => {
    if (!user) return null;

    // Check if conversation already exists
    const { data: existing } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);

    if (existing?.length) {
      const { data: otherExisting } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', otherUserId)
        .in('conversation_id', existing.map(e => e.conversation_id));

      if (otherExisting?.length) {
        return otherExisting[0].conversation_id;
      }
    }

    const { data: conv } = await supabase
      .from('conversations')
      .insert({ type: 'direct', created_by: user.id })
      .select()
      .single();

    if (conv) {
      await supabase.from('conversation_participants').insert([
        { conversation_id: conv.id, user_id: user.id },
        { conversation_id: conv.id, user_id: otherUserId },
      ]);
      fetchConversations();
      return conv.id;
    }
    return null;
  };

  const toggleArchive = async (conversationId: string) => {
    if (!user) return;
    const conv = conversations.find(c => c.id === conversationId);
    if (!conv) return;
    await supabase
      .from('conversation_participants')
      .update({ is_archived: !conv.is_archived } as any)
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);
    fetchConversations();
  };

  return { conversations, loading, fetchConversations, togglePin, toggleArchive, setChatTheme, createConversation };
}
