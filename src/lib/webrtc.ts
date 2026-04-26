import { supabase } from '@/integrations/supabase/client';

export type SignalType = 'offer' | 'answer' | 'ice' | 'hangup' | 'accept' | 'decline';

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' },
];

export interface PeerHandlers {
  onRemoteStream: (stream: MediaStream) => void;
  onConnectionState: (state: RTCPeerConnectionState) => void;
  onRemoteHangup: () => void;
  onRemoteAccept?: () => void;
  onRemoteDecline?: () => void;
}

export class CallPeer {
  pc: RTCPeerConnection;
  localStream: MediaStream | null = null;
  remoteStream: MediaStream;
  callId: string;
  selfId: string;
  isCaller: boolean;
  callType: 'audio' | 'video';
  private channel: ReturnType<typeof supabase.channel> | null = null;
  private handlers: PeerHandlers;
  private destroyed = false;
  private pendingRemoteCandidates: RTCIceCandidateInit[] = [];
  private hasRemoteDescription = false;

  constructor(opts: {
    callId: string;
    selfId: string;
    isCaller: boolean;
    callType: 'audio' | 'video';
    handlers: PeerHandlers;
  }) {
    this.callId = opts.callId;
    this.selfId = opts.selfId;
    this.isCaller = opts.isCaller;
    this.callType = opts.callType;
    this.handlers = opts.handlers;
    this.remoteStream = new MediaStream();
    this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    this.pc.ontrack = (e) => {
      e.streams[0]?.getTracks().forEach((t) => this.remoteStream.addTrack(t));
      this.handlers.onRemoteStream(this.remoteStream);
    };
    this.pc.onicecandidate = (e) => {
      if (e.candidate) this.sendSignal('ice', e.candidate.toJSON());
    };
    this.pc.onconnectionstatechange = () => {
      this.handlers.onConnectionState(this.pc.connectionState);
    };
  }

  async requestMedia(): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = {
      audio: true,
      video: this.callType === 'video' ? { width: { ideal: 640 }, height: { ideal: 480 } } : false,
    };
    this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
    this.localStream.getTracks().forEach((t) => this.pc.addTrack(t, this.localStream!));
    return this.localStream;
  }

  async subscribeSignals() {
    // Pull any signals already inserted (e.g. accept/offer that beat the subscription)
    const { data } = await supabase
      .from('call_signals')
      .select('*')
      .eq('call_id', this.callId)
      .order('created_at', { ascending: true });
    if (data) {
      for (const row of data) {
        if (row.sender_id !== this.selfId) await this.handleIncoming(row.signal_type as SignalType, row.payload as any);
      }
    }

    this.channel = supabase
      .channel(`call-${this.callId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'call_signals', filter: `call_id=eq.${this.callId}` },
        async (payload) => {
          const row = payload.new as { sender_id: string; signal_type: SignalType; payload: any };
          if (row.sender_id === this.selfId) return;
          await this.handleIncoming(row.signal_type, row.payload);
        }
      )
      .subscribe();
  }

  private async handleIncoming(type: SignalType, payload: any) {
    if (this.destroyed) return;
    try {
      if (type === 'offer') {
        await this.pc.setRemoteDescription(new RTCSessionDescription(payload));
        this.hasRemoteDescription = true;
        await this.flushPendingCandidates();
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        await this.sendSignal('answer', { type: answer.type, sdp: answer.sdp });
      } else if (type === 'answer') {
        await this.pc.setRemoteDescription(new RTCSessionDescription(payload));
        this.hasRemoteDescription = true;
        await this.flushPendingCandidates();
      } else if (type === 'ice') {
        if (this.hasRemoteDescription) {
          await this.pc.addIceCandidate(new RTCIceCandidate(payload));
        } else {
          this.pendingRemoteCandidates.push(payload);
        }
      } else if (type === 'hangup') {
        this.handlers.onRemoteHangup();
      } else if (type === 'accept') {
        this.handlers.onRemoteAccept?.();
      } else if (type === 'decline') {
        this.handlers.onRemoteDecline?.();
      }
    } catch (err) {
      console.error('[webrtc] signal handle error', type, err);
    }
  }

  private async flushPendingCandidates() {
    for (const c of this.pendingRemoteCandidates) {
      try { await this.pc.addIceCandidate(new RTCIceCandidate(c)); } catch (e) { console.warn('ice flush failed', e); }
    }
    this.pendingRemoteCandidates = [];
  }

  async sendSignal(type: SignalType, payload?: any) {
    await supabase.from('call_signals').insert({
      call_id: this.callId,
      sender_id: this.selfId,
      signal_type: type,
      payload: payload ?? null,
    });
  }

  async createOffer() {
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    await this.sendSignal('offer', { type: offer.type, sdp: offer.sdp });
  }

  toggleAudio(muted: boolean) {
    this.localStream?.getAudioTracks().forEach((t) => (t.enabled = !muted));
  }

  toggleVideo(off: boolean) {
    this.localStream?.getVideoTracks().forEach((t) => (t.enabled = !off));
  }

  async destroy(sendHangup = true) {
    if (this.destroyed) return;
    this.destroyed = true;
    if (sendHangup) {
      try { await this.sendSignal('hangup'); } catch {}
    }
    this.localStream?.getTracks().forEach((t) => t.stop());
    try { this.pc.close(); } catch {}
    if (this.channel) { try { await supabase.removeChannel(this.channel); } catch {} }
  }
}
