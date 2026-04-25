import { useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { useLabels } from '@/hooks/useLabels';
import { useAuth } from '@/contexts/AuthContext';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { enqueue, flush, isOnline } from '@/lib/outbox';

export default function BroadcastComposer({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const { labels, convLabels } = useLabels();
  const [selectedLabel, setSelectedLabel] = useState<string>('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const recipientCount = selectedLabel
    ? new Set(convLabels.filter(c => c.label_id === selectedLabel).map(c => c.conversation_id)).size
    : 0;

  const send = async () => {
    if (!user || !text.trim() || !selectedLabel) return;
    setSending(true);
    try {
      const convIds = Array.from(new Set(convLabels.filter(c => c.label_id === selectedLabel).map(c => c.conversation_id)));
      for (const conversation_id of convIds) {
        const client_id = `bc-${user.id}-${conversation_id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        await enqueue({
          client_id,
          user_id: user.id,
          conversation_id,
          content: text.trim(),
          content_type: 'text',
          media_url: null,
          reply_to_id: null,
          created_at: new Date().toISOString(),
        });
      }
      if (isOnline()) flush();
      toast.success(`Broadcast queued to ${convIds.length} chat(s)`);
      setText('');
    } catch (e: any) { toast.error(e.message); }
    setSending(false);
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-4">
        <button onClick={onBack}><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="text-lg font-bold text-foreground">Broadcast</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Send to label</p>
          {labels.length === 0 ? (
            <p className="text-sm text-muted-foreground">Create a label first.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {labels.map(l => (
                <button
                  key={l.id}
                  onClick={() => setSelectedLabel(l.id)}
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition ${selectedLabel === l.id ? 'ring-2 ring-primary' : ''}`}
                  style={{ background: `${l.color}30`, color: l.color }}
                >
                  <div className="h-2 w-2 rounded-full" style={{ background: l.color }} />
                  {l.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedLabel && (
          <p className="text-xs text-muted-foreground">{recipientCount} chat(s) will receive this message.</p>
        )}

        <Textarea placeholder="Message..." value={text} onChange={e => setText(e.target.value)} rows={5} />

        <Button onClick={send} disabled={!selectedLabel || !text.trim() || sending} className="w-full">
          <Send className="h-4 w-4 mr-1" />Send Broadcast
        </Button>
      </div>
    </div>
  );
}
