// Simple app lock: stores SHA-256 PIN hash + locks after timeout. Unlocked flag in sessionStorage.
const KEY = 'applock.v1';
const UNLOCK_KEY = 'applock.unlocked';

export interface AppLockPrefs {
  enabled: boolean;
  pinHash: string | null;
  timeoutMin: number; // 0 = immediate, otherwise minutes of inactivity
  lastActiveAt: number;
}
const DEFAULTS: AppLockPrefs = { enabled: false, pinHash: null, timeoutMin: 1, lastActiveAt: Date.now() };

export function loadLock(): AppLockPrefs {
  try { const raw = localStorage.getItem(KEY); return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS; } catch { return DEFAULTS; }
}
export function saveLock(p: AppLockPrefs) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {} }

export async function hashPin(pin: string): Promise<string> {
  const enc = new TextEncoder().encode(pin);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function markUnlocked() { try { sessionStorage.setItem(UNLOCK_KEY, '1'); } catch {} }
export function markLocked() { try { sessionStorage.removeItem(UNLOCK_KEY); } catch {} }
export function isUnlocked() { try { return sessionStorage.getItem(UNLOCK_KEY) === '1'; } catch { return true; } }

export function shouldLockNow(p: AppLockPrefs): boolean {
  if (!p.enabled || !p.pinHash) return false;
  if (isUnlocked() && p.timeoutMin > 0) {
    return Date.now() - p.lastActiveAt > p.timeoutMin * 60 * 1000;
  }
  return !isUnlocked();
}
