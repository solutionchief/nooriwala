import { motion } from 'framer-motion';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { Avatar } from '@/components/ChatList';
import type { IncomingCall } from '@/hooks/useCalls';

interface Props {
  call: IncomingCall;
  onAccept: () => void;
  onDecline: () => void;
}

export default function IncomingCallOverlay({ call, onAccept, onDecline }: Props) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-gradient-to-b from-background to-card">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="text-sm uppercase tracking-wider text-muted-foreground">
          Incoming {call.callType === 'video' ? 'video' : 'voice'} call
        </p>
        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ repeat: Infinity, duration: 1.4 }}
        >
          <Avatar name={call.callerName} avatarUrl={call.callerAvatar} size="lg" />
        </motion.div>
        <h2 className="text-2xl font-bold text-foreground">{call.callerName}</h2>
      </div>
      <div className="flex items-center justify-around pb-14">
        <button
          onClick={onDecline}
          className="flex flex-col items-center gap-2"
          aria-label="Decline"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg">
            <PhoneOff className="h-7 w-7" />
          </span>
          <span className="text-xs text-muted-foreground">Decline</span>
        </button>
        <button
          onClick={onAccept}
          className="flex flex-col items-center gap-2"
          aria-label="Accept"
        >
          <motion.span
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
          >
            {call.callType === 'video' ? <Video className="h-7 w-7" /> : <Phone className="h-7 w-7" />}
          </motion.span>
          <span className="text-xs text-muted-foreground">Accept</span>
        </button>
      </div>
    </div>
  );
}
