import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { hashPin, loadLock, saveLock, markUnlocked, markLocked, shouldLockNow, isUnlocked } from '@/lib/appLock';

// Wraps the app and shows a PIN gate when lock is enabled and timeout has elapsed.
export default function AppLockGate({ children }: { children: React.ReactNode }) {
  const [locked, setLocked] = useState(false);
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const check = () => {
      const p = loadLock();
      if (!p.enabled || !p.pinHash) { setLocked(false); return; }
      if (!isUnlocked() || shouldLockNow(p)) { markLocked(); setLocked(true); }
    };
    check();

    const onHide = () => {
      const p = loadLock();
      saveLock({ ...p, lastActiveAt: Date.now() });
    };
    const onShow = () => check();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) onHide(); else onShow();
    });

    const t = setInterval(() => {
      const p = loadLock();
      if (p.enabled && shouldLockNow(p)) { markLocked(); setLocked(true); }
    }, 30_000);
    return () => clearInterval(t);
  }, []);

  const submit = async () => {
    const p = loadLock();
    const h = await hashPin(pin);
    if (h === p.pinHash) {
      markUnlocked();
      saveLock({ ...p, lastActiveAt: Date.now() });
      setPin('');
      setLocked(false);
    } else {
      setShake(true); setTimeout(() => setShake(false), 400);
      setPin('');
    }
  };

  if (!locked) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background px-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 mb-4">
        <Lock className="h-9 w-9 text-primary" />
      </div>
      <h2 className="text-xl font-bold mb-1">Chief Messenger Locked</h2>
      <p className="mb-5 text-sm text-muted-foreground">Enter your PIN to continue</p>
      <input
        autoFocus
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={8}
        value={pin}
        onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
        onKeyDown={e => { if (e.key === 'Enter') submit(); }}
        className={`w-56 rounded-lg bg-secondary px-4 py-3 text-center text-2xl tracking-[0.5em] ${shake ? 'animate-pulse' : ''}`}
      />
      <button onClick={submit} className="mt-4 rounded-lg bg-primary px-8 py-2.5 font-semibold text-primary-foreground">Unlock</button>
    </div>
  );
}
