import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Eye, X, Camera, Type, Trash2, Send } from 'lucide-react';
import { Avatar } from '@/components/ChatList';
import { useStatuses, type StatusData } from '@/hooks/useStatuses';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const bgColors = [
  'from-primary to-accent',
  'from-blue-600 to-purple-600',
  'from-emerald-600 to-teal-700',
  'from-orange-500 to-red-600',
  'from-pink-500 to-rose-600',
  'from-indigo-600 to-blue-700',
];

export default function StatusScreen() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { statuses, myStatuses, loading, createStatus, deleteStatus, viewStatus } = useStatuses();
  const [showCreate, setShowCreate] = useState(false);
  const [createMode, setCreateMode] = useState<'text' | 'media'>('text');
  const [statusText, setStatusText] = useState('');
  const [selectedBg, setSelectedBg] = useState(bgColors[0]);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [viewingStatus, setViewingStatus] = useState<StatusData | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    setCreateMode('media');
    e.target.value = '';
  };

  const handlePost = async () => {
    if (createMode === 'text' && !statusText.trim()) return;
    if (createMode === 'media' && !mediaFile) return;

    try {
      await createStatus(
        createMode === 'text' ? statusText : '',
        createMode === 'media' ? (mediaFile!.type.startsWith('video') ? 'video' : 'image') : 'text',
        createMode === 'media' ? mediaFile! : undefined,
        createMode === 'text' ? selectedBg : undefined
      );
      toast.success('Status posted!');
      setShowCreate(false);
      setStatusText('');
      setMediaFile(null);
      setMediaPreview(null);
    } catch {
      toast.error('Failed to post status');
    }
  };

  const handleViewStatus = (status: StatusData) => {
    setViewingStatus(status);
    viewStatus(status.id);
  };

  // Reply to a status by DM'ing the author with a quoted preview
  const sendStatusReply = async () => {
    if (!viewingStatus || !user || !replyText.trim()) return;
    setReplying(true);
    try {
      // Find or create direct conversation
      const { data: myParts } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);
      const myConvIds = (myParts || []).map(p => p.conversation_id);
      let convId: string | null = null;
      if (myConvIds.length) {
        const { data: shared } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', viewingStatus.user_id)
          .in('conversation_id', myConvIds);
        const { data: convs } = shared && shared.length
          ? await supabase.from('conversations').select('id').eq('type', 'direct').in('id', shared.map(s => s.conversation_id))
          : { data: [] as any };
        convId = convs?.[0]?.id ?? null;
      }
      if (!convId) {
        const { data: conv, error } = await supabase
          .from('conversations').insert({ type: 'direct', created_by: user.id }).select().single();
        if (error || !conv) throw error || new Error('Could not start chat');
        await supabase.from('conversation_participants').insert([
          { conversation_id: conv.id, user_id: user.id },
          { conversation_id: conv.id, user_id: viewingStatus.user_id },
        ]);
        convId = conv.id;
      }
      const quote = viewingStatus.content_type === 'text'
        ? `> ${(viewingStatus.content || '').slice(0, 120)}\n\n`
        : `> [${viewingStatus.content_type} status]\n\n`;
      await supabase.from('messages').insert({
        conversation_id: convId,
        sender_id: user.id,
        content: quote + replyText.trim(),
        content_type: 'text',
        status: 'sent',
      });
      toast.success('Reply sent');
      setReplyText('');
      setViewingStatus(null);
    } catch (e: any) {
      toast.error(e.message || 'Could not send reply');
    } finally {
      setReplying(false);
    }
  };

  // Viewing a status fullscreen
  if (viewingStatus) {
    const isOwn = viewingStatus.user_id === user?.id;
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-black">
        <div className="flex items-center gap-3 p-4">
          <button onClick={() => setViewingStatus(null)} className="text-white"><X className="h-6 w-6" /></button>
          <Avatar name={viewingStatus.user_display_name} avatarUrl={viewingStatus.user_avatar_url} size="sm" />
          <div>
            <p className="text-sm font-semibold text-white">{viewingStatus.user_display_name}</p>
            <p className="text-xs text-white/60">{formatDistanceToNow(new Date(viewingStatus.created_at), { addSuffix: true })}</p>
          </div>
        </div>
        <div className={`flex flex-1 items-center justify-center p-8 ${viewingStatus.content_type === 'text' ? `bg-gradient-to-br ${viewingStatus.background_color || bgColors[0]}` : ''}`}>
          {viewingStatus.content_type === 'text' ? (
            <p className="text-center text-2xl font-bold text-white">{viewingStatus.content}</p>
          ) : viewingStatus.content_type === 'image' ? (
            <img src={viewingStatus.media_url!} alt="Status" className="max-h-full max-w-full rounded-xl object-contain" />
          ) : (
            <video src={viewingStatus.media_url!} controls className="max-h-full max-w-full rounded-xl" />
          )}
        </div>
        <div className="flex items-center gap-2 px-4 py-2 text-white/60">
          <Eye className="h-4 w-4" />
          <span className="text-sm">{viewingStatus.viewer_count} views</span>
        </div>
        {!isOwn && (
          <div className="border-t border-white/10 bg-black/80 p-3 flex items-center gap-2">
            <Input
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendStatusReply()}
              placeholder={`Reply to ${viewingStatus.user_display_name}…`}
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
            <button
              onClick={sendStatusReply}
              disabled={!replyText.trim() || replying}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
              aria-label="Send reply"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Create status screen
  if (showCreate) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <button onClick={() => { setShowCreate(false); setMediaFile(null); setMediaPreview(null); }} className="text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-bold text-foreground">Create Status</h2>
        </div>

        <div className="flex gap-2 px-4 py-3">
          <button
            onClick={() => { setCreateMode('text'); setMediaFile(null); setMediaPreview(null); }}
            className={`flex-1 rounded-lg py-2 text-sm font-medium ${createMode === 'text' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
          >
            <Type className="mr-1 inline h-4 w-4" /> Text
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className={`flex-1 rounded-lg py-2 text-sm font-medium ${createMode === 'media' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
          >
            <Camera className="mr-1 inline h-4 w-4" /> Media
          </button>
          <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaSelect} />
        </div>

        {createMode === 'text' ? (
          <div className={`flex flex-1 flex-col items-center justify-center bg-gradient-to-br ${selectedBg} p-8`}>
            <textarea
              value={statusText}
              onChange={e => setStatusText(e.target.value)}
              placeholder="Type a status..."
              className="w-full bg-transparent text-center text-2xl font-bold text-white placeholder:text-white/50 focus:outline-none resize-none"
              rows={4}
              maxLength={300}
              autoFocus
            />
          </div>
        ) : mediaPreview ? (
          <div className="flex flex-1 items-center justify-center bg-black p-4">
            {mediaFile?.type.startsWith('video') ? (
              <video src={mediaPreview} controls className="max-h-full max-w-full rounded-xl" />
            ) : (
              <img src={mediaPreview} alt="Preview" className="max-h-full max-w-full rounded-xl object-contain" />
            )}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            <p>Select an image or video</p>
          </div>
        )}

        {createMode === 'text' && (
          <div className="flex gap-2 px-4 py-3">
            {bgColors.map(bg => (
              <button
                key={bg}
                onClick={() => setSelectedBg(bg)}
                className={`h-8 w-8 rounded-full bg-gradient-to-br ${bg} ${selectedBg === bg ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
              />
            ))}
          </div>
        )}

        <div className="border-t border-border px-4 py-3">
          <Button onClick={handlePost} disabled={createMode === 'text' ? !statusText.trim() : !mediaFile} className="w-full py-6 text-lg font-bold">
            Post Status
          </Button>
        </div>
      </div>
    );
  }

  // Group others' statuses by user
  const grouped = statuses.reduce((acc, s) => {
    if (!acc[s.user_id]) acc[s.user_id] = [];
    acc[s.user_id].push(s);
    return acc;
  }, {} as Record<string, StatusData[]>);

  return (
    <div className="flex flex-col px-4 py-4">
      {/* My Status */}
      <div className="mb-6">
        <button onClick={() => setShowCreate(true)} className="flex w-full items-center gap-3 rounded-xl bg-card p-4">
          <div className="relative">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-14 w-14 rounded-full object-cover" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 text-xl font-bold text-primary">
                {profile?.display_name?.[0]?.toUpperCase() || 'Y'}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Plus className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-left">
            <p className="font-semibold text-foreground">My Status</p>
            <p className="text-sm text-muted-foreground">
              {myStatuses.length > 0
                ? `${myStatuses.length} update${myStatuses.length > 1 ? 's' : ''} • Tap to add`
                : 'Tap to add status update'}
            </p>
          </div>
        </button>

        {/* My recent statuses */}
        {myStatuses.length > 0 && (
          <div className="mt-2 space-y-1">
            {myStatuses.map(s => (
              <div key={s.id} className="flex items-center gap-3 rounded-lg px-4 py-2">
                <div className="flex-1 text-sm text-muted-foreground truncate">
                  {s.content_type === 'text' ? s.content : `📷 ${s.content_type}`}
                </div>
                <span className="text-xs text-muted-foreground">{s.viewer_count} 👁</span>
                <button onClick={() => deleteStatus(s.id)} className="text-destructive/60 hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent updates */}
      {Object.keys(grouped).length > 0 && (
        <>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent updates</p>
          <div className="space-y-2">
            {Object.entries(grouped).map(([userId, userStatuses]) => {
              const latest = userStatuses[0];
              return (
                <motion.button
                  key={userId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => handleViewStatus(latest)}
                  className="flex w-full items-center gap-3 rounded-xl p-3 transition-colors hover:bg-card"
                >
                  <div className="relative">
                    <div className="rounded-full p-0.5" style={{ background: 'conic-gradient(hsl(var(--primary)) 0%, hsl(var(--primary)) 100%)' }}>
                      <div className="rounded-full border-2 border-background">
                        <Avatar name={latest.user_display_name} isOnline={latest.user_is_online} avatarUrl={latest.user_avatar_url} />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-foreground">{latest.user_display_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(latest.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Eye className="h-3 w-3" />
                    {userStatuses.length}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </>
      )}

      {Object.keys(grouped).length === 0 && myStatuses.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
            <Eye className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-semibold text-foreground">No recent updates</p>
          <p className="mt-1 text-sm text-muted-foreground">Status updates from your contacts will appear here</p>
        </div>
      )}
    </div>
  );
}
