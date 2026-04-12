import { formatDistanceToNow } from 'date-fns';
import { Search, MoreVertical, Pin, Check, CheckCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { Conversation } from '@/types/chat';

interface ChatListProps {
  conversations: Conversation[];
  onSelectChat: (conv: Conversation) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

function MessageStatus({ status }: { status: string }) {
  if (status === 'read') return <CheckCheck className="h-4 w-4 text-delivered" />;
  if (status === 'delivered') return <CheckCheck className="h-4 w-4 text-muted-foreground" />;
  if (status === 'sent') return <Check className="h-4 w-4 text-muted-foreground" />;
  return <div className="h-4 w-4 animate-pulse-dot rounded-full bg-muted-foreground" />;
}

function Avatar({ name, isOnline }: { name: string; isOnline?: boolean }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2);
  const colors = ['bg-primary', 'bg-blue-600', 'bg-purple-600', 'bg-orange-600', 'bg-rose-600'];
  const colorIndex = name.charCodeAt(0) % colors.length;

  return (
    <div className="relative">
      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${colors[colorIndex]} text-sm font-bold text-foreground`}>
        {initials}
      </div>
      {isOnline && (
        <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-background bg-online" />
      )}
    </div>
  );
}

export { Avatar };

export default function ChatList({ conversations, onSelectChat, searchQuery, onSearchChange }: ChatListProps) {
  const filtered = conversations.filter(c =>
    c.participant.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinned = filtered.filter(c => c.is_pinned);
  const others = filtered.filter(c => !c.is_pinned);

  return (
    <div className="flex flex-col">
      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search conversations..."
            className="pl-10 bg-secondary border-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {pinned.length > 0 && (
          <div className="px-4 py-2">
            <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Pin className="h-3 w-3" /> Pinned
            </p>
          </div>
        )}
        {pinned.map(conv => (
          <ConversationItem key={conv.id} conv={conv} onClick={() => onSelectChat(conv)} />
        ))}

        {others.length > 0 && pinned.length > 0 && (
          <div className="px-4 py-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">All chats</p>
          </div>
        )}
        {others.map(conv => (
          <ConversationItem key={conv.id} conv={conv} onClick={() => onSelectChat(conv)} />
        ))}
      </div>
    </div>
  );
}

function ConversationItem({ conv, onClick }: { conv: Conversation; onClick: () => void }) {
  const lastMsg = conv.last_message;
  const isSent = lastMsg?.sender_id === 'current-user';
  const timeStr = lastMsg ? formatDistanceToNow(new Date(lastMsg.created_at), { addSuffix: false }) : '';

  let preview = lastMsg?.content || 'Start a conversation';
  if (lastMsg?.deleted_by_sender && isSent) {
    preview = '🚫 You deleted this message';
  }

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/50 active:bg-secondary"
    >
      <Avatar name={conv.participant.display_name} isOnline={conv.participant.is_online} />
      <div className="flex flex-1 flex-col overflow-hidden text-left">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-foreground">{conv.participant.display_name}</span>
          <span className="text-xs text-muted-foreground">{timeStr}</span>
        </div>
        <div className="flex items-center gap-1">
          {isSent && lastMsg && <MessageStatus status={lastMsg.status} />}
          <span className="truncate text-sm text-muted-foreground">{preview}</span>
          {conv.unread_count > 0 && (
            <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
              {conv.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
