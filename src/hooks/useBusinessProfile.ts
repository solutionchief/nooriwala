import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface BusinessHours {
  [day: string]: { open: string; close: string; closed?: boolean } | undefined;
}

export interface BusinessProfile {
  id: string;
  user_id: string;
  business_mode: boolean;
  business_name: string | null;
  category: string | null;
  description: string | null;
  address: string | null;
  website: string | null;
  email: string | null;
  hours: BusinessHours;
  cover_url: string | null;
  verified: boolean;
}

export function useBusinessProfile(userId?: string) {
  const { user } = useAuth();
  const targetId = userId || user?.id;
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!targetId) return;
    const { data } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', targetId)
      .maybeSingle();
    setProfile(data as any);
    setLoading(false);
  }, [targetId]);

  useEffect(() => { load(); }, [load]);

  const upsert = async (patch: Partial<BusinessProfile>) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('business_profiles')
      .upsert({ user_id: user.id, ...patch } as any, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) throw error;
    setProfile(data as any);
    return data;
  };

  return { profile, loading, upsert, reload: load };
}
