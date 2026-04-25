import { useEffect, useState } from 'react';
import { listOutbox, subscribe, type OutboxItem } from '@/lib/outbox';

export function useOnlineStatus() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

export function usePendingOutbox(conversationId?: string) {
  const [items, setItems] = useState<OutboxItem[]>([]);
  useEffect(() => {
    const refresh = () => listOutbox(conversationId).then(setItems);
    refresh();
    return subscribe(refresh);
  }, [conversationId]);
  return items;
}
