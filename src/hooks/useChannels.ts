import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Channel {
  id: string;
  owner_id: string;
  handle: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  follower_count: number;
  created_at: string;
}

export interface ChannelPost {
  id: string;
  channel_id: string;
  author_id: string;
  content: string | null;
  content_type: 'text' | 'image' | 'video';
  media_url: string | null;
  created_at: string;
}

export function useChannels() {
  const { user } = useAuth();
  const [myChannels, setMyChannels] = useState<Channel[]>([]);
  const [followed, setFollowed] = useState<Channel[]>([]);
  const [discover, setDiscover] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: owned }, { data: follows }, { data: all }] = await Promise.all([
      supabase.from('channels').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
      supabase.from('channel_followers').select('channel_id').eq('user_id', user.id),
      supabase.from('channels').select('*').order('follower_count', { ascending: false }).limit(50),
    ]);
    const followedIds = new Set((follows || []).map(f => f.channel_id));
    setMyChannels((owned as Channel[]) || []);
    setFollowed(((all as Channel[]) || []).filter(c => followedIds.has(c.id)));
    setDiscover(((all as Channel[]) || []).filter(c => !followedIds.has(c.id) && c.owner_id !== user.id));
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const checkHandle = async (handle: string): Promise<boolean> => {
    const { data } = await supabase.from('channels').select('id').eq('handle', handle).maybeSingle();
    return !data;
  };

  const createChannel = async (input: { handle: string; name: string; description?: string; avatar_url?: string }) => {
    if (!user) throw new Error('Not signed in');
    const { data, error } = await supabase.from('channels').insert({
      owner_id: user.id,
      handle: input.handle.toLowerCase().replace(/[^a-z0-9_]/g, ''),
      name: input.name,
      description: input.description || null,
      avatar_url: input.avatar_url || null,
    }).select().single();
    if (error) throw error;
    await load();
    return data as Channel;
  };

  const follow = async (channelId: string) => {
    if (!user) return;
    await supabase.from('channel_followers').insert({ channel_id: channelId, user_id: user.id });
    load();
  };
  const unfollow = async (channelId: string) => {
    if (!user) return;
    await supabase.from('channel_followers').delete().eq('channel_id', channelId).eq('user_id', user.id);
    load();
  };

  return { myChannels, followed, discover, loading, checkHandle, createChannel, follow, unfollow, refresh: load };
}

export function useChannelPosts(channelId: string | null) {
  const [posts, setPosts] = useState<ChannelPost[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!channelId) { setPosts([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase.from('channel_posts').select('*').eq('channel_id', channelId).order('created_at', { ascending: false }).limit(50);
    setPosts((data as ChannelPost[]) || []);
    setLoading(false);
  }, [channelId]);

  useEffect(() => { load(); }, [load]);

  return { posts, loading, refresh: load };
}

export function useFollowedFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<(ChannelPost & { channel?: Channel })[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: follows } = await supabase.from('channel_followers').select('channel_id').eq('user_id', user.id);
    const ids = (follows || []).map(f => f.channel_id);
    if (!ids.length) { setPosts([]); setLoading(false); return; }
    const [{ data: ps }, { data: cs }] = await Promise.all([
      supabase.from('channel_posts').select('*').in('channel_id', ids).order('created_at', { ascending: false }).limit(100),
      supabase.from('channels').select('*').in('id', ids),
    ]);
    const cMap: Record<string, Channel> = {};
    cs?.forEach(c => { cMap[c.id] = c as Channel; });
    setPosts(((ps as ChannelPost[]) || []).map(p => ({ ...p, channel: cMap[p.channel_id] })));
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  return { posts, loading, refresh: load };
}
