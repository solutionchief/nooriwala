import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface StatusData {
  id: string;
  user_id: string;
  content: string | null;
  content_type: string;
  media_url: string | null;
  background_color: string | null;
  created_at: string;
  expires_at: string;
  privacy: string;
  user_display_name: string;
  user_avatar_url: string | null;
  user_is_online: boolean;
  viewer_count: number;
}

export function useStatuses() {
  const { user } = useAuth();
  const [statuses, setStatuses] = useState<StatusData[]>([]);
  const [myStatuses, setMyStatuses] = useState<StatusData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStatuses = useCallback(async () => {
    if (!user) return;

    // Get non-expired statuses
    const { data: allStatuses } = await supabase
      .from('statuses')
      .select('*')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (!allStatuses?.length) {
      setStatuses([]);
      setMyStatuses([]);
      setLoading(false);
      return;
    }

    // Get profiles for status users
    const userIds = [...new Set(allStatuses.map(s => s.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url, is_online')
      .in('user_id', userIds);

    const profileMap: Record<string, any> = {};
    profiles?.forEach(p => { profileMap[p.user_id] = p; });

    // Get viewer counts
    const statusIds = allStatuses.map(s => s.id);
    const { data: viewers } = await supabase
      .from('status_viewers')
      .select('status_id')
      .in('status_id', statusIds);

    const viewerCounts: Record<string, number> = {};
    viewers?.forEach(v => {
      viewerCounts[v.status_id] = (viewerCounts[v.status_id] || 0) + 1;
    });

    const mapped: StatusData[] = allStatuses.map(s => ({
      id: s.id,
      user_id: s.user_id,
      content: s.content,
      content_type: s.content_type,
      media_url: s.media_url,
      background_color: s.background_color,
      created_at: s.created_at,
      expires_at: s.expires_at,
      privacy: s.privacy,
      user_display_name: profileMap[s.user_id]?.display_name || 'Unknown',
      user_avatar_url: profileMap[s.user_id]?.avatar_url || null,
      user_is_online: profileMap[s.user_id]?.is_online || false,
      viewer_count: viewerCounts[s.id] || 0,
    }));

    setMyStatuses(mapped.filter(s => s.user_id === user.id));
    setStatuses(mapped.filter(s => s.user_id !== user.id));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchStatuses();

    const channel = supabase
      .channel('statuses-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'statuses' }, () => {
        fetchStatuses();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchStatuses]);

  const createStatus = async (content: string, contentType = 'text', mediaFile?: File, bgColor?: string) => {
    if (!user) return;

    let mediaUrl: string | null = null;
    if (mediaFile) {
      const ext = mediaFile.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      await supabase.storage.from('status-media').upload(path, mediaFile);
      const { data: { publicUrl } } = supabase.storage.from('status-media').getPublicUrl(path);
      mediaUrl = publicUrl;
    }

    await supabase.from('statuses').insert({
      user_id: user.id,
      content,
      content_type: contentType,
      media_url: mediaUrl,
      background_color: bgColor || null,
    });

    fetchStatuses();
  };

  const viewStatus = async (statusId: string) => {
    if (!user) return;
    await supabase.from('status_viewers').insert({
      status_id: statusId,
      viewer_id: user.id,
    });
  };

  const deleteStatus = async (statusId: string) => {
    if (!user) return;
    await supabase.from('statuses').delete().eq('id', statusId).eq('user_id', user.id);
    fetchStatuses();
  };

  return { statuses, myStatuses, loading, createStatus, viewStatus, deleteStatus };
}
