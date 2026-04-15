import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useBlockedUsers() {
  const { user } = useAuth();
  const [blockedIds, setBlockedIds] = useState<string[]>([]);

  const fetchBlocked = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('blocked_users')
      .select('blocked_id')
      .eq('blocker_id', user.id);
    setBlockedIds(data?.map(b => b.blocked_id) || []);
  }, [user]);

  useEffect(() => { fetchBlocked(); }, [fetchBlocked]);

  const blockUser = async (blockedId: string) => {
    if (!user) return;
    await supabase.from('blocked_users').insert({ blocker_id: user.id, blocked_id: blockedId });
    fetchBlocked();
  };

  const unblockUser = async (blockedId: string) => {
    if (!user) return;
    await supabase.from('blocked_users').delete().eq('blocker_id', user.id).eq('blocked_id', blockedId);
    fetchBlocked();
  };

  const reportUser = async (reportedId: string, reason: string, details?: string) => {
    if (!user) return;
    await supabase.from('reports').insert({
      reporter_id: user.id,
      reported_user_id: reportedId,
      reason,
      details,
    });
  };

  const isBlocked = (userId: string) => blockedIds.includes(userId);

  return { blockedIds, blockUser, unblockUser, reportUser, isBlocked };
}
