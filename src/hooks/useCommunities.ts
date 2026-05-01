import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Community {
  id: string;
  created_by: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  created_at: string;
}

export function useCommunities() {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: mems } = await supabase.from('community_members').select('community_id').eq('user_id', user.id);
    const ids = (mems || []).map(m => m.community_id);
    if (!ids.length) { setCommunities([]); setLoading(false); return; }
    const { data } = await supabase.from('communities').select('*').in('id', ids).order('updated_at', { ascending: false });
    setCommunities((data as Community[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const createCommunity = async (input: { name: string; description?: string }) => {
    if (!user) throw new Error('Not signed in');
    const { data, error } = await supabase.from('communities').insert({
      created_by: user.id,
      name: input.name,
      description: input.description || null,
    }).select().single();
    if (error) throw error;
    await load();
    return data as Community;
  };

  const linkGroup = async (communityId: string, conversationId: string) => {
    await supabase.from('community_groups').insert({ community_id: communityId, conversation_id: conversationId });
  };

  return { communities, loading, createCommunity, linkGroup, refresh: load };
}

export function useCommunityGroups(communityId: string | null) {
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const load = useCallback(async () => {
    if (!communityId) { setGroupIds([]); return; }
    const { data } = await supabase.from('community_groups').select('conversation_id').eq('community_id', communityId);
    setGroupIds((data || []).map(g => g.conversation_id));
  }, [communityId]);
  useEffect(() => { load(); }, [load]);
  return { groupIds, refresh: load };
}
