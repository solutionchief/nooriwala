// Compose a broadcast: pick unlimited recipients, send a single message via a 'broadcast' conversation.
// Per-recipient delivery status: tracked locally during the send by inserting participants one-by-one
// so we can show sending/sent/failed and offer per-recipient retry.
import { useEffect, useState } from 'react';
import { ArrowLeft, Search, Check, Send, Loader2, AlertCircle, RotateCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ChatList';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Props { onBack: () => void; onCreated?: (convId: string) => void; }

interface Contact { user_id: string; display_name: string; avatar_url: string | null; }
type Delivery = 'pending' | 'sending' | 'sent' | 'failed';

export default function NewBroadcastScreen({ onBack, onCreated }: Props) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<Record<string, Delivery>>({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .neq('user_id', user.id)
        .order('display_name')
        .limit(1000);
      setContacts(data || []);
    })();
  }, [user]);

  const toggle = (id: string) => setPicked(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const filtered = contacts.filter(c => c.display_name.toLowerCase().includes(query.toLowerCase()));
  const pickedContacts = contacts.filter(c => picked.has(c.user_id));

  const addRecipient = async (cid: string, recipientId: string): Promise<boolean> => {
    setDelivery(d => ({ ...d, [recipientId]: 'sending' }));
    const { error } = await supabase
      .from('conversation_participants')
      .insert({ conversation_id: cid, user_id: recipientId, role: 'member' });
    if (error) {
      setDelivery(d => ({ ...d, [recipientId]: 'failed' }));
      return false;
    }
    setDelivery(d => ({ ...d, [recipientId]: 'sent' }));
    return true;
  };

  const send = async () => {
    if (!user) return;
    if (picked.size === 0) { toast.error('Pick at least one recipient'); return; }
    if (!message.trim()) { toast.error('Write a message'); return; }
    setBusy(true);
    try {
      // 1. Create the broadcast conversation
      const { data: conv, error } = await supabase
        .from('conversations')
        .insert({ type: 'broadcast', name: name.trim() || `Broadcast (${picked.size})`, created_by: user.id })
        .select().single();
      if (error || !conv) throw error || new Error('Failed');
      setConvId(conv.id);

      // 2. Add the sender first
      await supabase.from('conversation_participants')
        .insert({ conversation_id: conv.id, user_id: user.id, role: 'admin' });

      // 3. Add each recipient sequentially so each has its own outcome
      const recipients = Array.from(picked);
      const initial: Record<string, Delivery> = {};
      recipients.forEach(r => { initial[r] = 'pending'; });
      setDelivery(initial);

      let okCount = 0;
      for (const rid of recipients) {
        const ok = await addRecipient(conv.id, rid);
        if (ok) okCount++;
      }

      // 4. Post the message
      const { error: mErr } = await supabase.from('messages').insert({
        conversation_id: conv.id, sender_id: user.id, content: message.trim(), content_type: 'text',
      });
      if (mErr) throw mErr;

      if (okCount === recipients.length) {
        toast.success(`Sent to ${okCount} recipient${okCount === 1 ? '' : 's'}`);
      } else {
        toast.warning(`Sent to ${okCount} of ${recipients.length}. ${recipients.length - okCount} failed — retry below.`);
      }
    } catch (e: any) {
      toast.error(e.message ?? 'Could not send broadcast');
    } finally { setBusy(false); }
  };

  const retry = async (recipientId: string) => {
    if (!convId) return;
    await addRecipient(convId, recipientId);
  };

  const finish = () => {
    if (convId) onCreated?.(convId);
    onBack();
  };

  const inProgress = Object.keys(delivery).length > 0;
  const hasFailures = Object.values(delivery).some(d => d === 'failed');

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border bg-card px-3 py-3">
        <button onClick={onBack} className="text-muted-foreground"><ArrowLeft className="h-5 w-5" /></button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-foreground">New Broadcast</h1>
          <p className="text-xs text-muted-foreground">{picked.size} recipient{picked.size === 1 ? '' : 's'} selected</p>
        </div>
      </div>

      {!inProgress && (
        <>
          <div className="border-b border-border bg-card p-3 space-y-2">
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Broadcast name (optional)" />
            <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Write your message…" rows={3} className="resize-none" />
          </div>

          <div className="border-b border-border bg-card px-3 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search contacts by name" className="pl-9" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {filtered.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">No contacts match "{query}"</div>
            )}
            {filtered.map(c => {
              const sel = picked.has(c.user_id);
              return (
                <button key={c.user_id} onClick={() => toggle(c.user_id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-card">
                  <Avatar name={c.display_name} avatarUrl={c.avatar_url} />
                  <p className="flex-1 truncate font-medium text-foreground">{c.display_name}</p>
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${sel ? 'bg-primary border-primary' : 'border-border'}`}>
                    {sel && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="border-t border-border bg-card p-3">
            <Button onClick={send} disabled={busy || picked.size === 0 || !message.trim()} className="w-full">
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send to {picked.size}
            </Button>
          </div>
        </>
      )}

      {inProgress && (
        <>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Delivery status</div>
            {pickedContacts.map(c => {
              const s = delivery[c.user_id] ?? 'pending';
              return (
                <div key={c.user_id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar name={c.display_name} avatarUrl={c.avatar_url} />
                  <p className="flex-1 truncate font-medium text-foreground">{c.display_name}</p>
                  {s === 'pending' && <span className="text-xs text-muted-foreground">Queued</span>}
                  {s === 'sending' && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" /> Sending
                    </span>
                  )}
                  {s === 'sent' && (
                    <span className="flex items-center gap-1 text-xs font-medium text-primary">
                      <Check className="h-3.5 w-3.5" /> Sent
                    </span>
                  )}
                  {s === 'failed' && (
                    <button onClick={() => retry(c.user_id)} className="flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/25">
                      <AlertCircle className="h-3 w-3" /> Failed
                      <RotateCw className="h-3 w-3 ml-1" /> Retry
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <div className="border-t border-border bg-card p-3 flex gap-2">
            {hasFailures && (
              <Button
                variant="outline"
                onClick={async () => {
                  for (const [rid, st] of Object.entries(delivery)) if (st === 'failed') await retry(rid);
                }}
                className="flex-1"
              >
                <RotateCw className="mr-2 h-4 w-4" /> Retry all failed
              </Button>
            )}
            <Button onClick={finish} className="flex-1">Done</Button>
          </div>
        </>
      )}
    </div>
  );
}
