import { useEffect, useState } from 'react';
import { ArrowLeft, Search, Phone, Video, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ChatList';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type PickerMode = 'chat' | 'call';

interface Contact {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  is_online: boolean;
}

interface ContactPickerProps {
  mode: PickerMode;
  onBack: () => void;
  onPickChat: (userId: string, name: string, avatar: string | null) => void;
  onPickCall: (userId: string, name: string, avatar: string | null, type: 'audio' | 'video') => void;
}

export default function ContactPicker({ mode, onBack, onPickChat, onPickCall }: ContactPickerProps) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, is_online')
        .neq('user_id', user.id)
        .order('display_name')
        .limit(200);
      setContacts(data || []);
      setLoading(false);
    })();
  }, [user]);

  const filtered = contacts.filter(c =>
    c.display_name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border bg-card px-3 py-3">
        <button onClick={onBack} className="text-muted-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">
          {mode === 'call' ? 'New Call' : 'New Chat'}
        </h1>
      </div>

      <div className="border-b border-border bg-card px-3 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search contacts"
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No contacts found</p>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(c => (
              <div key={c.user_id} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={c.display_name} avatarUrl={c.avatar_url} isOnline={c.is_online} />
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-foreground">{c.display_name}</p>
                  <p className="text-xs text-muted-foreground">{c.is_online ? 'Online' : 'Offline'}</p>
                </div>
                {mode === 'call' ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onPickCall(c.user_id, c.display_name, c.avatar_url, 'audio')}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-primary/10"
                      aria-label="Voice call"
                    >
                      <Phone className="h-4.5 w-4.5" />
                    </button>
                    <button
                      onClick={() => onPickCall(c.user_id, c.display_name, c.avatar_url, 'video')}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-primary/10"
                      aria-label="Video call"
                    >
                      <Video className="h-4.5 w-4.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onPickChat(c.user_id, c.display_name, c.avatar_url)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-primary/10"
                    aria-label="Open chat"
                  >
                    <MessageCircle className="h-4.5 w-4.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
