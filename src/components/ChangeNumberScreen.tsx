import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Camera, Mail, Phone, Shield, Check, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

interface Props { onBack: () => void; }

type Step = 'phone' | 'email' | 'selfie' | 'done';

export default function ChangeNumberScreen({ onBack }: Props) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [step, setStep] = useState<Step>('phone');
  const [verificationId, setVerificationId] = useState<string | null>(null);

  // Phone
  const [newPhone, setNewPhone] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneSent, setPhoneSent] = useState(false);
  const [phoneBusy, setPhoneBusy] = useState(false);

  // Email
  const [email, setEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);

  // Selfie
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streamOn, setStreamOn] = useState(false);
  const [selfieBusy, setSelfieBusy] = useState(false);
  const [selfieError, setSelfieError] = useState<string | null>(null);
  const [finalBusy, setFinalBusy] = useState(false);

  useEffect(() => {
    return () => {
      const v = videoRef.current;
      if (v?.srcObject) (v.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    };
  }, []);

  // ---- PHONE ----
  const sendPhoneOtp = async () => {
    if (!newPhone.match(/^\+\d{8,15}$/)) {
      toast.error('Enter phone in E.164 format, e.g. +14155552671');
      return;
    }
    if (newPhone === profile?.phone) {
      toast.error('That is already your current number.');
      return;
    }
    setPhoneBusy(true);
    try {
      // Create a verification record on first send
      let vid = verificationId;
      if (!vid) {
        const { data, error } = await supabase
          .from('change_number_verifications')
          .insert({ user_id: user!.id, current_phone: profile?.phone ?? null, new_phone: newPhone })
          .select('id').single();
        if (error) throw error;
        vid = data.id;
        setVerificationId(vid);
      }
      const { error } = await supabase.auth.signInWithOtp({ phone: newPhone });
      if (error) throw error;
      setPhoneSent(true);
      toast.success('Code sent to your new number');
    } catch (e: any) {
      toast.error(e.message ?? 'Could not send code');
    } finally { setPhoneBusy(false); }
  };

  const verifyPhone = async () => {
    if (!phoneOtp || phoneOtp.length < 4) { toast.error('Enter the code'); return; }
    setPhoneBusy(true);
    try {
      // Verify the OTP using Supabase auth (proves ownership). We only check it succeeded.
      const { error } = await supabase.auth.verifyOtp({ phone: newPhone, token: phoneOtp, type: 'sms' });
      if (error) throw error;
      await supabase.from('change_number_verifications')
        .update({ phone_verified: true })
        .eq('id', verificationId!);
      setStep('email');
    } catch (e: any) {
      toast.error(e.message ?? 'Invalid code');
    } finally { setPhoneBusy(false); }
  };

  // ---- EMAIL ----
  const sendEmailOtp = async () => {
    if (!email.match(/^[^@]+@[^@]+\.[^@]+$/)) { toast.error('Enter a valid email'); return; }
    setEmailBusy(true);
    try {
      const { error } = await supabase.functions.invoke('send-email-otp', { body: { email } });
      if (error) throw error;
      setEmailSent(true);
      toast.success('Code sent to ' + email);
    } catch (e: any) {
      toast.error(e.message ?? 'Could not send code');
    } finally { setEmailBusy(false); }
  };

  const verifyEmail = async () => {
    if (!emailOtp || emailOtp.length !== 6) { toast.error('Enter the 6-digit code'); return; }
    setEmailBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-email-otp', {
        body: { email, code: emailOtp, verification_id: verificationId },
      });
      if (error || (data && data.error)) throw new Error(error?.message || data?.error);
      setStep('selfie');
    } catch (e: any) {
      toast.error(e.message ?? 'Invalid code');
    } finally { setEmailBusy(false); }
  };

  // ---- SELFIE ----
  const startCamera = async () => {
    setSelfieError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreamOn(true);
    } catch (e: any) {
      const msg = e?.name === 'NotAllowedError'
        ? 'Camera access denied. Enable it in your browser/device settings.'
        : e?.name === 'NotFoundError'
          ? 'No camera found on this device.'
          : 'Could not access camera.';
      setSelfieError(msg);
    }
  };

  const captureAndVerify = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current, c = canvasRef.current;
    c.width = v.videoWidth || 480; c.height = v.videoHeight || 480;
    c.getContext('2d')!.drawImage(v, 0, 0, c.width, c.height);
    const dataUrl = c.toDataURL('image/jpeg', 0.85);
    (v.srcObject as MediaStream)?.getTracks().forEach(t => t.stop());
    setStreamOn(false);
    setSelfieBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-selfie', {
        body: { selfie_data_url: dataUrl, verification_id: verificationId },
      });
      if (error) throw error;
      if (!data?.ok) {
        setSelfieError(data?.reason || 'Selfie did not match your profile photo. Try again with better lighting.');
        return;
      }
      // Finalize
      setFinalBusy(true);
      const { error: fErr } = await supabase.functions.invoke('finalize-change-number', { body: { verification_id: verificationId } });
      if (fErr) throw fErr;
      setStep('done');
      toast.success('Phone number changed!');
    } catch (e: any) {
      setSelfieError(e.message ?? 'Verification failed');
    } finally { setSelfieBusy(false); setFinalBusy(false); }
  };

  const StepDot = ({ active, done, label }: { active: boolean; done: boolean; label: string }) => (
    <div className="flex flex-col items-center gap-1">
      <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
        done ? 'bg-primary text-primary-foreground' : active ? 'bg-primary/30 text-primary border border-primary' : 'bg-secondary text-muted-foreground'
      }`}>
        {done ? <Check className="h-4 w-4" /> : label}
      </div>
    </div>
  );

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border bg-card px-3 py-3">
        <button onClick={onBack} className="text-muted-foreground"><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="text-lg font-semibold text-foreground">Change Phone Number</h1>
      </div>

      <div className="flex items-center justify-center gap-3 border-b border-border bg-card py-3">
        <StepDot label="1" active={step === 'phone'} done={step !== 'phone'} />
        <div className="h-px w-8 bg-border" />
        <StepDot label="2" active={step === 'email'} done={step === 'selfie' || step === 'done'} />
        <div className="h-px w-8 bg-border" />
        <StepDot label="3" active={step === 'selfie'} done={step === 'done'} />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="rounded-xl bg-warning/10 border border-warning/30 p-3 text-xs text-warning">
          <Shield className="inline h-3.5 w-3.5 mr-1" />
          For your security we verify ownership of your current account, your email, and your face before updating your number.
        </div>

        {step === 'phone' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Phone className="h-4 w-4 text-primary" /> Step 1 — New Phone Number</div>
            <p className="text-xs text-muted-foreground">Current: {profile?.phone || '—'}</p>
            <Input value={newPhone} onChange={e => setNewPhone(e.target.value.trim())} placeholder="+14155552671" disabled={phoneSent} />
            {!phoneSent ? (
              <Button onClick={sendPhoneOtp} disabled={phoneBusy} className="w-full">
                {phoneBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Send code
              </Button>
            ) : (
              <>
                <Input value={phoneOtp} onChange={e => setPhoneOtp(e.target.value.replace(/\D/g, ''))} placeholder="6-digit code" maxLength={6} />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setPhoneSent(false); setPhoneOtp(''); }} className="flex-1">Resend</Button>
                  <Button onClick={verifyPhone} disabled={phoneBusy} className="flex-1">
                    {phoneBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Verify
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {step === 'email' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Mail className="h-4 w-4 text-primary" /> Step 2 — Email (Gmail)</div>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value.trim())} placeholder="you@gmail.com" disabled={emailSent} />
            {!emailSent ? (
              <Button onClick={sendEmailOtp} disabled={emailBusy} className="w-full">
                {emailBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Send code
              </Button>
            ) : (
              <>
                <Input value={emailOtp} onChange={e => setEmailOtp(e.target.value.replace(/\D/g, ''))} placeholder="6-digit code" maxLength={6} />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setEmailSent(false); setEmailOtp(''); }} className="flex-1">Resend</Button>
                  <Button onClick={verifyEmail} disabled={emailBusy} className="flex-1">
                    {emailBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Verify
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {step === 'selfie' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Camera className="h-4 w-4 text-primary" /> Step 3 — Live Selfie</div>
            <p className="text-xs text-muted-foreground">We'll match it against your profile photo. Look at the camera in good lighting.</p>
            <div className="aspect-square overflow-hidden rounded-xl bg-secondary flex items-center justify-center">
              {!streamOn && !selfieBusy ? (
                <Camera className="h-12 w-12 text-muted-foreground" />
              ) : (
                <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
            {selfieError && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-2.5 text-xs text-destructive flex items-start gap-2">
                <X className="h-3.5 w-3.5 mt-0.5 shrink-0" /> {selfieError}
              </div>
            )}
            {!streamOn ? (
              <Button onClick={startCamera} disabled={selfieBusy || finalBusy} className="w-full">
                {(selfieBusy || finalBusy) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selfieError ? 'Try again' : 'Open camera'}
              </Button>
            ) : (
              <Button onClick={captureAndVerify} disabled={selfieBusy} className="w-full">
                {selfieBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Capture & Verify
              </Button>
            )}
          </div>
        )}

        {step === 'done' && (
          <div className="rounded-xl bg-primary/10 border border-primary/30 p-6 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary"><Check className="h-6 w-6 text-primary-foreground" /></div>
            <p className="text-base font-semibold text-foreground">Number updated</p>
            <p className="text-sm text-muted-foreground">Your account now uses {newPhone}.</p>
            <Button onClick={onBack} className="w-full">Done</Button>
          </div>
        )}
      </div>
    </div>
  );
}
