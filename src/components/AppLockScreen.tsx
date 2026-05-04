import { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hashPin, loadLock, saveLock, markUnlocked, markLocked } from '@/lib/appLock';
import { toast } from 'sonner';

export default function AppLockScreen({ onBack }: { onBack: () => void }) {
  const [prefs, setPrefs] = useState(() => loadLock());
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [stage, setStage] = useState<'menu' | 'set' | 'change'>('menu');

  useEffect(() => { saveLock(prefs); }, [prefs]);

  const enable = async () => {
    if (pin.length < 4) return toast.error('PIN must be at least 4 digits');
    if (pin !== confirm) return toast.error('PINs do not match');
    const h = await hashPin(pin);
    setPrefs(p => ({ ...p, enabled: true, pinHash: h, lastActiveAt: Date.now() }));
    markUnlocked();
    setPin(''); setConfirm(''); setStage('menu');
    toast.success('App lock enabled');
  };

  const disable = () => {
    setPrefs(p => ({ ...p, enabled: false, pinHash: null }));
    markLocked();
    toast.success('App lock disabled');
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border bg-card px-3 py-3">
        <button onClick={onBack}><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="text-lg font-semibold">App Lock</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="rounded-xl bg-card p-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">{prefs.enabled ? 'App lock is ON' : 'App lock is OFF'}</p>
            <p className="text-xs text-muted-foreground">Require a PIN to open the app</p>
          </div>
        </div>

        {stage === 'menu' && (
          <div className="space-y-2">
            {!prefs.enabled ? (
              <Button className="w-full" onClick={() => setStage('set')}>Enable App Lock</Button>
            ) : (
              <>
                <Button className="w-full" variant="secondary" onClick={() => setStage('change')}>Change PIN</Button>
                <Button className="w-full" variant="destructive" onClick={disable}>Disable App Lock</Button>
              </>
            )}
            {prefs.enabled && (
              <div className="rounded-xl bg-card p-4 space-y-2">
                <p className="text-sm font-semibold">Auto-lock after</p>
                <div className="flex flex-wrap gap-2">
                  {[0, 1, 5, 30].map(m => (
                    <button key={m} onClick={() => setPrefs(p => ({ ...p, timeoutMin: m }))}
                      className={`rounded-full px-3 py-1 text-xs ${prefs.timeoutMin === m ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}>
                      {m === 0 ? 'Immediately' : m === 1 ? '1 min' : m === 5 ? '5 min' : '30 min'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {(stage === 'set' || stage === 'change') && (
          <div className="space-y-3 rounded-xl bg-card p-4">
            <p className="text-sm font-semibold">Set a 4–8 digit PIN</p>
            <input type="password" inputMode="numeric" pattern="[0-9]*" maxLength={8}
              value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="New PIN" className="w-full rounded-md bg-secondary px-3 py-2 text-center text-lg tracking-widest" />
            <input type="password" inputMode="numeric" pattern="[0-9]*" maxLength={8}
              value={confirm} onChange={e => setConfirm(e.target.value.replace(/\D/g, ''))}
              placeholder="Confirm PIN" className="w-full rounded-md bg-secondary px-3 py-2 text-center text-lg tracking-widest" />
            <div className="flex gap-2">
              <Button className="flex-1" variant="secondary" onClick={() => { setStage('menu'); setPin(''); setConfirm(''); }}>Cancel</Button>
              <Button className="flex-1" onClick={enable}>Save PIN</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
