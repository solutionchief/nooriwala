import { useEffect, useState, useMemo } from 'react';
import { ArrowLeft, Search, Phone, Video, Users, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ChatList';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCalls, type CallRecord } from '@/hooks/useCalls';
import { useConversations } from '@/hooks/useConversations';
import { formatDistanceToNow } from 'date-fns';

type CallType = 'audio' | 'video';
type SourceTab = 'contacts' | 'recent' | 'chats';

interface Contact {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  is_online: boolean;
}

interface NewCallPickerProps {
  onBack: () => void;
  onStartCall: (userId: string, name: string, avatar: string | null, type: CallType) => void;
  onStartGroupCall: (participants: { userId: string; name: string; avatar: string | null }[], type: CallType) => void;
}

export default function NewCallPicker({ onBack, onStartCall, onStartGroupCall }: NewCallPickerProps) {
  const { user } = useAuth();
  const { calls } = useCalls();
  const { conversations } = useConversations();
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sourceTab, setSourceTab] = useState<SourceTab>('contacts');
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<Map<string, { name: string; avatar: string | null }>>(new Map());

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

  // Get unique recent call contacts
  const recentCallContacts = useMemo(() => {
    const seen = new Set<string>();
    const recent: { user_id: string; display_name: string; avatar_url: string | null; last_call: string; call_type: 'audio' | 'video' }[] = [];
    
    for (const call of calls) {
      if (!seen.has(call.other_user_id)) {
        seen.add(call.other_user_id);
        recent.push({
          user_id: call.other_user_id,
          display_name: call.other_name,
          avatar_url: call.other_avatar,
          last_call: call.started_at,
          call_type: call.call_type,
        });
      }
      if (recent.length >= 50) break;
    }
    return recent;
  }, [calls]);

  // Get chat contacts (direct conversations)
  const chatContacts = useMemo(() => {
    return conversations
      .filter(c => c.type === 'direct' && c.participant_user_id)
      .map(c => ({
        user_id: c.participant_user_id!,
        display_name: c.participant_display_name || 'Unknown',
        avatar_url: c.participant_avatar_url || null,
        is_online: c.participant_is_online || false,
      }));
  }, [conversations]);

  const filteredContacts = useMemo(() => {
    const q = query.toLowerCase();
    if (sourceTab === 'contacts') {
      return contacts.filter(c => c.display_name.toLowerCase().includes(q));
    }
    if (sourceTab === 'recent') {
      return recentCallContacts.filter(c => c.display_name.toLowerCase().includes(q));
    }
    return chatContacts.filter(c => c.display_name.toLowerCase().includes(q));
  }, [query, sourceTab, contacts, recentCallContacts, chatContacts]);

  const toggleParticipant = (userId: string, name: string, avatar: string | null) => {
    setSelectedParticipants(prev => {
      const next = new Map(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.set(userId, { name, avatar });
      }
      return next;
    });
  };

  const handleSingleCall = (userId: string, name: string, avatar: string | null, type: CallType) => {
    if (isGroupMode) {
      toggleParticipant(userId, name, avatar);
    } else {
      onStartCall(userId, name, avatar, type);
    }
  };

  const handleStartGroupCall = (type: CallType) => {
    if (selectedParticipants.size < 2) return;
    const participants = Array.from(selectedParticipants.entries()).map(([userId, { name, avatar }]) => ({
      userId,
      name,
      avatar,
    }));
    onStartGroupCall(participants, type);
  };

  const tabs: { key: SourceTab; label: string }[] = [
    { key: 'contacts', label: 'Contacts' },
    { key: 'recent', label: 'Recent' },
    { key: 'chats', label: 'Chats' },
  ];

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-3 py-3">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-lg font-semibold text-foreground">New Call</h1>
        <button
          onClick={() => {
            setIsGroupMode(!isGroupMode);
            setSelectedParticipants(new Map());
          }}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
            isGroupMode
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          Group
        </button>
      </div>

      {/* Group Mode Selected Participants */}
      {isGroupMode && selectedParticipants.size > 0 && (
        <div className="border-b border-border bg-secondary/30 px-3 py-2">
          <div className="mb-2 text-xs font-medium text-muted-foreground">
            Selected ({selectedParticipants.size})
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from(selectedParticipants.entries()).map(([userId, { name, avatar }]) => (
              <div
                key={userId}
                className="flex items-center gap-1.5 rounded-full bg-primary/10 py-1 pl-1 pr-2"
              >
                <Avatar name={name} avatarUrl={avatar} size="sm" />
                <span className="text-xs font-medium text-foreground">{name}</span>
                <button
                  onClick={() => toggleParticipant(userId, name, avatar)}
                  className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          {/* Group Call Buttons */}
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => handleStartGroupCall('audio')}
              disabled={selectedParticipants.size < 2}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors disabled:opacity-50"
            >
              <Phone className="h-4 w-4" />
              Voice Call
            </button>
            <button
              onClick={() => handleStartGroupCall('video')}
              disabled={selectedParticipants.size < 2}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors disabled:opacity-50"
            >
              <Video className="h-4 w-4" />
              Video Call
            </button>
          </div>
        </div>
      )}

      {/* Search */}
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
        {/* Source Tabs */}
        <div className="mt-2 flex gap-2">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setSourceTab(t.key)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                sourceTab === t.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <Phone className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {sourceTab === 'contacts' && 'No contacts found'}
              {sourceTab === 'recent' && 'No recent calls'}
              {sourceTab === 'chats' && 'No chat contacts'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredContacts.map(c => {
              const isSelected = selectedParticipants.has(c.user_id);
              return (
                <div
                  key={c.user_id}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                    isGroupMode ? 'cursor-pointer hover:bg-accent/50' : ''
                  } ${isSelected ? 'bg-primary/5' : ''}`}
                  onClick={isGroupMode ? () => toggleParticipant(c.user_id, c.display_name, c.avatar_url) : undefined}
                >
                  <div className="relative">
                    <Avatar name={c.display_name} avatarUrl={c.avatar_url} isOnline={'is_online' in c ? c.is_online : undefined} />
                    {isGroupMode && isSelected && (
                      <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-foreground">{c.display_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {'is_online' in c ? (c.is_online ? 'Online' : 'Offline') : ''}
                      {'last_call' in c && `Last call ${formatDistanceToNow(new Date(c.last_call), { addSuffix: true })}`}
                    </p>
                  </div>
                  {!isGroupMode && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSingleCall(c.user_id, c.display_name, c.avatar_url, 'audio');
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-primary/10"
                        aria-label="Voice call"
                      >
                        <Phone className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSingleCall(c.user_id, c.display_name, c.avatar_url, 'video');
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-primary/10"
                        aria-label="Video call"
                      >
                        <Video className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
