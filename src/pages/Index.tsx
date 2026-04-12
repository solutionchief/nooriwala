import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, CircleDot, Settings, Plus } from 'lucide-react';
import ChatList from '@/components/ChatList';
import ChatScreen from '@/components/ChatScreen';
import StatusScreen from '@/components/StatusScreen';
import SettingsScreen from '@/components/SettingsScreen';
import SplashScreen from '@/components/SplashScreen';
import AuthScreen from '@/components/AuthScreen';
import { mockConversations, mockStatuses } from '@/data/mockData';
import type { Conversation } from '@/types/chat';

type AppScreen = 'splash' | 'auth' | 'main';
type Tab = 'chats' | 'status' | 'settings';

export default function Index() {
  const [screen, setScreen] = useState<AppScreen>('splash');
  const [tab, setTab] = useState<Tab>('chats');
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  if (screen === 'splash') {
    return <SplashScreen onGetStarted={() => setScreen('auth')} />;
  }

  if (screen === 'auth') {
    return <AuthScreen onLogin={() => setScreen('main')} onBack={() => setScreen('splash')} />;
  }

  if (activeChat) {
    return (
      <div className="mx-auto h-screen max-w-lg">
        <ChatScreen conversation={activeChat} onBack={() => setActiveChat(null)} />
      </div>
    );
  }

  const tabs: { key: Tab; icon: typeof MessageCircle; label: string }[] = [
    { key: 'chats', icon: MessageCircle, label: 'Chats' },
    { key: 'status', icon: CircleDot, label: 'Status' },
    { key: 'settings', icon: Settings, label: 'Settings' },
  ];

  const totalUnread = mockConversations.reduce((sum, c) => sum + c.unread_count, 0);

  return (
    <div className="mx-auto flex h-screen max-w-lg flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <MessageCircle className="h-4 w-4 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground">
            {tab === 'chats' ? 'Chief Messenger' : tab === 'status' ? 'Status' : 'Settings'}
          </h1>
        </div>
        {tab === 'chats' && (
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Plus className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Content */}
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
                conversations={mockConversations}
                onSelectChat={setActiveChat}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            )}
            {tab === 'status' && <StatusScreen statuses={mockStatuses} />}
            {tab === 'settings' && <SettingsScreen onSignOut={() => setScreen('splash')} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
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
