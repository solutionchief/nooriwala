import { useState } from 'react';
import { ArrowLeft, Plus, Users2, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCommunities, useCommunityGroups, type Community } from '@/hooks/useCommunities';
import { useConversations } from '@/hooks/useConversations';
import { toast } from 'sonner';

type View = 'list' | 'create' | 'detail';

export default function CommunitiesScreen({ onBack }: { onBack: () => void }) {
  const { communities, loading, createCommunity, linkGroup, refresh } = useCommunities();
  const { conversations } = useConversations();
  const [view, setView] = useState<View>('list');
  const [active, setActive] = useState<Community | null>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [busy, setBusy] = useState(false);

  const groupConvs = conversations.filter(c => c.type === 'group');

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const c = await createCommunity({ name: name.trim(), description: desc.trim() || undefined });
      toast.success('Community created');
      setName(''); setDesc('');
      setActive(c); setView('detail');
    } catch (e: any) { toast.error(e.message); }
    setBusy(false);
  };

  if (view === 'create') {
    return (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-4">
          <button onClick={() => setView('list')}><ArrowLeft className="h-5 w-5 text-muted-foreground" /></button>
          <h1 className="text-lg font-bold text-foreground">New Community</h1>
        </div>
        <div className="p-4 space-y-3">
          <Input placeholder="Community name" value={name} onChange={e => setName(e.target.value)} />
          <Textarea placeholder="Description (optional)" value={desc} onChange={e => setDesc(e.target.value)} rows={3} />
          <Button onClick={submit} disabled={busy || !name.trim()} className="w-full">Create</Button>
        </div>
      </div>
    );
  }

  if (view === 'detail' && active) {
    return <CommunityDetail community={active} groupConvs={groupConvs} onBack={() => { setView('list'); setActive(null); refresh(); }} linkGroup={linkGroup} />;
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-4">
        <button onClick={onBack}><ArrowLeft className="h-5 w-5 text-muted-foreground" /></button>
        <h1 className="text-lg font-bold text-foreground">Communities</h1>
      </div>
      <div className="p-4">
        <Button onClick={() => setView('create')} className="w-full"><Plus className="mr-1 h-4 w-4" />New community</Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : communities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <Users2 className="h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-semibold text-foreground">No communities yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Group related groups under one community — for example, departments inside a company.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {communities.map(c => (
              <li key={c.id}>
                <button className="flex w-full items-center gap-3 px-4 py-3 hover:bg-card text-left" onClick={() => { setActive(c); setView('detail'); }}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary"><Users2 className="h-5 w-5" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{c.name}</p>
                    {c.description && <p className="text-xs text-muted-foreground truncate">{c.description}</p>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function CommunityDetail({ community, groupConvs, onBack, linkGroup }: {
  community: Community;
  groupConvs: { id: string; name: string | null; participant_name: string }[];
  onBack: () => void;
  linkGroup: (cid: string, convId: string) => Promise<void>;
}) {
  const { groupIds, refresh } = useCommunityGroups(community.id);
  const [adding, setAdding] = useState(false);

  const linked = groupConvs.filter(g => groupIds.includes(g.id));
  const available = groupConvs.filter(g => !groupIds.includes(g.id));

  const link = async (convId: string) => {
    try { await linkGroup(community.id, convId); refresh(); toast.success('Group linked'); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-4">
        <button onClick={onBack}><ArrowLeft className="h-5 w-5 text-muted-foreground" /></button>
        <div>
          <h1 className="text-lg font-bold text-foreground">{community.name}</h1>
          {community.description && <p className="text-xs text-muted-foreground">{community.description}</p>}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Linked groups</p>
        {linked.length === 0 ? (
          <p className="px-4 py-3 text-sm text-muted-foreground">No groups linked yet.</p>
        ) : (
          <ul>
            {linked.map(g => (
              <li key={g.id} className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <Hash className="h-5 w-5 text-primary" />
                <span className="text-foreground">{g.name || g.participant_name}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="px-4 pt-4">
          <Button variant="secondary" className="w-full" onClick={() => setAdding(a => !a)}>
            {adding ? 'Done' : 'Link an existing group'}
          </Button>
        </div>
        {adding && (
          <ul className="mt-2">
            {available.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">No available groups. Create a group first.</p>
            ) : available.map(g => (
              <li key={g.id} className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-foreground">{g.name || g.participant_name}</span>
                <Button size="sm" onClick={() => link(g.id)}>Link</Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
