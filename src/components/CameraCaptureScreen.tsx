import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Camera, Video, RotateCcw, X, Send, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Props {
  onBack: () => void;
  onSendToChat?: () => void;
}

type Mode = 'photo' | 'video';
type Stage = 'capture' | 'preview' | 'destination';

export default function CameraCaptureScreen({ onBack, onSendToChat }: Props) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [mode, setMode] = useState<Mode>('photo');
  const [stage, setStage] = useState<Stage>('capture');
  const [facing, setFacing] = useState<'user' | 'environment'>('environment');
  const [recording, setRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [posting, setPosting] = useState(false);
  const [permError, setPermError] = useState<string | null>(null);

  const startStream = async () => {
    try {
      streamRef.current?.getTracks().forEach(t => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing },
        audio: mode === 'video',
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setPermError(null);
    } catch (e: any) {
      setPermError(
        e?.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser settings.'
          : e?.message || 'Could not access camera'
      );
    }
  };

  useEffect(() => {
    if (stage === 'capture') startStream();
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing, mode, stage]);

  const takePhoto = () => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth || 720;
    canvas.height = v.videoHeight || 1280;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      setPreviewBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
      setStage('preview');
    }, 'image/jpeg', 0.9);
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const rec = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
    rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setPreviewBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
      setStage('preview');
    };
    recorderRef.current = rec;
    rec.start();
    setRecording(true);
  };
  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  const upload = async (folder: string) => {
    if (!previewBlob || !user) return null;
    const ext = mode === 'photo' ? 'jpg' : 'webm';
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(folder).upload(path, previewBlob, {
      contentType: previewBlob.type,
      upsert: false,
    });
    if (error) { toast.error(error.message); return null; }
    const { data } = supabase.storage.from(folder).getPublicUrl(path);
    return data.publicUrl;
  };

  const sendToStatus = async () => {
    if (!user) return;
    setPosting(true);
    const url = await upload('status-media');
    if (!url) { setPosting(false); return; }
    const { error } = await supabase.from('statuses').insert({
      user_id: user.id,
      content_type: mode === 'photo' ? 'image' : 'video',
      media_url: url,
    });
    setPosting(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Posted to your status');
    onBack();
  };

  const sendToChat = async () => {
    setPosting(true);
    const url = await upload('message-media');
    setPosting(false);
    if (!url) return;
    (window as any).__lastCapturedMedia = { url, type: mode === 'photo' ? 'image' : 'video' };
    toast.success('Saved. Open a chat and tap the attach button — or use Status to share.');
    onSendToChat?.();
    onBack();
  };

  if (permError) {
    return (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-4">
          <button onClick={onBack}><ArrowLeft className="h-5 w-5 text-muted-foreground" /></button>
          <h1 className="text-lg font-bold text-foreground">Camera</h1>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <Camera className="h-12 w-12 text-muted-foreground" />
          <p className="text-foreground font-medium">Camera unavailable</p>
          <p className="text-sm text-muted-foreground">{permError}</p>
          <Button onClick={startStream}>Retry</Button>
        </div>
      </div>
    );
  }

  if (stage === 'preview' && previewUrl) {
    return (
      <div className="flex h-full flex-col bg-black">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => { setPreviewUrl(null); setPreviewBlob(null); setStage('capture'); }}>
            <X className="h-6 w-6 text-white" />
          </button>
          <p className="text-white font-medium">Preview</p>
          <div className="w-6" />
        </div>
        <div className="flex flex-1 items-center justify-center">
          {mode === 'photo' ? (
            <img src={previewUrl} alt="capture" className="max-h-full max-w-full object-contain" />
          ) : (
            <video src={previewUrl} controls className="max-h-full max-w-full" />
          )}
        </div>
        <div className="flex gap-2 p-4 bg-card">
          <Button variant="secondary" disabled={posting} className="flex-1" onClick={sendToChat}>
            <Send className="mr-1 h-4 w-4" /> Send to chat
          </Button>
          <Button disabled={posting} className="flex-1" onClick={sendToStatus}>
            <Type className="mr-1 h-4 w-4" /> Post to Status
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-black">
      <div className="flex items-center justify-between p-4">
        <button onClick={onBack}><X className="h-6 w-6 text-white" /></button>
        <div className="flex gap-2">
          <button
            onClick={() => setMode('photo')}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${mode === 'photo' ? 'bg-primary text-primary-foreground' : 'bg-white/20 text-white'}`}
          >Photo</button>
          <button
            onClick={() => setMode('video')}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${mode === 'video' ? 'bg-primary text-primary-foreground' : 'bg-white/20 text-white'}`}
          >Video</button>
        </div>
        <button onClick={() => setFacing(f => f === 'user' ? 'environment' : 'user')}>
          <RotateCcw className="h-6 w-6 text-white" />
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden">
        <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
      </div>

      <div className="flex items-center justify-center p-6 bg-black">
        {mode === 'photo' ? (
          <button onClick={takePhoto} className="h-16 w-16 rounded-full border-4 border-white bg-white" aria-label="Capture">
            <Camera className="mx-auto h-6 w-6 text-black" />
          </button>
        ) : (
          <button
            onClick={recording ? stopRecording : startRecording}
            className={`h-16 w-16 rounded-full border-4 border-white ${recording ? 'bg-destructive' : 'bg-red-500'}`}
            aria-label={recording ? 'Stop' : 'Record'}
          >
            <Video className="mx-auto h-6 w-6 text-white" />
          </button>
        )}
      </div>
    </div>
  );
}
