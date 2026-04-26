import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { PhoneOff, Video, Mic, MicOff, VideoOff, AlertCircle, RefreshCw } from 'lucide-react';
import { Avatar } from '@/components/ChatList';
import { useCalls } from '@/hooks/useCalls';
import { useAuth } from '@/contexts/AuthContext';
import { CallPeer } from '@/lib/webrtc';
import { supabase } from '@/integrations/supabase/client';

interface CallScreenProps {
  callId: string;
  calleeId: string;
  calleeName: string;
  calleeAvatar: string | null;
  callType: 'audio' | 'video';
  /** When true, treat as incoming call: skip offer creation, wait for offer from caller. */
  asCallee?: boolean;
  onEnd: () => void;
}

type CallState = 'permission' | 'permission_denied' | 'ringing' | 'connecting' | 'ongoing' | 'ended' | 'failed';

export default function CallScreen({ callId, calleeId, calleeName, calleeAvatar, callType, asCallee = false, onEnd }: CallScreenProps) {
  const { user } = useAuth();
  const { endCall, updateCallStatus } = useCalls();
  const [state, setState] = useState<CallState>('permission');
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const peerRef = useRef<CallPeer | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const startedAtRef = useRef<number | null>(null);
  const ringTimeoutRef = useRef<number | null>(null);

  // ---- Setup peer connection & media ----
  const setup = async () => {
    if (!user) return;
    setState('permission');
    setErrorMsg(null);

    const peer = new CallPeer({
      callId,
      selfId: user.id,
      isCaller: !asCallee,
      callType,
      handlers: {
        onRemoteStream: (stream) => {
          if (callType === 'video' && remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
          if (remoteAudioRef.current) remoteAudioRef.current.srcObject = stream;
        },
        onConnectionState: (s) => {
          if (s === 'connected') {
            setState((prev) => {
              if (prev !== 'ongoing') {
                startedAtRef.current = Date.now();
                updateCallStatus(callId, 'ongoing');
                return 'ongoing';
              }
              return prev;
            });
          } else if (s === 'failed' || s === 'disconnected') {
            setState((prev) => (prev === 'ongoing' ? 'ongoing' : 'failed'));
          }
        },
        onRemoteHangup: () => handleRemoteEnd(),
        onRemoteAccept: () => {
          // Callee accepted — caller now creates offer
          if (!asCallee) {
            setState('connecting');
            peer.createOffer().catch((e) => {
              console.error(e);
              setState('failed');
              setErrorMsg('Failed to start media exchange.');
            });
          }
        },
        onRemoteDecline: () => {
          setState('ended');
          endCall(callId, 'declined', 0);
          setTimeout(onEnd, 1200);
        },
      },
    });
    peerRef.current = peer;

    try {
      await peer.requestMedia();
    } catch (err: any) {
      console.error('[call] media error', err);
      setState('permission_denied');
      const isVideo = callType === 'video';
      setErrorMsg(
        err?.name === 'NotAllowedError'
          ? `${isVideo ? 'Camera & microphone' : 'Microphone'} access was denied. Please allow access in your browser settings to make calls.`
          : err?.name === 'NotFoundError'
          ? `No ${isVideo ? 'camera or microphone' : 'microphone'} was found on this device.`
          : `Could not access your ${isVideo ? 'camera or microphone' : 'microphone'}: ${err?.message || 'unknown error'}`
      );
      return;
    }

    if (localVideoRef.current && peer.localStream && callType === 'video') {
      localVideoRef.current.srcObject = peer.localStream;
    }

    await peer.subscribeSignals();

    if (asCallee) {
      // Notify caller we accepted; offer will arrive next
      await peer.sendSignal('accept');
      setState('connecting');
    } else {
      // Caller: wait for callee to accept (state remains 'ringing'), then offer is created in onRemoteAccept
      setState('ringing');
      // Auto-cancel after 45s if no answer
      ringTimeoutRef.current = window.setTimeout(() => {
        setState((s) => {
          if (s === 'ringing') {
            handleEnd('missed');
          }
          return s;
        });
      }, 45_000);
    }
  };

  useEffect(() => {
    setup();
    return () => {
      if (ringTimeoutRef.current) window.clearTimeout(ringTimeoutRef.current);
      peerRef.current?.destroy(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callId]);

  // Duration timer
  useEffect(() => {
    if (state !== 'ongoing') return;
    const t = setInterval(() => {
      if (startedAtRef.current) setSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [state]);

  const handleRemoteEnd = async () => {
    const duration = startedAtRef.current ? Math.floor((Date.now() - startedAtRef.current) / 1000) : 0;
    setState('ended');
    await endCall(callId, duration > 0 ? 'completed' : 'canceled', duration);
    await peerRef.current?.destroy(false);
    setTimeout(onEnd, 1200);
  };

  const handleEnd = async (overrideStatus?: 'missed' | 'canceled' | 'declined' | 'completed') => {
    const duration = startedAtRef.current ? Math.floor((Date.now() - startedAtRef.current) / 1000) : 0;
    let finalStatus: 'completed' | 'canceled' | 'missed' | 'declined' = overrideStatus ?? 'canceled';
    if (!overrideStatus) {
      if (state === 'ongoing') finalStatus = 'completed';
      else if (asCallee) finalStatus = 'declined';
      else finalStatus = 'canceled';
    }
    setState('ended');
    await peerRef.current?.destroy(true);
    await endCall(callId, finalStatus, duration);
    setTimeout(onEnd, 800);
  };

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      peerRef.current?.toggleAudio(next);
      return next;
    });
  };
  const toggleVideo = () => {
    setVideoOff((v) => {
      const next = !v;
      peerRef.current?.toggleVideo(next);
      return next;
    });
  };

  const retryPermissions = async () => {
    await peerRef.current?.destroy(false);
    peerRef.current = null;
    setup();
  };

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const subtitle =
    state === 'permission' ? 'Requesting permissions…' :
    state === 'permission_denied' ? 'Permission denied' :
    state === 'ringing' ? (callType === 'video' ? 'Video calling…' : 'Calling…') :
    state === 'connecting' ? 'Connecting…' :
    state === 'ongoing' ? fmt(seconds) :
    state === 'ended' ? `Call ended · ${fmt(seconds)}` :
    'Call failed';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-background to-card">
      {/* Remote video full-screen if active */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className={`absolute inset-0 h-full w-full object-cover ${callType === 'video' && state === 'ongoing' ? '' : 'hidden'}`}
      />
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      {/* Local self-view PiP */}
      {callType === 'video' && (state === 'connecting' || state === 'ongoing') && (
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="absolute right-4 top-4 z-10 h-32 w-24 rounded-xl border border-border object-cover shadow-lg"
        />
      )}

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        {state === 'permission_denied' ? (
          <>
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Permission needed</h2>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">{errorMsg}</p>
            </div>
            <button
              onClick={retryPermissions}
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </>
        ) : (
          (callType !== 'video' || state !== 'ongoing') && (
            <>
              <motion.div
                animate={state === 'ringing' || state === 'connecting' ? { scale: [1, 1.05, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <Avatar name={calleeName} avatarUrl={calleeAvatar} size="lg" />
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">{calleeName}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
                {state === 'failed' && errorMsg && (
                  <p className="mt-3 max-w-xs text-xs text-destructive">{errorMsg}</p>
                )}
              </div>
            </>
          )
        )}
      </div>

      {state !== 'permission_denied' && state !== 'ended' && (
        <div className="relative z-10 flex items-center justify-center gap-4 pb-12">
          <button
            onClick={toggleMute}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-foreground"
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </button>
          {callType === 'video' && (
            <button
              onClick={toggleVideo}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-foreground"
              aria-label={videoOff ? 'Camera on' : 'Camera off'}
            >
              {videoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
            </button>
          )}
          <button
            onClick={() => handleEnd()}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg"
            aria-label="End call"
          >
            <PhoneOff className="h-7 w-7" />
          </button>
        </div>
      )}

      {state === 'permission_denied' && (
        <div className="relative z-10 flex items-center justify-center pb-12">
          <button
            onClick={() => handleEnd('canceled')}
            className="rounded-full bg-secondary px-6 py-2.5 text-sm font-semibold text-foreground"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
