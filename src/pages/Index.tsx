import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, CircleDot, Settings, Plus, Users, Phone, MessageSquarePlus, PhoneCall } from 'lucide-react';
import ChatList from '@/components/ChatList';
import ChatScreen from '@/components/ChatScreen';
import StatusScreen from '@/components/StatusScreen';
import SettingsScreen from '@/components/SettingsScreen';
import SplashScreen from '@/components/SplashScreen';
import AuthScreen from '@/components/AuthScreen';
import CreateGroupScreen from '@/components/CreateGroupScreen';
import CallsScreen from '@/components/CallsScreen';
import CallScreen from '@/components/CallScreen';
import IncomingCallOverlay from '@/components/IncomingCallOverlay';
import ContactPicker, { type PickerMode } from '@/components/ContactPicker';
import { useAuth } from '@/contexts/AuthContext';
import { useConversations, type ConversationWithDetails } from '@/hooks/useConversations';
import { useCalls } from '@/hooks/useCalls';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { enqueuePendingCall } from '@/lib/callQueue';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Tab = 'chats' | 'calls' | 'status' | 'settings';
interface ActiveCall { callId: string; calleeId: string; calleeName: string; calleeAvatar: string | null; callType: 'audio' | 'video'; asCallee?: boolean; }

export default function Index() {
  const { user, isAuthenticated, loading: authLoading, signOut } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [tab, setTab] = useState<Tab>('chats');
  const [activeChat, setActiveChat] = useState<ConversationWithDetails | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [pickerMode, setPickerMode] = useState<PickerMode | null>(null);
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const { conversations, loading: convsLoading, togglePin, setChatTheme } = useConversations();
  const { startCall, incomingCall, dismissIncoming, endCall } = useCalls();
  const online = useOnlineStatus();

  if (showSplash) {
    return <SplashScreen onGetStarted={() => setShowSplash(false)} />;
  }

  if (!isAuthenticated && !authLoading) {
    return <AuthScreen onBack={() => setShowSplash(true)} />;
  }

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const handleTogglePin = async (convId: string) => {
    try {
      await togglePin(convId);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleSetTheme = async (convId: string, file: File | null) => {
    await setChatTheme(convId, file);
    if (activeChat && activeChat.id === convId) {
      const updated = conversations.find(c => c.id === convId);
      if (updated) setActiveChat(updated);
    }
  };

  const findOrCreateDirect = async (otherUserId: string): Promise<string | null> => {
    if (!user) return null;
    // Find existing direct conversation
    const existing = conversations.find(c => c.type === 'direct' && c.participant_user_id === otherUserId);
    if (existing) return existing.id;

    const { data: conv, error } = await supabase
      .from('conversations')
      .insert({ type: 'direct', created_by: user.id })
      .select()
      .single();
    if (error || !conv) { toast.error(error?.message || 'Could not start chat'); return null; }
    const { error: pErr } = await supabase.from('conversation_participants').insert([
      { conversation_id: conv.id, user_id: user.id },
      { conversation_id: conv.id, user_id: otherUserId },
    ]);
    if (pErr) { toast.error(pErr.message); return null; }
    return conv.id;
  };

  const handlePickChat = async (otherId: string) => {
    const convId = await findOrCreateDirect(otherId);
    setPickerMode(null);
    if (!convId) return;
    // Wait briefly for refetch; fall back to optimistic navigation by id
    setTimeout(() => {
      const conv = conversations.find(c => c.id === convId);
      if (conv) setActiveChat(conv);
      else toast.success('Chat created — opening from list');
    }, 400);
  };

  const handleStartCall = async (otherId: string, name: string, avatar: string | null, type: 'audio' | 'video') => {
    setPickerMode(null);
    if (!online) {
      enqueuePendingCall({ calleeId: otherId, calleeName: name, calleeAvatar: avatar, callType: type });
      toast.info('You are offline — call queued and will retry when online');
      setTab('calls');
      return;
    }
    try {
      const convId = await findOrCreateDirect(otherId);
      const call = await startCall(otherId, type, convId || undefined);
      if (call) setActiveCall({ callId: call.id, calleeId: otherId, calleeName: name, calleeAvatar: avatar, callType: type });
    } catch (e: any) {
      toast.error(e.message || 'Could not start call');
    }
  };

  const handleAcceptIncoming = () => {
    if (!incomingCall) return;
    setActiveCall({
      callId: incomingCall.callId,
      calleeId: incomingCall.callerId,
      calleeName: incomingCall.callerName,
      calleeAvatar: incomingCall.callerAvatar,
      callType: incomingCall.callType,
      asCallee: true,
    });
    dismissIncoming();
  };

  const handleDeclineIncoming = async () => {
    if (!incomingCall || !user) return;
    try {
      await supabase.from('call_signals').insert({
        call_id: incomingCall.callId,
        sender_id: user.id,
        signal_type: 'decline',
      });
      await endCall(incomingCall.callId, 'declined', 0);
    } catch (e) { console.error(e); }
    dismissIncoming();
  };

  if (activeCall) {
    return (
      <CallScreen
        callId={activeCall.callId}
        calleeId={activeCall.calleeId}
        calleeName={activeCall.calleeName}
        calleeAvatar={activeCall.calleeAvatar}
        callType={activeCall.callType}
        asCallee={activeCall.asCallee}
        onEnd={() => setActiveCall(null)}
      />
    );
  }

  const incomingOverlay = incomingCall ? (
    <IncomingCallOverlay call={incomingCall} onAccept={handleAcceptIncoming} onDecline={handleDeclineIncoming} />
  ) : null;

  if (pickerMode) {
    return (
      <>
        <div className="mx-auto h-screen max-w-lg">
          <ContactPicker
            mode={pickerMode}
            onBack={() => setPickerMode(null)}
            onPickChat={handlePickChat}
            onPickCall={handleStartCall}
          />
        </div>
        {incomingOverlay}
      </>
    );
  }

  if (showCreateGroup) {
    return (
      <>
        <div className="mx-auto h-screen max-w-lg">
          <CreateGroupScreen
            onBack={() => setShowCreateGroup(false)}
            onCreated={(convId) => {
              setShowCreateGroup(false);
              const conv = conversations.find(c => c.id === convId);
              if (conv) setActiveChat(conv);
            }}
          />
        </div>
        {incomingOverlay}
      </>
    );
  }

  if (activeChat) {
    return (
      <>
        <div className="mx-auto h-screen max-w-lg">
          <ChatScreen
            conversation={activeChat}
            onBack={() => setActiveChat(null)}
            onTogglePin={handleTogglePin}
            onSetTheme={handleSetTheme}
            conversations={conversations}
          />
        </div>
        {incomingOverlay}
      </>
    );
  }

  const tabs: { key: Tab; icon: typeof MessageCircle; label: string }[] = [
    { key: 'chats', icon: MessageCircle, label: 'Chats' },
    { key: 'calls', icon: Phone, label: 'Calls' },
    { key: 'status', icon: CircleDot, label: 'Status' },
    { key: 'settings', icon: Settings, label: 'Settings' },
  ];

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);
  const headerTitle = tab === 'chats' ? 'Chief Messenger' : tab === 'calls' ? 'Calls' : tab === 'status' ? 'Status' : 'Settings';

  return (
    <>
    <div className="mx-auto flex h-screen max-w-lg flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <MessageCircle className="h-4 w-4 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground">{headerTitle}</h1>
        </div>
        {(tab === 'chats' || tab === 'calls') && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-label="New">
                <Plus className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setPickerMode('chat')}>
                <MessageSquarePlus className="mr-2 h-4 w-4" />
                New Chat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPickerMode('call')}>
                <PhoneCall className="mr-2 h-4 w-4" />
                New Call
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowCreateGroup(true)}>
                <Users className="mr-2 h-4 w-4" />
                New Group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            {tab === 'chats' && (
              <ChatList
                conversations={conversations}
                onSelectChat={setActiveChat}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onTogglePin={handleTogglePin}
              />
            )}
            {tab === 'calls' && (
              <CallsScreen
                onStartCall={(uid, name, avatar, type) => handleStartCall(uid, name, avatar, type)}
              />
            )}
            {tab === 'status' && <StatusScreen />}
            {tab === 'settings' && <SettingsScreen onSignOut={signOut} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="border-t border-border bg-card">
        <div className="flex">
          {tabs.map(t => {
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="relative flex flex-1 flex-col items-center gap-1 py-3 transition-colors"
              >
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute top-0 left-1/4 right-1/4 h-0.5 rounded-full bg-primary"
                  />
                )}
                <div className="relative">
                  <t.icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  {t.key === 'chats' && totalUnread > 0 && (
                    <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                      {totalUnread}
                    </span>
                  )}
                </div>
                <span className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
