import { useState } from 'react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useLabels } from '@/hooks/useLabels';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const COLORS = ['#22c55e', '#3b82f6', '#f97316', '#a855f7', '#ef4444', '#eab308', '#ec4899', '#14b8a6', '#6366f1', '#f59e0b', '#84cc16', '#06b6d4'];

export default function LabelsManager({ onBack }: { onBack: () => void }) {
  const { labels, createLabel, deleteLabel } = useLabels();
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);

  const handleAdd = async () => {
    if (!name.trim()) return;
    if (labels.length >= 20) { toast.error('Max 20 labels'); return; }
    try {
      await createLabel(name, color);
      setName('');
      toast.success('Label added');
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-4">
        <button onClick={onBack}><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="text-lg font-bold text-foreground">Labels ({labels.length}/20)</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="rounded-xl bg-card p-4 space-y-2">
          <Input placeholder="Label name" value={name} onChange={e => setName(e.target.value)} />
          <div className="flex flex-wrap gap-1.5">
            {COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)} className={`h-7 w-7 rounded-full ${color === c ? 'ring-2 ring-offset-2 ring-foreground ring-offset-card' : ''}`} style={{ background: c }} />
            ))}
          </div>
          <Button onClick={handleAdd} className="w-full"><Plus className="h-4 w-4 mr-1" />Add Label</Button>
        </div>

        <div className="rounded-xl bg-card divide-y divide-border">
          {labels.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">No labels yet</p>}
          {labels.map(l => (
            <div key={l.id} className="flex items-center gap-3 p-3">
              <div className="h-3 w-3 rounded-full" style={{ background: l.color }} />
              <span className="flex-1 text-sm text-foreground">{l.name}</span>
              <button onClick={() => deleteLabel(l.id)} className="text-destructive p-1"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
