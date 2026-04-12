import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Paperclip, Smile, MoreVertical, Check, CheckCheck, Phone, Video, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ChatList';
import type { Conversation, Message } from '@/types/chat';
import { mockMessages, currentUser } from '@/data/mockData';
import { formatDistanceToNow } from 'date-fns';

interface ChatScreenProps {
  conversation: Conversation;
  onBack: () => void;
}

function MessageStatus({ status }: { status: string }) {
  if (status === 'read') return <CheckCheck className="h-3.5 w-3.5 text-delivered" />;
  if (status === 'delivered') return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />;
  if (status === 'sent') return <Check className="h-3.5 w-3.5 text-muted-foreground" />;
  return <div className="h-2 w-2 animate-pulse-dot rounded-full bg-muted-foreground" />;
}

export default function ChatScreen({ conversation, onBack }: ChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>(mockMessages[conversation.id] || []);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMsg: Message = {
      id: `m-${Date.now()}`,
      conversation_id: conversation.id,
      sender_id: 'current-user',
      content: input.trim(),
      content_type: 'text',
      status: 'sent',
      deleted_by_sender: false,
      visible_to_receiver: true,
      reactions: [],
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newMsg]);
    setInput('');

    // Simulate delivery
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'delivered' } : m));
    }, 1000);
  };

  const { participant } = conversation;
  const onlineText = participant.is_online
    ? 'online'
    : participant.last_seen
      ? `last seen ${formatDistanceToNow(new Date(participant.last_seen), { addSuffix: true })}`
      : 'offline';

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-3 py-3">
        <button onClick={onBack} className="text-muted-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Avatar name={participant.display_name} isOnline={participant.is_online} />
        <div className="flex-1">
          <p className="font-semibold text-foreground">{participant.display_name}</p>
          <p className="text-xs text-muted-foreground">{onlineText}</p>
        </div>
        <button className="p-2 text-muted-foreground"><Phone className="h-5 w-5" /></button>
        <button className="p-2 text-muted-foreground"><Video className="h-5 w-5" /></button>
        <button className="p-2 text-muted-foreground"><MoreVertical className="h-5 w-5" /></button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 space-y-2">
        {messages.map((msg, i) => {
          const isMine = msg.sender_id === 'current-user';
          const showDeleteNotice = msg.deleted_by_sender && !isMine;

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
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
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 border-none bg-secondary"
          />
          <button
            onClick={sendMessage}
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
