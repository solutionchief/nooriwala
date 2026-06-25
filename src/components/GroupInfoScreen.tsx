import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Crown, LogOut, Plus, Search, ShieldCheck, ShieldOff, UserMinus, X } from 'lucide-react';
import { Avatar } from '@/components/ChatList';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { ConversationWithDetails } from '@/hooks/useConversations';
import { toast } from 'sonner';

interface Props {
  conversation: ConversationWithDetails;
  onBack: () => void;
  onLeft: () => void;
}

interface Member {
  user_id: string;
  role: string;
  display_name: string;
  avatar_url: string | null;
  is_online: boolean;
}

export default function GroupInfoScreen({ conversation, onBack, onLeft }: Props) {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [createdBy, setCreatedBy] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<Member | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: conv }, { data: parts }] = await Promise.all([
      supabase.from('conversations').select('created_by').eq('id', conversation.id).maybeSingle(),
      supabase.from('conversation_participants').select('user_id, role').eq('conversation_id', conversation.id),
    ]);
    setCreatedBy(conv?.created_by ?? null);
    const ids = (parts || []).map(p => p.user_id);
    const { data: profs } = ids.length
      ? await supabase.from('profiles').select('user_id, display_name, avatar_url, is_online').in('user_id', ids)
      : { data: [] as any };
    const pMap: Record<string, any> = {};
    profs?.forEach(p => { pMap[p.user_id] = p; });
    const list: Member[] = (parts || []).map(p => ({
      user_id: p.user_id,
      role: p.role || 'member',
      display_name: pMap[p.user_id]?.display_name || 'User',
      avatar_url: pMap[p.user_id]?.avatar_url || null,
      is_online: !!pMap[p.user_id]?.is_online,
    })).sort((a, b) => {
      if (a.role === 'admin' && b.role !== 'admin') return -1;
      if (b.role === 'admin' && a.role !== 'admin') return 1;
      return a.display_name.localeCompare(b.display_name);
    });
    setMembers(list);
    setLoading(false);
  }, [conversation.id]);

  useEffect(() => { load(); }, [load]);

  const me = members.find(m => m.user_id === user?.id);
  const iAmAdmin = me?.role === 'admin' || user?.id === createdBy;

  const setRole = async (target: Member, role: 'admin' | 'member') => {
    const { error } = await supabase
      .from('conversation_participants')
      .update({ role })
      .eq('conversation_id', conversation.id)
      .eq('user_id', target.user_id);
    if (error) { toast.error(error.message); return; }
    toast.success(role === 'admin' ? `${target.display_name} is now an admin` : `${target.display_name} is no longer an admin`);
    load();
  };

  const removeMember = async (target: Member) => {
    const { error } = await supabase
      .from('conversation_participants')
      .delete()
      .eq('conversation_id', conversation.id)
      .eq('user_id', target.user_id);
    if (error) { toast.error(error.message); return; }
    toast.success(`${target.display_name} removed`);
    setConfirmRemove(null);
    load();
  };

  const leaveGroup = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('conversation_participants')
      .delete()
      .eq('conversation_id', conversation.id)
      .eq('user_id', user.id);
    if (error) { toast.error(error.message); return; }
    toast.success('You left the group');
    setConfirmLeave(false);
    onLeft();
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border bg-card px-3 py-3">
        <button onClick={onBack}><ArrowLeft className="h-5 w-5 text-muted-foreground" /></button>
        <h1 className="text-lg font-semibold">Group info</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center px-4 py-6 border-b border-border">
          {conversation.avatar_url ? (
            <img src={conversation.avatar_url} alt="" className="h-24 w-24 rounded-full object-cover" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/20 text-2xl font-bold text-primary">
              {(conversation.name || 'G')[0]?.toUpperCase()}
            </div>
          )}
          <h2 className="mt-3 text-xl font-bold text-foreground">{conversation.name || 'Group'}</h2>
          <p className="text-xs text-muted-foreground">{members.length} member{members.length === 1 ? '' : 's'}</p>
        </div>

        <div className="px-4 py-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Members</p>
          {iAmAdmin && (
            <Button size="sm" variant="secondary" onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {members.map(m => {
              const isMe = m.user_id === user?.id;
              const isCreator = m.user_id === createdBy;
              const canActOn = iAmAdmin && !isMe && !isCreator;
              return (
                <li key={m.user_id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar name={m.display_name} avatarUrl={m.avatar_url} isOnline={m.is_online} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {m.display_name}{isMe && ' (You)'}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {isCreator && (<><Crown className="h-3 w-3 text-amber-500" /> Creator</>)}
                      {!isCreator && m.role === 'admin' && (<><ShieldCheck className="h-3 w-3 text-primary" /> Admin</>)}
                      {!isCreator && m.role !== 'admin' && 'Member'}
                    </div>
                  </div>
                  {canActOn && (
                    <div className="flex items-center gap-1">
                      {m.role === 'admin' ? (
                        <button onClick={() => setRole(m, 'member')} title="Dismiss as admin" className="p-2 text-muted-foreground hover:text-foreground">
                          <ShieldOff className="h-4 w-4" />
                        </button>
                      ) : (
                        <button onClick={() => setRole(m, 'admin')} title="Make admin" className="p-2 text-muted-foreground hover:text-primary">
                          <ShieldCheck className="h-4 w-4" />
                        </button>
                      )}
                      <button onClick={() => setConfirmRemove(m)} title="Remove from group" className="p-2 text-muted-foreground hover:text-destructive">
                        <UserMinus className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className="p-4">
          <Button variant="destructive" className="w-full" onClick={() => setConfirmLeave(true)}>
            <LogOut className="h-4 w-4 mr-2" /> Leave group
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave this group?</AlertDialogTitle>
            <AlertDialogDescription>
              You will stop receiving messages from this group. You can be re-added by any admin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={leaveGroup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Leave</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmRemove} onOpenChange={(o) => !o && setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {confirmRemove?.display_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will lose access to this group's messages. You can re-add them later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmRemove && removeMember(confirmRemove)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddMembersDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        conversationId={conversation.id}
        existingIds={new Set(members.map(m => m.user_id))}
        onAdded={() => { setShowAdd(false); load(); }}
      />
    </div>
  );
}

function AddMembersDialog({
  open, onOpenChange, conversationId, existingIds, onAdded,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  conversationId: string;
  existingIds: Set<string>;
  onAdded: () => void;
}) {
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [users, setUsers] = useState<{ user_id: string; display_name: string; avatar_url: string | null }[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setPicked(new Set());
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .neq('user_id', user.id)
        .order('display_name');
      setUsers(((data || []) as any).filter((u: any) => !existingIds.has(u.user_id)));
    })();
  }, [open, user, existingIds]);

  const filtered = users.filter(u => u.display_name.toLowerCase().includes(q.toLowerCase()));

  const toggle = (id: string) => {
    setPicked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const add = async () => {
    if (!picked.size) return;
    setBusy(true);
    const rows = Array.from(picked).map(id => ({
      conversation_id: conversationId, user_id: id, role: 'member',
    }));
    const { error } = await supabase.from('conversation_participants').insert(rows);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${rows.length} member${rows.length === 1 ? '' : 's'} added`);
    onAdded();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>Add members</DialogTitle>
        </DialogHeader>
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search contacts…" className="pl-10 bg-secondary border-none" />
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No more contacts to add</p>
          ) : filtered.map(u => {
            const sel = picked.has(u.user_id);
            return (
              <button key={u.user_id} onClick={() => toggle(u.user_id)} className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-secondary/60 text-left">
                <Avatar name={u.display_name} avatarUrl={u.avatar_url} size="sm" />
                <span className="flex-1 text-sm font-medium text-foreground truncate">{u.display_name}</span>
                {sel ? <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">✓</div> : <div className="h-5 w-5 rounded-full border border-border" />}
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-border p-3">
          <p className="text-xs text-muted-foreground">{picked.size} selected</p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}><X className="h-4 w-4 mr-1" />Cancel</Button>
            <Button size="sm" onClick={add} disabled={busy || !picked.size}>{busy ? 'Adding…' : 'Add'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
