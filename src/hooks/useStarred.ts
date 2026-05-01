import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface StarredItem {
  id: string;
  message_id: string;
  conversation_id: string;
  created_at: string;
  content: string | null;
  content_type: string;
  media_url: string | null;
  sender_id: string;
  sender_name: string;
  sender_avatar: string | null;
  conversation_name: string;
}

export function useStarred() {
  const { user } = useAuth();
  const [items, setItems] = useState<StarredItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: stars } = await supabase
      .from('starred_messages')
      .select('id, message_id, conversation_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!stars?.length) { setItems([]); setStarredIds(new Set()); setLoading(false); return; }

    const msgIds = stars.map(s => s.message_id);
    const convIds = [...new Set(stars.map(s => s.conversation_id))];
    const [{ data: msgs }, { data: convs }] = await Promise.all([
      supabase.from('messages').select('id, content, content_type, media_url, sender_id').in('id', msgIds),
      supabase.from('conversations').select('id, name, type').in('id', convIds),
    ]);
    const senderIds = [...new Set((msgs || []).map(m => m.sender_id))];
    const { data: profs } = await supabase.from('profiles').select('user_id, display_name, avatar_url').in('user_id', senderIds);
    const profMap: Record<string, any> = {};
    profs?.forEach(p => { profMap[p.user_id] = p; });
    const msgMap: Record<string, any> = {};
    msgs?.forEach(m => { msgMap[m.id] = m; });
    const convMap: Record<string, any> = {};
    convs?.forEach(c => { convMap[c.id] = c; });

    const result: StarredItem[] = stars.map(s => {
      const m = msgMap[s.message_id] || {};
      const p = profMap[m.sender_id] || {};
      const c = convMap[s.conversation_id] || {};
      return {
        id: s.id,
        message_id: s.message_id,
        conversation_id: s.conversation_id,
        created_at: s.created_at,
        content: m.content || null,
        content_type: m.content_type || 'text',
        media_url: m.media_url || null,
        sender_id: m.sender_id || '',
        sender_name: p.display_name || 'User',
        sender_avatar: p.avatar_url || null,
        conversation_name: c.name || p.display_name || 'Chat',
      };
    });
    setItems(result);
    setStarredIds(new Set(stars.map(s => s.message_id)));
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const toggleStar = async (messageId: string, conversationId: string) => {
    if (!user) return;
    if (starredIds.has(messageId)) {
      await supabase.from('starred_messages').delete().eq('user_id', user.id).eq('message_id', messageId);
    } else {
      await supabase.from('starred_messages').insert({ user_id: user.id, message_id: messageId, conversation_id: conversationId });
    }
    load();
  };

  return { items, loading, starredIds, toggleStar, refresh: load };
}
