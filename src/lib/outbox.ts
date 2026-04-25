// Offline message outbox using IndexedDB.
// Queues messages while offline, flushes when connection returns.
import { supabase } from '@/integrations/supabase/client';

const DB_NAME = 'chief-messenger-outbox';
const STORE = 'messages';
const VERSION = 1;

export interface OutboxItem {
  client_id: string;
  user_id: string;
  conversation_id: string;
  content: string;
  content_type: string;
  media_url: string | null;
  reply_to_id: string | null;
  created_at: string;
  status: 'queued' | 'sending' | 'failed';
  attempts: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'client_id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const s = t.objectStore(STORE);
    const r = fn(s);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

export async function enqueue(item: Omit<OutboxItem, 'attempts' | 'status'>): Promise<void> {
  const full: OutboxItem = { ...item, status: 'queued', attempts: 0 };
  await tx('readwrite', s => s.put(full));
  notifyChange();
}

export async function listOutbox(conversationId?: string): Promise<OutboxItem[]> {
  const all = await tx<OutboxItem[]>('readonly', s => s.getAll() as IDBRequest<OutboxItem[]>);
  return conversationId ? all.filter(i => i.conversation_id === conversationId) : all;
}

export async function remove(client_id: string): Promise<void> {
  await tx('readwrite', s => s.delete(client_id));
  notifyChange();
}

async function markStatus(client_id: string, status: OutboxItem['status'], attempts?: number) {
  const item = await tx<OutboxItem | undefined>('readonly', s => s.get(client_id) as IDBRequest<OutboxItem | undefined>);
  if (!item) return;
  item.status = status;
  if (attempts !== undefined) item.attempts = attempts;
  await tx('readwrite', s => s.put(item));
  notifyChange();
}

let flushing = false;
export async function flush(): Promise<void> {
  if (flushing || !navigator.onLine) return;
  flushing = true;
  try {
    const items = await listOutbox();
    for (const item of items.filter(i => i.status !== 'sending')) {
      await markStatus(item.client_id, 'sending');
      try {
        const { error } = await supabase.from('messages').insert({
          conversation_id: item.conversation_id,
          sender_id: item.user_id,
          content: item.content,
          content_type: item.content_type,
          media_url: item.media_url,
          reply_to_id: item.reply_to_id,
          status: 'sent',
        });
        if (error) throw error;
        await supabase.from('outbox_messages').upsert({
          user_id: item.user_id,
          client_id: item.client_id,
          conversation_id: item.conversation_id,
          status: 'sent',
          sent_at: new Date().toISOString(),
        }, { onConflict: 'user_id,client_id' });
        await remove(item.client_id);
      } catch (e) {
        await markStatus(item.client_id, 'failed', item.attempts + 1);
      }
    }
  } finally {
    flushing = false;
  }
}

const listeners = new Set<() => void>();
function notifyChange() { listeners.forEach(l => l()); }
export function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

// Auto-flush on reconnect
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { flush(); });
  // Periodic retry
  setInterval(() => { if (navigator.onLine) flush(); }, 15000);
}

export function isOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}
