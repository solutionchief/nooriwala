import { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Paperclip, Smile, MoreVertical, Check, CheckCheck, AlertCircle, Pin, Image, Reply, Forward, Ban, Flag, Clock, X, Users, Tag, WifiOff, Loader2, Phone, Video, ScanLine, FileText, Eye, EyeOff } from 'lucide-react';
import { imagesToPdf } from '@/lib/scanToPdf';
import ScanToPdfDialog from '@/components/ScanToPdfDialog';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ChatList';
import { useMessages, type MessageData } from '@/hooks/useMessages';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { useAuth } from '@/contexts/AuthContext';
import type { ConversationWithDetails } from '@/hooks/useConversations';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useQuickReplies } from '@/hooks/useQuickReplies';
import { useLabels } from '@/hooks/useLabels';
import { usePendingOutbox } from '@/hooks/useOnlineStatus';
import { useCalls } from '@/hooks/useCalls';
import CallScreen from '@/components/CallScreen';
import GroupInfoScreen from '@/components/GroupInfoScreen';

interface ChatScreenProps {
  conversation: ConversationWithDetails;
  onBack: () => void;
  onTogglePin: (convId: string) => void;
  onSetTheme: (convId: string, file: File | null) => void;
  conversations?: ConversationWithDetails[];
}

function MessageStatus({ status }: { status: string }) {
  if (status === 'read') return <CheckCheck className="h-3.5 w-3.5 text-delivered" />;
  if (status === 'delivered') return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />;
  if (status === 'sent') return <Check className="h-3.5 w-3.5 text-muted-foreground" />;
  return <div className="h-2 w-2 animate-pulse-dot rounded-full bg-muted-foreground" />;
}

