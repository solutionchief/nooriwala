import { useState } from 'react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useQuickReplies } from '@/hooks/useQuickReplies';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function QuickRepliesManager({ onBack }: { onBack: () => void }) {
  const { replies, add, remove } = useQuickReplies();
  const [shortcut, setShortcut] = useState('');
  const [message, setMessage] = useState('');

  const handleAdd = async () => {
    if (!shortcut.trim() || !message.trim()) return;
    if (replies.length >= 50) { toast.error('Max 50 quick replies'); return; }
    try {
      await add(shortcut.replace(/^\//, ''), message);
      setShortcut(''); setMessage('');
      toast.success('Quick reply added');
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-4">
        <button onClick={onBack}><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="text-lg font-bold text-foreground">Quick Replies ({replies.length}/50)</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="rounded-xl bg-card p-4 space-y-2">
          <p className="text-xs text-muted-foreground">Type / followed by your shortcut in any chat to use it.</p>
          <Input placeholder="shortcut (e.g. thanks)" value={shortcut} onChange={e => setShortcut(e.target.value)} />
          <Textarea placeholder="Message text" value={message} onChange={e => setMessage(e.target.value)} rows={2} />
          <Button onClick={handleAdd} className="w-full"><Plus className="h-4 w-4 mr-1" />Add</Button>
        </div>

        <div className="rounded-xl bg-card divide-y divide-border">
          {replies.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">No quick replies yet</p>}
          {replies.map(r => (
            <div key={r.id} className="flex items-start gap-2 p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono text-primary">/{r.shortcut}</p>
                <p className="text-sm text-foreground truncate">{r.message}</p>
              </div>
              <button onClick={() => remove(r.id)} className="text-destructive p-1"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
