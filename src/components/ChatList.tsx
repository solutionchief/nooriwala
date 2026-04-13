import { motion } from 'framer-motion';
import { Search, Pin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { ConversationWithDetails } from '@/hooks/useConversations';
import { formatDistanceToNow } from 'date-fns';

interface ChatListProps {
  conversations: ConversationWithDetails[];
  onSelectChat: (conv: ConversationWithDetails) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onTogglePin: (convId: string) => void;
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

export default function ChatList({ conversations, onSelectChat, searchQuery, onSearchChange, onTogglePin }: ChatListProps) {
  const filtered = conversations.filter(c =>
    c.participant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.last_message_content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col">
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search chats..."
            className="pl-10 bg-secondary border-none"
          />
        </div>
      </div>

      <div className="flex flex-col">
        {filtered.map((conv, i) => (
          <motion.button
            key={conv.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => onSelectChat(conv)}
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-card active:bg-secondary"
          >
            <Avatar
              name={conv.participant_name}
              isOnline={conv.participant_online}
              avatarUrl={conv.participant_avatar}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-foreground truncate">{conv.participant_name}</span>
                  {conv.is_pinned && <Pin className="h-3 w-3 text-primary rotate-45" />}
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
            </div>
          </motion.button>
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-lg font-semibold text-foreground">No chats yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Start a conversation to see it here</p>
          </div>
        )}
      </div>
    </div>
  );
}