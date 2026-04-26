// Offline pending-call queue stored in localStorage (small payloads, simple)
export interface PendingCall {
  id: string; // local id
  calleeId: string;
  calleeName: string;
  calleeAvatar: string | null;
  callType: 'audio' | 'video';
  conversationId?: string;
  queuedAt: number;
}

const KEY = 'cm.pendingCalls.v1';
const listeners = new Set<() => void>();

function read(): PendingCall[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function write(items: PendingCall[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((l) => l());
}

export function listPendingCalls(): PendingCall[] {
  return read();
}

export function enqueuePendingCall(c: Omit<PendingCall, 'id' | 'queuedAt'>): PendingCall {
  const item: PendingCall = { ...c, id: crypto.randomUUID(), queuedAt: Date.now() };
  write([item, ...read()]);
  return item;
}

export function removePendingCall(id: string) {
  write(read().filter((c) => c.id !== id));
}

export function clearPendingCalls() {
  write([]);
}

export function subscribePendingCalls(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
