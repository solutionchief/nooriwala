import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Paperclip, Smile, MoreVertical, Check, CheckCheck, AlertCircle, Pin, Image } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ChatList';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/contexts/AuthContext';
import type { ConversationWithDetails } from '@/hooks/useConversations';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatScreenProps {
  conversation: ConversationWithDetails;
  onBack: () => void;
  onTogglePin: (convId: string) => void;
  onSetTheme: (convId: string, file: File | null) => void;
}

function MessageStatus({ status }: { status: string }) {
  if (status === 'read') return <CheckCheck className="h-3.5 w-3.5 text-delivered" />;
  if (status === 'delivered') return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />;
  if (status === 'sent') return <Check className="h-3.5 w-3.5 text-muted-foreground" />;
  return <div className="h-2 w-2 animate-pulse-dot rounded-full bg-muted-foreground" />;
}

export default function ChatScreen({ conversation, onBack, onTogglePin, onSetTheme }: ChatScreenProps) {
  const { user } = useAuth();
  const { messages, loading, sendMessage, deleteForSelf } = useMessages(conversation.id);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const themeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput('');
  };

  const onlineText = conversation.participant_online
    ? 'online'
    : conversation.participant_last_seen
      ? `last seen ${formatDistanceToNow(new Date(conversation.participant_last_seen), { addSuffix: true })}`
      : 'offline';

  const chatBgStyle = conversation.custom_theme_url
    ? { backgroundImage: `url(${conversation.custom_theme_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-3 py-3">
        <button onClick={onBack} className="text-muted-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Avatar name={conversation.participant_name} isOnline={conversation.participant_online} avatarUrl={conversation.participant_avatar} />
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-foreground">{conversation.participant_name}</p>
            {conversation.is_pinned && <Pin className="h-3 w-3 text-primary rotate-45" />}
          </div>
          <p className="text-xs text-muted-foreground">{onlineText}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 text-muted-foreground"><MoreVertical className="h-5 w-5" /></button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onTogglePin(conversation.id)}>
              <Pin className="mr-2 h-4 w-4" />
              {conversation.is_pinned ? 'Unpin Chat' : 'Pin Chat'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => themeInputRef.current?.click()}>
              <Image className="mr-2 h-4 w-4" />
              Set Chat Theme
            </DropdownMenuItem>
            {conversation.custom_theme_url && (
              <DropdownMenuItem onClick={() => onSetTheme(conversation.id, null)}>
                Remove Theme
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <input
          ref={themeInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) onSetTheme(conversation.id, file);
            e.target.value = '';
          }}
        />
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 space-y-2" style={chatBgStyle}>
        {loading && <p className="text-center text-sm text-muted-foreground">Loading...</p>}
        {messages.map((msg) => {
          const isMine = msg.sender_id === user?.id;
          const showDeleteNotice = msg.deleted_by_sender && !isMine;

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`relative max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  isMine
                    ? 'rounded-br-md bg-chat-sent text-chat-sent-foreground'
                    : 'rounded-bl-md bg-chat-received text-chat-received-foreground'
                }`}
              >
                {showDeleteNotice && (
                  <div className="mb-1 flex items-center gap-1 text-xs text-warning/80">
                    <AlertCircle className="h-3 w-3" />
                    Sender tried to delete this
                  </div>
                )}

                {isMine && msg.deleted_by_sender ? (
                  <p className="italic text-sm opacity-60">🚫 You deleted this message</p>
                ) : (
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                )}

                {msg.reactions.length > 0 && (
                  <div className="mt-1 flex gap-1">
                    {msg.reactions.map((r, ri) => (
                      <span key={ri} className="rounded-full bg-background/20 px-1.5 py-0.5 text-xs">
                        {r.emoji}
                      </span>
                    ))}
                  </div>
                )}

                <div className={`mt-1 flex items-center gap-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <span className="text-[10px] opacity-60">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isMine && <MessageStatus status={msg.status} />}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card px-3 py-3">
        <div className="flex items-center gap-2">
          <button className="p-2 text-muted-foreground"><Smile className="h-5 w-5" /></button>
          <button className="p-2 text-muted-foreground"><Paperclip className="h-5 w-5" /></button>
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 border-none bg-secondary"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40 transition-opacity"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
