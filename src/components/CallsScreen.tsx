import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useCalls, type CallRecord } from '@/hooks/useCalls';
import { Avatar } from '@/components/ChatList';

interface CallsScreenProps {
  onStartCall: (userId: string, name: string, avatar: string | null, type: 'audio' | 'video') => void;
}

export default function CallsScreen({ onStartCall }: CallsScreenProps) {
  const { calls, loading } = useCalls();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
          <Phone className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-foreground">No calls yet</h3>
        <p className="text-sm text-muted-foreground">
          Start a call from a chat or use the new call button.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {calls.map(call => (
        <CallRow key={call.id} call={call} onStartCall={onStartCall} />
      ))}
    </div>
  );
}

function CallRow({ call, onStartCall }: { call: CallRecord; onStartCall: CallsScreenProps['onStartCall'] }) {
  const Icon = call.status === 'missed' || call.status === 'declined'
    ? PhoneMissed
    : call.direction === 'incoming'
    ? PhoneIncoming
    : PhoneOutgoing;
  const iconColor = call.status === 'missed' || call.status === 'declined'
    ? 'text-destructive'
    : 'text-primary';

  return (
    <button
      onClick={() => onStartCall(call.other_user_id, call.other_name, call.other_avatar, call.call_type)}
      className="flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50"
    >
      <Avatar name={call.other_name} avatarUrl={call.other_avatar} />
      <div className="flex-1 text-left">
        <p className="font-medium text-foreground">{call.other_name}</p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
          <span>
            {call.call_type === 'video' ? 'Video' : 'Voice'} · {formatDistanceToNow(new Date(call.started_at), { addSuffix: true })}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); onStartCall(call.other_user_id, call.other_name, call.other_avatar, 'audio'); }}
          className="flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-primary/10"
        >
          <Phone className="h-4.5 w-4.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onStartCall(call.other_user_id, call.other_name, call.other_avatar, 'video'); }}
          className="flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-primary/10"
        >
          <Video className="h-4.5 w-4.5" />
        </button>
      </div>
    </button>
  );
}
