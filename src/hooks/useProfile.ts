import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Profile {
  id: string;
  user_id: string;
  phone: string | null;
  display_name: string;
  avatar_url: string | null;
  cover_url: string | null;
  about: string | null;
  is_online: boolean;
  last_seen: string | null;
  show_last_seen: boolean;
  show_read_receipts: boolean;
  show_profile_photo: boolean;
  two_factor_email: string | null;
  two_factor_enabled: boolean;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setProfile(null); setLoading(false); return; }

    const fetch = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, user_id, display_name, avatar_url, cover_url, about, is_online, last_seen, show_last_seen, show_read_receipts, show_profile_photo')
        .eq('user_id', user.id)
        .single();
      // phone is column-restricted; fetch via SECURITY DEFINER RPC for self.
      const { data: priv } = await supabase.rpc('get_my_private_profile');
      const privRow = Array.isArray(priv) ? priv[0] : priv;
      setProfile(data ? ({ ...(data as any), phone: privRow?.phone ?? null } as Profile) : null);
      setLoading(false);
    };
    fetch();

    // Set online status
    supabase.from('profiles').update({ is_online: true }).eq('user_id', user.id).then();

    return () => {
      supabase.from('profiles').update({ is_online: false, last_seen: new Date().toISOString() }).eq('user_id', user.id).then();
    };
  }, [user]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();
    if (data) setProfile(data as Profile);
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return null;
    const path = `${user.id}/avatar.${file.name.split('.').pop()}`;
    await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    await updateProfile({ avatar_url: publicUrl });
    return publicUrl;
  };

  const uploadCover = async (file: File) => {
    if (!user) return null;
    const path = `${user.id}/cover.${file.name.split('.').pop()}`;
    await supabase.storage.from('covers').upload(path, file, { upsert: true });
    const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(path);
    await updateProfile({ cover_url: publicUrl });
    return publicUrl;
  };

  return { profile, loading, updateProfile, uploadAvatar, uploadCover };
}
