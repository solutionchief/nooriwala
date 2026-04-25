import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Label {
  id: string;
  name: string;
  color: string;
}
export interface ConvLabel {
  id: string;
  conversation_id: string;
  label_id: string;
}

export function useLabels() {
  const { user } = useAuth();
  const [labels, setLabels] = useState<Label[]>([]);
  const [convLabels, setConvLabels] = useState<ConvLabel[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    const [{ data: l }, { data: cl }] = await Promise.all([
      supabase.from('chat_labels').select('id, name, color').eq('user_id', user.id),
      supabase.from('conversation_labels').select('id, conversation_id, label_id').eq('user_id', user.id),
    ]);
    setLabels((l as any) || []);
    setConvLabels((cl as any) || []);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const createLabel = async (name: string, color: string) => {
    if (!user) return;
    await supabase.from('chat_labels').insert({ user_id: user.id, name, color });
    load();
  };
  const deleteLabel = async (id: string) => {
    await supabase.from('chat_labels').delete().eq('id', id);
    load();
  };
  const assignLabel = async (conversation_id: string, label_id: string) => {
    if (!user) return;
    await supabase.from('conversation_labels').insert({ user_id: user.id, conversation_id, label_id });
    load();
  };
  const unassignLabel = async (id: string) => {
    await supabase.from('conversation_labels').delete().eq('id', id);
    load();
  };

  const labelsForConv = (conversation_id: string): Label[] => {
    const ids = convLabels.filter(c => c.conversation_id === conversation_id).map(c => c.label_id);
    return labels.filter(l => ids.includes(l.id));
  };

  return { labels, convLabels, createLabel, deleteLabel, assignLabel, unassignLabel, labelsForConv };
}
