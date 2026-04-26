import { useEffect, useMemo, useState } from 'react';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Search, X, RefreshCw, CloudOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useCalls, type CallRecord } from '@/hooks/useCalls';
import { Avatar } from '@/components/ChatList';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { listPendingCalls, removePendingCall, subscribePendingCalls, type PendingCall } from '@/lib/callQueue';

type Filter = 'all' | 'missed' | 'incoming' | 'outgoing';

interface CallsScreenProps {
  onStartCall: (userId: string, name: string, avatar: string | null, type: 'audio' | 'video') => void;
}

export default function CallsScreen({ onStartCall }: CallsScreenProps) {
  const { calls, loading } = useCalls();
  const online = useOnlineStatus();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [pending, setPending] = useState<PendingCall[]>(listPendingCalls());

  useEffect(() => subscribePendingCalls(() => setPending(listPendingCalls())), []);

  // Auto-retry pending calls when back online
  useEffect(() => {
    if (!online || pending.length === 0) return;
    // Retry the most recent pending call (oldest queue order)
    const next = pending[0];
    onStartCall(next.calleeId, next.calleeName, next.calleeAvatar, next.callType);
    removePendingCall(next.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  const filtered = useMemo(() => {
    let list = calls;
    if (filter === 'missed') list = list.filter(c => c.status === 'missed' || (c.direction === 'incoming' && c.status === 'declined'));
    else if (filter === 'incoming') list = list.filter(c => c.direction === 'incoming');
    else if (filter === 'outgoing') list = list.filter(c => c.direction === 'outgoing');
    const q = search.trim().toLowerCase();
    if (q) list = list.filter(c => c.other_name.toLowerCase().includes(q));
    return list;
  }, [calls, filter, search]);

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'missed', label: 'Missed' },
    { key: 'incoming', label: 'Incoming' },
    { key: 'outgoing', label: 'Outgoing' },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Search */}
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search calls"
            className="w-full rounded-full border border-border bg-secondary py-2 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground"
              aria-label="Clear"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {/* Filter chips */}
        <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === f.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pending calls banner */}
      {pending.length > 0 && (
        <div className="border-b border-border bg-secondary/40 px-4 py-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <CloudOff className="h-3.5 w-3.5" />
            Pending — will retry when online
          </div>
          <div className="space-y-2">
            {pending.map(p => (
              <div key={p.id} className="flex items-center gap-3 rounded-lg bg-card px-3 py-2">
                <Avatar name={p.calleeName} avatarUrl={p.calleeAvatar} />
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-foreground">{p.calleeName}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.callType === 'video' ? 'Video' : 'Voice'} · queued {formatDistanceToNow(p.queuedAt, { addSuffix: true })}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (online) {
                      onStartCall(p.calleeId, p.calleeName, p.calleeAvatar, p.callType);
                      removePendingCall(p.id);
                    }
                  }}
                  disabled={!online}
                  className="flex h-8 items-center gap-1 rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry
                </button>
                <button
                  onClick={() => removePendingCall(p.id)}
                  className="rounded-full p-1.5 text-muted-foreground hover:text-foreground"
                  aria-label="Remove"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
              <Phone className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground">
              {search || filter !== 'all' ? 'No matching calls' : 'No calls yet'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {search || filter !== 'all'
                ? 'Try a different filter or search.'
                : 'Start a call from a chat or use the new call button.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(call => (
              <CallRow key={call.id} call={call} onStartCall={onStartCall} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CallRow({ call, onStartCall }: { call: CallRecord; onStartCall: CallsScreenProps['onStartCall'] }) {
  const isMissed = call.status === 'missed' || (call.direction === 'incoming' && call.status === 'declined');
  const Icon = isMissed ? PhoneMissed : call.direction === 'incoming' ? PhoneIncoming : PhoneOutgoing;
  const iconColor = isMissed ? 'text-destructive' : 'text-primary';
  const fmtDuration = (s: number) => {
    if (!s) return '';
    const m = Math.floor(s / 60);
    const r = s % 60;
    return ` · ${m}:${r.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50">
      <Avatar name={call.other_name} avatarUrl={call.other_avatar} />
      <div className="flex-1 text-left">
        <p className={`font-medium ${isMissed ? 'text-destructive' : 'text-foreground'}`}>{call.other_name}</p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
          <span>
            {call.call_type === 'video' ? 'Video' : 'Voice'}
            {fmtDuration(call.duration_seconds)}
            {' · '}
            {formatDistanceToNow(new Date(call.started_at), { addSuffix: true })}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onStartCall(call.other_user_id, call.other_name, call.other_avatar, 'audio')}
          className="flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-primary/10"
          aria-label="Voice call"
        >
          <Phone className="h-4 w-4" />
        </button>
        <button
          onClick={() => onStartCall(call.other_user_id, call.other_name, call.other_avatar, 'video')}
          className="flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-primary/10"
          aria-label="Video call"
        >
          <Video className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
