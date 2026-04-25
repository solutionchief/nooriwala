import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, PhoneOff, Video, Mic, MicOff, VideoOff } from 'lucide-react';
import { Avatar } from '@/components/ChatList';
import { useCalls } from '@/hooks/useCalls';

interface CallScreenProps {
  callId: string;
  calleeId: string;
  calleeName: string;
  calleeAvatar: string | null;
  callType: 'audio' | 'video';
  onEnd: () => void;
}

export default function CallScreen({ callId, calleeName, calleeAvatar, callType, onEnd }: CallScreenProps) {
  const { endCall } = useCalls();
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Simulate ringing → connected after 3s (placeholder; real WebRTC requires signaling server)
    const ringTimer = setTimeout(() => setConnected(true), 3000);
    return () => clearTimeout(ringTimer);
  }, []);

  useEffect(() => {
    if (!connected) return;
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [connected]);

  const handleEnd = async () => {
    await endCall(callId, connected ? 'completed' : 'canceled', seconds);
    onEnd();
  };

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-background to-card">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <motion.div
          animate={connected ? {} : { scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <Avatar name={calleeName} avatarUrl={calleeAvatar} size="lg" />
        </motion.div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">{calleeName}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {connected ? fmt(seconds) : callType === 'video' ? 'Video calling…' : 'Calling…'}
          </p>
          <p className="mt-3 text-xs text-muted-foreground/70">
            Call signaling is in beta — connection simulated
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 pb-12">
        <button
          onClick={() => setMuted(m => !m)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-foreground"
        >
          {muted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </button>
        {callType === 'video' && (
          <button
            onClick={() => setVideoOff(v => !v)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-foreground"
          >
            {videoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
          </button>
        )}
        <button
          onClick={handleEnd}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg"
        >
          <PhoneOff className="h-7 w-7" />
        </button>
      </div>
    </div>
  );
}
