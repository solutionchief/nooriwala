import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Pin, Archive, ArchiveRestore, Megaphone, Users, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { ConversationWithDetails } from '@/hooks/useConversations';
import { formatDistanceToNow } from 'date-fns';
import { useLabels } from '@/hooks/useLabels';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

type FilterKey = 'all' | 'groups' | 'archived' | 'broadcasts';

interface ChatListProps {
  conversations: ConversationWithDetails[];
  onSelectChat: (conv: ConversationWithDetails) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onTogglePin: (convId: string) => void;
  onToggleArchive?: (convId: string) => void;
}

export function Avatar({ name, isOnline, avatarUrl, size = 'md' }: { name: string; isOnline?: boolean; avatarUrl?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'h-8 w-8 text-xs' : size === 'lg' ? 'h-16 w-16 text-xl' : 'h-12 w-12 text-sm';
  const dotSize = size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3';

  return (
    <div className="relative">
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className={`${sizeClass} rounded-full object-cover`} loading="lazy" />
      ) : (
        <div className={`${sizeClass} flex items-center justify-center rounded-full bg-primary/20 font-bold text-primary`}>
          {name[0]?.toUpperCase() || '?'}
        </div>
      )}
      {isOnline && (
        <div className={`absolute bottom-0 right-0 ${dotSize} rounded-full border-2 border-card bg-online`} />
      )}
    </div>
  );
}

export default function ChatList({ conversations, onSelectChat, searchQuery, onSearchChange, onTogglePin, onToggleArchive }: ChatListProps) {
  const { labels, labelsForConv } = useLabels();
  const online = useOnlineStatus();
  const [activeLabel, setActiveLabel] = useState<string>('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [confirmArchive, setConfirmArchive] = useState<ConversationWithDetails | null>(null);

  const archivedCount = conversations.filter(c => c.is_archived).length;
  const chatsCount = conversations.filter(c => !c.is_archived).length;
  const groupsCount = conversations.filter(c => c.type === 'group' && !c.is_archived).length;
  const broadcastsCount = conversations.filter(c => c.type === 'broadcast' && !c.is_archived).length;

  const filtered = conversations.filter(c => {
    // Filter tab
    if (filter === 'archived') {
      if (!c.is_archived) return false;
    } else {
      if (c.is_archived) return false;
      if (filter === 'groups' && c.type !== 'group') return false;
      if (filter === 'broadcasts' && c.type !== 'broadcast') return false;
    }
    const name = c.type === 'direct' ? c.participant_name : (c.name || c.participant_name);
    const matchSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.last_message_content?.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;
    if (activeLabel) return labelsForConv(c.id).some(l => l.id === activeLabel);
    return true;
  });

  const filterTabs: { key: FilterKey; label: string; icon: typeof MessageCircle; count?: number }[] = [
    { key: 'all', label: 'Chats', icon: MessageCircle, count: chatsCount },
    { key: 'groups', label: 'Groups', icon: Users, count: groupsCount },
    { key: 'broadcasts', label: 'Broadcasts', icon: Megaphone, count: broadcastsCount },
    { key: 'archived', label: 'Archived', icon: Archive, count: archivedCount },
  ];

  return (
    <div className="flex flex-col">
      {!online && (
        <div className="bg-warning/10 border-b border-warning/30 px-4 py-1.5 text-center text-xs text-warning font-medium">
          You're offline — messages will send when you reconnect
        </div>
      )}
      <div className="px-4 py-3 space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search chats..."
            className="pl-10 bg-secondary border-none"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1">
          {filterTabs.map(t => {
            const active = filter === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
                {t.count !== undefined && t.count > 0 && (
                  <span className={`flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] ${active ? 'bg-primary-foreground/20' : 'bg-background'}`}>{t.count}</span>
                )}
              </button>
            );
          })}
        </div>

        {labels.length > 0 && filter !== 'archived' && (
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => setActiveLabel('')}
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${activeLabel === '' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
            >All</button>
            {labels.map(l => (
              <button
                key={l.id}
                onClick={() => setActiveLabel(l.id === activeLabel ? '' : l.id)}
                className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium flex items-center gap-1"
                style={{
                  background: activeLabel === l.id ? l.color : `${l.color}25`,
                  color: activeLabel === l.id ? '#fff' : l.color,
                }}
              >
                <div className="h-1.5 w-1.5 rounded-full" style={{ background: activeLabel === l.id ? '#fff' : l.color }} />
                {l.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col">
        {filtered.map((conv, i) => {
          const title = conv.type === 'direct' ? conv.participant_name : (conv.name || conv.participant_name);
          return (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.3) }}
              className="group relative"
            >
              <button
                onClick={() => onSelectChat(conv)}
                className="flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-card active:bg-secondary text-left"
              >
                <Avatar
                  name={title}
                  isOnline={conv.type === 'direct' && conv.participant_online}
                  avatarUrl={conv.type === 'direct' ? conv.participant_avatar : conv.avatar_url}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {conv.type === 'broadcast' && <Megaphone className="h-3.5 w-3.5 text-primary shrink-0" />}
                      {conv.type === 'group' && <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                      <span className="font-semibold text-foreground truncate">{title}</span>
                      {conv.is_pinned && <Pin className="h-3 w-3 text-primary rotate-45 shrink-0" />}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {conv.last_message_time ? formatDistanceToNow(new Date(conv.last_message_time), { addSuffix: true }) : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.last_message_content || 'No messages yet'}
                    </p>
                    {conv.unread_count > 0 && (
                      <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  {labelsForConv(conv.id).length > 0 && (
                    <div className="mt-1 flex gap-1 flex-wrap">
                      {labelsForConv(conv.id).map(l => (
                        <span key={l.id} className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ background: `${l.color}25`, color: l.color }}>
                          {l.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </button>

              {onToggleArchive && (
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmArchive(conv); }}
                  title={conv.is_archived ? 'Unarchive' : 'Archive'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 hidden h-8 w-8 items-center justify-center rounded-full bg-card text-muted-foreground hover:text-primary group-hover:flex"
                >
                  {conv.is_archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                </button>
              )}
            </motion.div>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <p className="text-lg font-semibold text-foreground">
              {filter === 'archived' ? 'No archived chats' : filter === 'groups' ? 'No groups yet' : filter === 'broadcasts' ? 'No broadcasts yet' : 'No chats yet'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {filter === 'broadcasts' ? 'Send a single message to many contacts at once.' : filter === 'archived' ? 'Archived chats will appear here.' : 'Start a conversation to see it here.'}
            </p>
          </div>
        )}
      </div>

      <AlertDialog open={!!confirmArchive} onOpenChange={(o) => !o && setConfirmArchive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmArchive?.is_archived ? 'Unarchive this chat?' : 'Archive this chat?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmArchive?.is_archived
                ? 'It will appear back in your main chats list.'
                : 'It will be hidden from your main chats list. You can find it under the Archived tab.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmArchive && onToggleArchive) onToggleArchive(confirmArchive.id);
                setConfirmArchive(null);
              }}
            >
              {confirmArchive?.is_archived ? 'Unarchive' : 'Archive'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
