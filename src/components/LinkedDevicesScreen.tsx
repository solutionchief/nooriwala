import { useState } from 'react';
import { ArrowLeft, Smartphone, Plus, Trash2, Monitor, Tablet } from 'lucide-react';
import { useLinkedDevices } from '@/hooks/useLinkedDevices';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export default function LinkedDevicesScreen({ onBack }: { onBack: () => void }) {
  const { devices, loading, addDevice, removeDevice } = useLinkedDevices();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState('Web');
  const [busy, setBusy] = useState(false);
  const [newCode, setNewCode] = useState<string | null>(null);

  const link = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const d = await addDevice(name.trim(), platform);
      setNewCode(d.device_code);
      setName('');
      toast.success('Device linked');
    } catch (e: any) { toast.error(e.message); }
    setBusy(false);
  };

  const iconFor = (p: string | null) => {
    if (!p) return Smartphone;
    if (/desktop|mac|win|linux|web/i.test(p)) return Monitor;
    if (/tab|ipad/i.test(p)) return Tablet;
    return Smartphone;
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-4">
        <button onClick={onBack}><ArrowLeft className="h-5 w-5 text-muted-foreground" /></button>
        <h1 className="text-lg font-bold text-foreground">Linked Devices</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <Button onClick={() => { setAdding(true); setNewCode(null); }} className="w-full">
            <Plus className="mr-1 h-4 w-4" /> Link a device
          </Button>
        </div>

        {adding && (
          <div className="mx-4 mb-4 rounded-xl border border-border bg-card p-4 space-y-3">
            {newCode ? (
              <>
                <p className="text-sm font-semibold text-foreground">Linking code</p>
                <div className="rounded-lg bg-secondary p-4 text-center font-mono text-xl tracking-wider text-primary">{newCode}</div>
                <p className="text-xs text-muted-foreground">Open Noori Wala on your other device and enter this code to complete linking.</p>
                <Button className="w-full" onClick={() => { setAdding(false); setNewCode(null); }}>Done</Button>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-foreground">New device</p>
                <Input placeholder="Device name (e.g. My Laptop)" value={name} onChange={e => setName(e.target.value)} />
                <div className="flex gap-2">
                  {['Web', 'Desktop', 'Tablet'].map(p => (
                    <button key={p} onClick={() => setPlatform(p)} className={`flex-1 rounded-md py-2 text-xs font-semibold ${platform === p ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>{p}</button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" className="flex-1" onClick={() => setAdding(false)}>Cancel</Button>
                  <Button className="flex-1" onClick={link} disabled={busy || !name.trim()}>Generate code</Button>
                </div>
              </>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : devices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <Smartphone className="h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-semibold text-foreground">No linked devices</p>
            <p className="mt-1 text-sm text-muted-foreground">Use Noori Wala on web, desktop or tablet by linking this account.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {devices.map(d => {
              const Icon = iconFor(d.platform);
              return (
                <li key={d.id} className="flex items-center gap-3 px-4 py-3">
                  <Icon className="h-6 w-6 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{d.device_name}</p>
                    <p className="text-xs text-muted-foreground">{d.platform || 'Device'} · active {formatDistanceToNow(new Date(d.last_active_at), { addSuffix: true })}</p>
                  </div>
                  <button onClick={() => removeDevice(d.id)} className="text-muted-foreground hover:text-destructive" aria-label="Remove device">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