export default function ChatScreen({ conversation, onBack, onTogglePin, onSetTheme, conversations = [] }: ChatScreenProps) {
  const { user } = useAuth();
  const { messages, loading, sendMessage, deleteForSelf, deleteForEveryone, addReaction, forwardMessage } = useMessages(conversation.id);
  const { typingUsers, onType, stopTyping } = useTypingIndicator(conversation.id);
  const { isBlocked, blockUser, unblockUser, reportUser } = useBlockedUsers();
  const { replies: quickReplies } = useQuickReplies();
  const { labels, labelsForConv, assignLabel, unassignLabel, convLabels } = useLabels();
  const { startCall } = useCalls();
  const pending = usePendingOutbox(conversation.id);
  const [input, setInput] = useState('');
  const [activeCall, setActiveCall] = useState<{ id: string; type: 'audio' | 'video' } | null>(null);
  const [replyTo, setReplyTo] = useState<MessageData | null>(null);
  const [forwardMsg, setForwardMsg] = useState<MessageData | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showDisappearing, setShowDisappearing] = useState(false);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [emojiMsgId, setEmojiMsgId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const themeInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [showDeleted, setShowDeleted] = useState<boolean>(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  // Hydrate show-deleted preference from backend so it follows the user across devices.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('conversation_participants')
        .select('show_deleted_messages')
        .eq('conversation_id', conversation.id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (!cancelled && data) setShowDeleted(!!data.show_deleted_messages);
    })();
    return () => { cancelled = true; };
  }, [user, conversation.id]);

  const toggleShowDeleted = async () => {
    if (!user) return;
    const next = !showDeleted;
    setShowDeleted(next);
    const { error } = await supabase
      .from('conversation_participants')
      .update({ show_deleted_messages: next })
      .eq('conversation_id', conversation.id)
      .eq('user_id', user.id);
    if (error) {
      setShowDeleted(!next);
      toast.error('Could not save preference');
      return;
    }
    toast.success(next ? 'You will see messages even if the sender deletes them' : 'Deleted messages will be hidden');
  };

  const blocked = isBlocked(conversation.participant_user_id);
  const suggestions = useMemo(() => {
    if (!input.startsWith('/') || input.length < 2) return [];
    const q = input.slice(1).toLowerCase();
    return quickReplies.filter(r => r.shortcut.toLowerCase().startsWith(q)).slice(0, 5);
  }, [input, quickReplies]);
  const convChips = labelsForConv(conversation.id);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, typingUsers]);

  const handleSend = () => {
    if (!input.trim() || blocked) return;
    stopTyping();
    sendMessage(input.trim(), 'text', undefined, replyTo?.id);
    setInput('');
    setReplyTo(null);
  };

  const uploadAndSend = async (file: File, kind: 'image' | 'video' | 'document', caption?: string) => {
    if (!user) return;
    const safeName = file.name.replace(/[^\w.\-]+/g, '_');
    const path = `${user.id}/${Date.now()}-${safeName}`;
    await supabase.storage.from('message-media').upload(path, file, { contentType: file.type || undefined });
    const { data: { publicUrl } } = supabase.storage.from('message-media').getPublicUrl(path);
    sendMessage(caption || file.name, kind, publicUrl);
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const kind = file.type.startsWith('video') ? 'video' : file.type.startsWith('image') ? 'image' : 'document';
    await uploadAndSend(file, kind);
    e.target.value = '';
  };

  // Built-in scanner → PDF. Camera capture on mobile (capture="environment"),
  // file picker on desktop. Multiple images are stitched into one PDF.
  const handleScanToPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    try {
      toast.message('Converting to PDF…');
      const blob = await imagesToPdf(files);
      const pdfFile = new File([blob], `scan-${Date.now()}.pdf`, { type: 'application/pdf' });
      await uploadAndSend(pdfFile, 'document', pdfFile.name);
      toast.success('PDF sent');
    } catch (err: any) {
      toast.error(err?.message || 'Could not build PDF');
    } finally {
      e.target.value = '';
    }
  };

  const handleForward = async (targetConvId: string) => {
    if (!forwardMsg) return;
    await forwardMessage(forwardMsg, targetConvId);
    toast.success('Message forwarded');
    setForwardMsg(null);
  };

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    await reportUser(conversation.participant_user_id, reportReason);
    toast.success('Report submitted');
    setShowReport(false);
    setReportReason('');
  };

  const handleToggleDisappearing = async (duration: string | null) => {
    if (!user) return;
    await supabase
      .from('conversation_participants')
      .update({ disappearing_duration: duration })
      .eq('conversation_id', conversation.id)
      .eq('user_id', user.id);
    toast.success(duration ? `Disappearing messages: ${duration}` : 'Disappearing messages off');
    setShowDisappearing(false);
  };

  const quickEmojis = ['❤️', '👍', '😂', '😮', '😢', '🙏'];

  const onlineText = conversation.type === 'group'
    ? `${conversation.name || 'Group'}`
    : conversation.participant_online
      ? 'online'
      : conversation.participant_last_seen
        ? `last seen ${formatDistanceToNow(new Date(conversation.participant_last_seen), { addSuffix: true })}`
        : 'offline';

  const chatBgStyle: React.CSSProperties = conversation.custom_theme_url
    ? { backgroundImage: `url(${conversation.custom_theme_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: 'var(--chat-background)' };

  const displayName = conversation.type === 'group' ? (conversation.name || 'Group') : conversation.participant_name;

  // Find replied message content
  const getReplyContent = (replyToId: string | null) => {
    if (!replyToId) return null;
    return messages.find(m => m.id === replyToId);
  };

  if (showGroupInfo && conversation.type === 'group') {
    return (
      <GroupInfoScreen
        conversation={conversation}
        onBack={() => setShowGroupInfo(false)}
        onLeft={onBack}
      />
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-3 py-3">
        <button onClick={onBack} className="text-muted-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => conversation.type === 'group' && setShowGroupInfo(true)}
          className="flex flex-1 items-center gap-3 text-left"
          aria-label={conversation.type === 'group' ? 'Open group info' : 'Profile'}
        >
          <Avatar name={displayName} isOnline={conversation.participant_online} avatarUrl={conversation.type === 'group' ? conversation.avatar_url : conversation.participant_avatar} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-foreground truncate">{displayName}</p>
              {conversation.is_pinned && <Pin className="h-3 w-3 text-primary rotate-45" />}
              {conversation.type === 'group' && <Users className="h-3 w-3 text-muted-foreground" />}
            </div>
            <p className="text-xs text-muted-foreground">
              {typingUsers.length > 0 ? 'typing...' : onlineText}
            </p>
          </div>
        </button>
        {conversation.type !== 'group' && (
          <>
            <button
              onClick={async () => {
                try {
                  const c = await startCall(conversation.participant_user_id, 'audio', conversation.id);
                  if (c) setActiveCall({ id: c.id, type: 'audio' });
                } catch (e: any) { toast.error(e.message); }
              }}
              className="p-2 text-muted-foreground hover:text-primary"
              aria-label="Voice call"
            >
              <Phone className="h-5 w-5" />
            </button>
            <button
              onClick={async () => {
                try {
                  const c = await startCall(conversation.participant_user_id, 'video', conversation.id);
                  if (c) setActiveCall({ id: c.id, type: 'video' });
                } catch (e: any) { toast.error(e.message); }
              }}
              className="p-2 text-muted-foreground hover:text-primary"
              aria-label="Video call"
            >
              <Video className="h-5 w-5" />
            </button>
          </>
        )}
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
            <DropdownMenuItem onClick={() => setShowDisappearing(true)}>
              <Clock className="mr-2 h-4 w-4" />
              Disappearing Messages
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowLabelPicker(true)}>
              <Tag className="mr-2 h-4 w-4" />
              Manage Labels
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleShowDeleted}>
              {showDeleted ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {showDeleted ? 'Hide deleted messages' : 'Show deleted messages'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {conversation.type !== 'group' && (
              <>
                <DropdownMenuItem onClick={() => blocked ? unblockUser(conversation.participant_user_id) : blockUser(conversation.participant_user_id)}>
                  <Ban className="mr-2 h-4 w-4" />
                  {blocked ? 'Unblock User' : 'Block User'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowReport(true)} className="text-destructive">
                  <Flag className="mr-2 h-4 w-4" />
                  Report User
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <input ref={themeInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) onSetTheme(conversation.id, file); e.target.value = ''; }} />
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 space-y-2" style={chatBgStyle}>
        {loading && <p className="text-center text-sm text-muted-foreground">Loading...</p>}
        {messages.map((msg) => {
          const isMine = msg.sender_id === user?.id;
          // Receiver-side preference: hide the message entirely when the sender
          // has flagged delete-for-everyone, unless this receiver has opted in
          // to keep seeing such messages via the chat menu toggle.
          if (!isMine && msg.deleted_by_sender && !showDeleted) return null;
          const showDeleteNotice = msg.deleted_by_sender && !isMine && showDeleted;
          const repliedMsg = getReplyContent(msg.reply_to_id);
          const isForwarded = !!(msg as any).forwarded_from_id;

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`group relative max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  isMine
                    ? 'rounded-br-md bg-chat-sent text-chat-sent-foreground'
                    : 'rounded-bl-md bg-chat-received text-chat-received-foreground'
                }`}
              >
                {/* Reply preview */}
                {repliedMsg && (
                  <div className="mb-1 rounded-lg bg-background/20 px-3 py-1.5 border-l-2 border-primary">
                    <p className="text-[10px] font-semibold text-primary">
                      {repliedMsg.sender_id === user?.id ? 'You' : displayName}
                    </p>
                    <p className="text-xs opacity-70 truncate">{repliedMsg.content}</p>
                  </div>
                )}

                {isForwarded && (
                  <p className="text-[10px] italic text-muted-foreground/60 mb-1">
                    <Forward className="inline h-3 w-3 mr-0.5" />Forwarded
                  </p>
                )}

                {showDeleteNotice && (
                  <div className="mb-1 flex items-center gap-1 text-xs text-warning/80">
                    <AlertCircle className="h-3 w-3" />
                    Sender tried to delete this — visible because you enabled "Show deleted messages"
                  </div>
                )}

                {isMine && msg.deleted_by_sender ? (
                  <p className="italic text-sm opacity-60">🚫 You deleted this message</p>
                ) : msg.content_type === 'image' && msg.media_url ? (
                  <img src={msg.media_url} alt="" className="rounded-lg max-w-full" loading="lazy" />
                ) : msg.content_type === 'video' && msg.media_url ? (
                  <video src={msg.media_url} controls className="rounded-lg max-w-full" />
                ) : msg.content_type === 'document' && msg.media_url ? (
                  <a href={msg.media_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg bg-background/20 px-3 py-2 text-sm hover:underline">
                    <FileText className="h-4 w-4" /> {msg.content || 'Document'}
                  </a>
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

                {/* Action buttons on hover */}
                <div className="absolute -top-3 right-0 hidden group-hover:flex gap-1 bg-card rounded-full shadow-lg px-1 py-0.5">
                  <button onClick={() => setReplyTo(msg)} className="p-1 text-muted-foreground hover:text-foreground">
                    <Reply className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setForwardMsg(msg)} className="p-1 text-muted-foreground hover:text-foreground">
                    <Forward className="h-3.5 w-3.5" />
                  </button>
                  {quickEmojis.slice(0, 3).map(emoji => (
                    <button key={emoji} onClick={() => addReaction(msg.id, emoji)} className="p-1 text-xs">
                      {emoji}
                    </button>
                  ))}
                  {isMine && !msg.deleted_by_sender && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 text-destructive/60 hover:text-destructive">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => deleteForSelf(msg.id)}>
                          Delete for me
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteForEveryone(msg.id)} className="text-destructive">
                          Delete for everyone
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {!isMine && (
                    <button onClick={() => deleteForSelf(msg.id)} className="p-1 text-muted-foreground hover:text-destructive" title="Delete for me">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-chat-received px-4 py-3">
              <div className="flex gap-1">
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '0ms' }} />
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '150ms' }} />
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-2 border-t border-border bg-card px-4 py-2">
          <div className="flex-1 border-l-2 border-primary pl-3">
            <p className="text-xs font-semibold text-primary">
              {replyTo.sender_id === user?.id ? 'You' : displayName}
            </p>
            <p className="text-sm text-muted-foreground truncate">{replyTo.content}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Blocked notice */}
      {blocked ? (
        <div className="border-t border-border bg-card px-4 py-4 text-center">
          <p className="text-sm text-muted-foreground">You blocked this user.</p>
          <button onClick={() => unblockUser(conversation.participant_user_id)} className="text-sm text-primary mt-1">
            Unblock
          </button>
        </div>
      ) : (
        /* Input */
        <div className="border-t border-border bg-card px-3 py-3">
          <div className="flex items-center gap-2">
            <button className="p-2 text-muted-foreground"><Smile className="h-5 w-5" /></button>
            <button onClick={() => mediaInputRef.current?.click()} className="p-2 text-muted-foreground" title="Attach file">
              <Paperclip className="h-5 w-5" />
            </button>
            <button onClick={() => setScanOpen(true)} className="p-2 text-muted-foreground" title="Scan to PDF">
              <ScanLine className="h-5 w-5" />
            </button>
            <input ref={mediaInputRef} type="file" accept="image/*,video/*,.pdf,.doc,.docx" className="hidden" onChange={handleMediaUpload} />
            <input ref={scanInputRef} type="file" className="hidden" />
            <input ref={docInputRef} type="file" className="hidden" />
            <Input
              value={input}
              onChange={e => { setInput(e.target.value); onType(); }}
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
      )}

      {/* Forward dialog */}
      <Dialog open={!!forwardMsg} onOpenChange={() => setForwardMsg(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Forward Message</DialogTitle>
          </DialogHeader>
          <div className="max-h-60 overflow-y-auto space-y-1">
            {conversations.filter(c => c.id !== conversation.id).map(c => (
              <button
                key={c.id}
                onClick={() => handleForward(c.id)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 hover:bg-secondary transition-colors"
              >
                <Avatar name={c.type === 'group' ? (c.name || 'Group') : c.participant_name} avatarUrl={c.type === 'group' ? c.avatar_url : c.participant_avatar} size="sm" />
                <span className="text-sm font-medium">{c.type === 'group' ? (c.name || 'Group') : c.participant_name}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Report dialog */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report User</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {['Spam', 'Harassment', 'Inappropriate content', 'Other'].map(r => (
              <button
                key={r}
                onClick={() => setReportReason(r)}
                className={`w-full rounded-lg px-4 py-3 text-left text-sm transition-colors ${reportReason === r ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}
              >
                {r}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={handleReport} disabled={!reportReason} className="w-full">Submit Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disappearing messages dialog */}
      <Dialog open={showDisappearing} onOpenChange={setShowDisappearing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disappearing Messages</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">Both users must enable this for messages to disappear.</p>
          <div className="space-y-2">
            {[
              { label: 'Off', value: null },
              { label: '24 hours', value: '24h' },
              { label: '7 days', value: '7d' },
            ].map(opt => (
              <button
                key={opt.label}
                onClick={() => handleToggleDisappearing(opt.value)}
                className="w-full rounded-lg bg-secondary px-4 py-3 text-left text-sm text-foreground hover:bg-secondary/80 transition-colors"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      {activeCall && (
        <CallScreen
          callId={activeCall.id}
          calleeId={conversation.participant_user_id}
          calleeName={conversation.participant_name}
          calleeAvatar={conversation.participant_avatar}
          callType={activeCall.type}
          onEnd={() => setActiveCall(null)}
        />
      )}
      <ScanToPdfDialog
        open={scanOpen}
        onOpenChange={setScanOpen}
        onSend={async (pdf) => { await uploadAndSend(pdf, 'document', pdf.name); }}
      />
    </div>
  );
}
