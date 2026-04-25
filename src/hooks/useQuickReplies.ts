import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface QuickReply {
  id: string;
  shortcut: string;
  message: string;
}

export function useQuickReplies() {
  const { user } = useAuth();
  const [replies, setReplies] = useState<QuickReply[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('quick_replies')
      .select('id, shortcut, message')
      .eq('user_id', user.id)
      .order('shortcut');
    setReplies((data as any) || []);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const add = async (shortcut: string, message: string) => {
    if (!user) return;
    await supabase.from('quick_replies').insert({ user_id: user.id, shortcut, message });
    load();
  };
  const remove = async (id: string) => {
    await supabase.from('quick_replies').delete().eq('id', id);
    load();
  };

  return { replies, add, remove };
}
