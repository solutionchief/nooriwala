import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Radio, Check, X, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useChannels, useChannelPosts, useFollowedFeed, type Channel } from '@/hooks/useChannels';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

type View = 'list' | 'create' | 'channel';

export default function ChannelsScreen() {
  const { user } = useAuth();
  const { myChannels, followed, discover, loading, checkHandle, createChannel, follow, unfollow } = useChannels();
  const { posts: feed } = useFollowedFeed();
  const [view, setView] = useState<View>('list');
  const [active, setActive] = useState<Channel | null>(null);

  if (view === 'create') {
    return <CreateChannel onBack={() => setView('list')} checkHandle={checkHandle} createChannel={createChannel} onCreated={(c) => { setActive(c); setView('channel'); }} />;
  }
  if (view === 'channel' && active) {
    const isOwner = active.owner_id === user?.id;
    const isFollowing = followed.some(c => c.id === active.id);
    return <ChannelDetail channel={active} isOwner={isOwner} isFollowing={isFollowing} onBack={() => { setView('list'); setActive(null); }} onToggleFollow={() => isFollowing ? unfollow(active.id) : follow(active.id)} />;
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="px-4 py-3">
        <Button onClick={() => setView('create')} className="w-full">
          <Plus className="mr-1 h-4 w-4" /> Create channel
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pb-4 space-y-4">
          {myChannels.length > 0 && (
            <Section title="Your channels">
              {myChannels.map(c => <ChannelRow key={c.id} c={c} onClick={() => { setActive(c); setView('channel'); }} />)}
            </Section>
          )}

          {feed.length > 0 && (
            <Section title="Latest from channels you follow">
              <div className="space-y-2">
                {feed.slice(0, 8).map(p => (
                  <div key={p.id} className="mx-4 rounded-xl bg-card p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Radio className="h-3.5 w-3.5 text-primary" />
                      <p className="text-xs font-semibold text-foreground">{p.channel?.name}</p>
                      <span className="text-[10px] text-muted-foreground">· {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</span>
                    </div>
                    {p.media_url && p.content_type === 'image' && <img src={p.media_url} alt="" className="mb-2 max-h-64 w-full rounded-lg object-cover" />}
                    {p.media_url && p.content_type === 'video' && <video src={p.media_url} controls className="mb-2 w-full rounded-lg" />}
                    {p.content && <p className="text-sm text-foreground whitespace-pre-wrap">{p.content}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {followed.length > 0 && (
            <Section title="Following">
              {followed.map(c => <ChannelRow key={c.id} c={c} onClick={() => { setActive(c); setView('channel'); }} />)}
            </Section>
          )}

          {discover.length > 0 && (
            <Section title="Discover">
              {discover.map(c => <ChannelRow key={c.id} c={c} onClick={() => { setActive(c); setView('channel'); }} />)}
            </Section>
          )}

          {myChannels.length === 0 && followed.length === 0 && discover.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
              <Radio className="h-10 w-10 text-muted-foreground" />
              <p className="mt-3 font-semibold text-foreground">No channels yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Create a channel to broadcast updates to your followers.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <div>{children}</div>
    </div>
  );
}

function ChannelRow({ c, onClick }: { c: Channel; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3 hover:bg-card text-left">
      {c.avatar_url ? (
        <img src={c.avatar_url} alt={c.name} className="h-10 w-10 rounded-full object-cover" />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary"><Radio className="h-5 w-5" /></div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground truncate">{c.name}</p>
        <p className="text-xs text-muted-foreground truncate">@{c.handle} · {c.follower_count} followers</p>
      </div>
    </button>
  );
}

function CreateChannel({ onBack, checkHandle, createChannel, onCreated }: {
  onBack: () => void;
  checkHandle: (h: string) => Promise<boolean>;
  createChannel: (i: { handle: string; name: string; description?: string }) => Promise<Channel>;
  onCreated: (c: Channel) => void;
}) {
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [desc, setDesc] = useState('');
  const [available, setAvailable] = useState<null | boolean>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!handle) { setAvailable(null); return; }
    const t = setTimeout(async () => {
      const ok = await checkHandle(handle.toLowerCase().replace(/[^a-z0-9_]/g, ''));
      setAvailable(ok);
    }, 400);
    return () => clearTimeout(t);
  }, [handle, checkHandle]);

  const submit = async () => {
    if (!name.trim() || !handle.trim() || available === false) return;
    setBusy(true);
    try {
      const c = await createChannel({ name: name.trim(), handle: handle.trim(), description: desc.trim() || undefined });
      toast.success('Channel created');
      onCreated(c);
    } catch (e: any) { toast.error(e.message); }
    setBusy(false);
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-4">
        <button onClick={onBack}><ArrowLeft className="h-5 w-5 text-muted-foreground" /></button>
        <h1 className="text-lg font-bold text-foreground">New Channel</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Name</label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="My Channel" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Handle</label>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">@</span>
            <Input value={handle} onChange={e => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="my_channel" />
            {handle && available === true && <Check className="h-4 w-4 text-online" />}
            {handle && available === false && <X className="h-4 w-4 text-destructive" />}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Lowercase letters, numbers and underscores only.</p>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Description (optional)</label>
          <Textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} />
        </div>
        <Button onClick={submit} disabled={busy || !name.trim() || !handle.trim() || available === false} className="w-full">
          {busy ? 'Creating…' : 'Create channel'}
        </Button>
      </div>
    </div>
  );
}

function ChannelDetail({ channel, isOwner, isFollowing, onBack, onToggleFollow }: {
  channel: Channel; isOwner: boolean; isFollowing: boolean; onBack: () => void; onToggleFollow: () => void;
}) {
  const { user } = useAuth();
  const { posts, refresh } = useChannelPosts(channel.id);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  const post = async () => {
    if (!text.trim() || !user) return;
    setPosting(true);
    const { error } = await supabase.from('channel_posts').insert({
      channel_id: channel.id, author_id: user.id, content: text.trim(), content_type: 'text',
    });
    setPosting(false);
    if (error) { toast.error(error.message); return; }
    setText('');
    refresh();
  };

  const postMedia = async (file: File) => {
    if (!user) return;
    setPosting(true);
    const ext = file.name.split('.').pop() || 'bin';
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('message-media').upload(path, file);
    if (upErr) { toast.error(upErr.message); setPosting(false); return; }
    const { data } = supabase.storage.from('message-media').getPublicUrl(path);
    const isVideo = file.type.startsWith('video');
    const { error } = await supabase.from('channel_posts').insert({
      channel_id: channel.id, author_id: user.id,
      content_type: isVideo ? 'video' : 'image', media_url: data.publicUrl,
    });
    setPosting(false);
    if (error) { toast.error(error.message); return; }
    refresh();
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-4">
        <button onClick={onBack}><ArrowLeft className="h-5 w-5 text-muted-foreground" /></button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground truncate">{channel.name}</p>
          <p className="text-xs text-muted-foreground">@{channel.handle} · {channel.follower_count} followers</p>
        </div>
        {!isOwner && (
          <Button variant={isFollowing ? 'secondary' : 'default'} size="sm" onClick={onToggleFollow}>
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
        )}
      </div>

      {isOwner && (
        <div className="border-b border-border p-3 space-y-2">
          <Textarea value={text} onChange={e => setText(e.target.value)} placeholder="Post an update…" rows={2} />
          <div className="flex gap-2">
            <input id="ch-file" type="file" accept="image/*,video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) postMedia(f); }} />
            <Button variant="secondary" size="sm" onClick={() => document.getElementById('ch-file')?.click()} disabled={posting}>Add media</Button>
            <Button size="sm" onClick={post} disabled={posting || !text.trim()} className="ml-auto"><Send className="mr-1 h-3.5 w-3.5" />Post</Button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {channel.description && (
          <div className="rounded-xl bg-card p-3 text-sm text-muted-foreground">{channel.description}</div>
        )}
        {posts.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">No posts yet.</div>
        ) : posts.map(p => (
          <div key={p.id} className="rounded-xl bg-card p-3">
            <p className="text-[10px] text-muted-foreground mb-1">{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</p>
            {p.media_url && p.content_type === 'image' && <img src={p.media_url} alt="" className="mb-2 max-h-72 w-full rounded-lg object-cover" />}
            {p.media_url && p.content_type === 'video' && <video src={p.media_url} controls className="mb-2 w-full rounded-lg" />}
            {p.content && <p className="text-sm text-foreground whitespace-pre-wrap">{p.content}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
