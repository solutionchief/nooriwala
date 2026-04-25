import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AwayMessages {
  greeting_enabled: boolean;
  greeting_text: string;
  away_enabled: boolean;
  away_text: string;
}

const DEFAULT: AwayMessages = {
  greeting_enabled: false,
  greeting_text: "Hello! Thanks for reaching out. We'll get back to you soon.",
  away_enabled: false,
  away_text: "We're currently closed. We'll respond during business hours.",
};

export function useAwayMessages() {
  const { user } = useAuth();
  const [data, setData] = useState<AwayMessages>(DEFAULT);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const { data: row } = await supabase
      .from('away_messages')
      .select('greeting_enabled, greeting_text, away_enabled, away_text')
      .eq('user_id', user.id)
      .maybeSingle();
    if (row) setData(row as any);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const save = async (patch: Partial<AwayMessages>) => {
    if (!user) return;
    const next = { ...data, ...patch };
    setData(next);
    await supabase.from('away_messages').upsert({ user_id: user.id, ...next }, { onConflict: 'user_id' });
  };

  return { data, loading, save };
}
