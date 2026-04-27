// Compose a broadcast: pick unlimited recipients, send a single message that fans out via group conversation type 'broadcast'.
import { useEffect, useState } from 'react';
import { ArrowLeft, Search, Check, Send, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ChatList';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Props { onBack: () => void; onCreated?: (convId: string) => void; }

interface Contact { user_id: string; display_name: string; avatar_url: string | null; }

export default function NewBroadcastScreen({ onBack, onCreated }: Props) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

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

  const send = async () => {
    if (!user) return;
    if (picked.size === 0) { toast.error('Pick at least one recipient'); return; }
    if (!message.trim()) { toast.error('Write a message'); return; }
    setBusy(true);
    try {
      const { data: conv, error } = await supabase
        .from('conversations')
        .insert({ type: 'broadcast', name: name.trim() || `Broadcast (${picked.size})`, created_by: user.id })
        .select().single();
      if (error || !conv) throw error || new Error('Failed');

      const rows = [{ conversation_id: conv.id, user_id: user.id, role: 'admin' as const },
        ...Array.from(picked).map(uid => ({ conversation_id: conv.id, user_id: uid, role: 'member' as const }))];
      const { error: pErr } = await supabase.from('conversation_participants').insert(rows);
      if (pErr) throw pErr;

      const { error: mErr } = await supabase.from('messages').insert({
        conversation_id: conv.id, sender_id: user.id, content: message.trim(), content_type: 'text',
      });
      if (mErr) throw mErr;

      toast.success(`Sent to ${picked.size} recipient${picked.size > 1 ? 's' : ''}`);
      onCreated?.(conv.id);
      onBack();
    } catch (e: any) {
      toast.error(e.message ?? 'Could not send broadcast');
    } finally { setBusy(false); }
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border bg-card px-3 py-3">
        <button onClick={onBack} className="text-muted-foreground"><ArrowLeft className="h-5 w-5" /></button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-foreground">New Broadcast</h1>
          <p className="text-xs text-muted-foreground">{picked.size} recipient{picked.size === 1 ? '' : 's'} selected</p>
        </div>
      </div>

      <div className="border-b border-border bg-card p-3 space-y-2">
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Broadcast name (optional)" />
        <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Write your message…" rows={3} className="resize-none" />
      </div>

      <div className="border-b border-border bg-card px-3 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search contacts" className="pl-9" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border">
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
    </div>
  );
}
