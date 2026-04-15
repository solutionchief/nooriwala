import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Check, Camera, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ChatList';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CreateGroupScreenProps {
  onBack: () => void;
  onCreated: (convId: string) => void;
}

interface UserResult {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  is_online: boolean;
}

export default function CreateGroupScreen({ onBack, onCreated }: CreateGroupScreenProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'members' | 'details'>('members');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserResult[]>([]);
  const [selected, setSelected] = useState<UserResult[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupAvatar, setGroupAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, is_online')
        .neq('user_id', user.id)
        .order('display_name');
      setUsers(data || []);
    };
    fetchUsers();
  }, [user]);

  const filtered = users.filter(u =>
    u.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUser = (u: UserResult) => {
    setSelected(prev =>
      prev.some(s => s.user_id === u.user_id)
        ? prev.filter(s => s.user_id !== u.user_id)
        : prev.length < 256 ? [...prev, u] : prev
    );
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setGroupAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
    e.target.value = '';
  };

  const handleCreate = async () => {
    if (!user || !groupName.trim() || selected.length < 1) return;
    setLoading(true);

    try {
      let avatarUrl: string | null = null;
      if (groupAvatar) {
        const ext = groupAvatar.name.split('.').pop();
        const path = `groups/${Date.now()}.${ext}`;
        await supabase.storage.from('avatars').upload(path, groupAvatar);
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
        avatarUrl = publicUrl;
      }

      const { data: conv } = await supabase
        .from('conversations')
        .insert({
          type: 'group',
          name: groupName.trim(),
          avatar_url: avatarUrl,
          created_by: user.id,
        })
        .select()
        .single();

      if (!conv) throw new Error('Failed to create group');

      // Add participants: creator as admin + selected members
      const participants = [
        { conversation_id: conv.id, user_id: user.id, role: 'admin' },
        ...selected.map(s => ({ conversation_id: conv.id, user_id: s.user_id, role: 'member' })),
      ];

      await supabase.from('conversation_participants').insert(participants);
      toast.success('Group created!');
      onCreated(conv.id);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create group');
    }
    setLoading(false);
  };

  if (step === 'details') {
    return (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <button onClick={() => setStep('members')} className="text-muted-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-bold text-foreground">Group Details</h2>
        </div>

        <div className="flex flex-col items-center gap-4 p-6">
          <div className="relative cursor-pointer" onClick={() => avatarRef.current?.click()}>
            {avatarPreview ? (
              <img src={avatarPreview} alt="" className="h-24 w-24 rounded-full object-cover" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary">
                <Camera className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          <Input
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            placeholder="Group name"
            className="text-center text-lg"
            maxLength={50}
            autoFocus
          />

          <p className="text-sm text-muted-foreground">{selected.length} member{selected.length !== 1 ? 's' : ''} selected</p>
        </div>

        <div className="flex-1 overflow-y-auto px-4">
          <div className="flex flex-wrap gap-2">
            {selected.map(s => (
              <div key={s.user_id} className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1">
                <span className="text-sm text-foreground">{s.display_name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border p-4">
          <Button
            onClick={handleCreate}
            disabled={!groupName.trim() || loading}
            className="w-full py-6 text-lg font-bold"
          >
            {loading ? 'Creating...' : 'Create Group'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button onClick={onBack} className="text-muted-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="flex-1 text-lg font-bold text-foreground">Add Members</h2>
        {selected.length > 0 && (
          <button
            onClick={() => setStep('details')}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"
          >
            <Check className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Selected members chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 border-b border-border px-4 py-2">
          {selected.map(s => (
            <button
              key={s.user_id}
              onClick={() => toggleUser(s)}
              className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1"
            >
              <Avatar name={s.display_name} avatarUrl={s.avatar_url} size="sm" />
              <span className="text-xs text-foreground">{s.display_name}</span>
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}

      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search contacts..."
            className="pl-10 bg-secondary border-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.map(u => {
          const isSelected = selected.some(s => s.user_id === u.user_id);
          return (
            <button
              key={u.user_id}
              onClick={() => toggleUser(u)}
              className="flex w-full items-center gap-3 px-4 py-3 hover:bg-card transition-colors"
            >
              <Avatar name={u.display_name} isOnline={u.is_online} avatarUrl={u.avatar_url} />
              <span className="flex-1 text-left font-medium text-foreground">{u.display_name}</span>
              {isSelected && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                  <Check className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
