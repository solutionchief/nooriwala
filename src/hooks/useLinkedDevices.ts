import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LinkedDevice {
  id: string;
  device_name: string;
  device_code: string;
  platform: string | null;
  last_active_at: string;
  created_at: string;
}

function genCode() {
  return Array.from({ length: 4 }, () =>
    Math.random().toString(36).slice(2, 6).toUpperCase()
  ).join('-');
}

export function useLinkedDevices() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<LinkedDevice[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from('linked_devices').select('*').eq('user_id', user.id).order('last_active_at', { ascending: false });
    setDevices((data as LinkedDevice[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const addDevice = async (device_name: string, platform: string) => {
    if (!user) throw new Error('Not signed in');
    const code = genCode();
    const { data, error } = await supabase.from('linked_devices').insert({
      user_id: user.id, device_name, platform, device_code: code,
    }).select().single();
    if (error) throw error;
    await load();
    return data as LinkedDevice;
  };

  const removeDevice = async (id: string) => {
    await supabase.from('linked_devices').delete().eq('id', id);
    load();
  };

  return { devices, loading, addDevice, removeDevice, refresh: load };
}
