import { useEffect, useState } from 'react';
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Three-step flow:
// 1. Verify ownership of CURRENT 2FA Gmail with OTP
// 2. Enter NEW Gmail
// 3. Verify NEW Gmail with OTP
export default function ChangeTwoFactorEmailScreen({ onBack }: { onBack: () => void }) {
  const { profile } = useProfile() as any;
  const currentEmail = profile?.two_factor_email as string | null;

  const [step, setStep] = useState<'verify-current' | 'enter-new' | 'verify-new' | 'done'>('verify-current');
  const [code, setCode] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [sentTo, setSentTo] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendCode = async (email: string) => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('send-2fa-otp', { body: { email } });
    setBusy(false);
    if (error) {
      const msg = (data as any)?.error || error.message;
      const cd = (data as any)?.cooldown;
      if (cd) setCooldown(cd);
      toast.error(msg || 'Failed to send code');
      return false;
    }
    setSentTo(email);
    setCooldown(60);
    toast.success(`Code sent to ${email}`);
    return true;
  };

  // Auto-send to current email on mount
  useEffect(() => {
    if (step === 'verify-current' && currentEmail && !sentTo) {
      sendCode(currentEmail);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, currentEmail]);

  if (!currentEmail) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <header className="flex items-center gap-3 border-b border-border px-4 py-3">
          <button onClick={onBack}><ArrowLeft className="h-6 w-6" /></button>
          <h1 className="text-lg font-bold">Change Gmail</h1>
        </header>
        <div className="p-6 text-center text-sm text-muted-foreground">2-step verification is not enabled yet.</div>
      </div>
    );
  }

  const verifyCurrent = async () => {
    if (code.length < 6) return;
    setBusy(true);
    const { error } = await supabase.functions.invoke('verify-2fa-otp', {
      body: { email: currentEmail, code, mode: 'challenge' },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setCode('');
    setSentTo(null);
    setStep('enter-new');
  };

  const requestNewCode = async () => {
    if (!/^[^@\s]+@gmail\.com$/i.test(newEmail.trim())) {
      toast.error('Enter a valid Gmail address');
      return;
    }
    if (newEmail.trim().toLowerCase() === currentEmail) {
      toast.error('That is already your current 2FA email');
      return;
    }
    const ok = await sendCode(newEmail.trim().toLowerCase());
    if (ok) setStep('verify-new');
  };

  const verifyNew = async () => {
    if (code.length < 6) return;
    setBusy(true);
    const { error } = await supabase.functions.invoke('verify-2fa-otp', {
      body: { email: newEmail.trim().toLowerCase(), code, mode: 'change' },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success('2-step Gmail updated');
    setStep('done');
    setTimeout(onBack, 800);
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button onClick={onBack} aria-label="Back"><ArrowLeft className="h-6 w-6" /></button>
        <h1 className="text-lg font-bold">Change 2FA Gmail</h1>
      </header>

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <ShieldCheck className="h-7 w-7 text-primary" />
        </div>

        {step === 'verify-current' && (
          <>
            <h2 className="mb-2 text-xl font-bold">Verify current Gmail</h2>
            <p className="mb-6 text-sm text-muted-foreground">We sent a 6-digit code to {currentEmail}.</p>
            <Input
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit code"
              className="mb-3 text-center text-2xl tracking-[0.5em]"
              maxLength={6}
              autoFocus
            />
            <Button onClick={verifyCurrent} disabled={code.length < 6 || busy} size="lg" className="py-6">
              {busy ? 'Verifying…' : 'Verify'}
            </Button>
            <button
              onClick={() => sendCode(currentEmail)}
              disabled={cooldown > 0 || busy}
              className="mt-3 text-sm text-primary disabled:text-muted-foreground"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </>
        )}

        {step === 'enter-new' && (
          <>
            <h2 className="mb-2 text-xl font-bold">New Gmail address</h2>
            <p className="mb-6 text-sm text-muted-foreground">Enter the Gmail address you want to use for 2-step verification.</p>
            <div className="mb-4 flex items-center gap-2 rounded-md border border-border bg-secondary px-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="you@gmail.com" type="email" className="border-none bg-transparent" />
            </div>
            <Button onClick={requestNewCode} disabled={busy || cooldown > 0} size="lg" className="py-6">
              {cooldown > 0 ? `Wait ${cooldown}s` : 'Send verification code'}
            </Button>
          </>
        )}

        {step === 'verify-new' && (
          <>
            <h2 className="mb-2 text-xl font-bold">Verify new Gmail</h2>
            <p className="mb-6 text-sm text-muted-foreground">We sent a code to {newEmail}.</p>
            <Input
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit code"
              className="mb-3 text-center text-2xl tracking-[0.5em]"
              maxLength={6}
              autoFocus
            />
            <Button onClick={verifyNew} disabled={code.length < 6 || busy} size="lg" className="py-6">
              {busy ? 'Updating…' : 'Confirm change'}
            </Button>
            <button
              onClick={() => sendCode(newEmail.trim().toLowerCase())}
              disabled={cooldown > 0 || busy}
              className="mt-3 text-sm text-primary disabled:text-muted-foreground"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </>
        )}

        {step === 'done' && (
          <p className="text-sm text-primary">Updated successfully.</p>
        )}
      </div>
    </div>
  );
}
