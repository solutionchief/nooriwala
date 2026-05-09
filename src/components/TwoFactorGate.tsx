import { useEffect, useState } from 'react';
import { Mail, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Forces 2-step Gmail verification after phone-OTP login.
// - If user has no 2FA enrolled → require enrollment (set Gmail + verify).
// - If user has 2FA enabled → require Gmail OTP every new session.
// Marks success in sessionStorage so it's only required once per session.
export default function TwoFactorGate({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading } = useAuth();
  const [profile, setProfile] = useState<{ two_factor_enabled: boolean; two_factor_email: string | null } | null>(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const sessionKey = user ? `nw-2fa-passed-${user.id}` : '';
  const passed = sessionKey ? sessionStorage.getItem(sessionKey) === '1' : false;

  useEffect(() => {
    if (!isAuthenticated || !user) { setChecking(false); return; }
    if (passed) { setChecking(false); return; }
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('two_factor_enabled, two_factor_email')
        .eq('user_id', user.id)
        .maybeSingle();
      setProfile({
        two_factor_enabled: !!data?.two_factor_enabled,
        two_factor_email: data?.two_factor_email ?? null,
      });
      if (data?.two_factor_email) setEmail(data.two_factor_email);
      setChecking(false);
    })();
  }, [isAuthenticated, user, passed]);

  if (loading || !isAuthenticated) return <>{children}</>;
  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  if (passed || !profile) return <>{children}</>;

  const isEnroll = !profile.two_factor_enabled;

  const sendCode = async () => {
    if (!/^[^@\s]+@gmail\.com$/i.test(email.trim())) {
      toast.error('Enter a valid Gmail address');
      return;
    }
    setBusy(true);
    const { error } = await supabase.functions.invoke('send-2fa-otp', {
      body: { email: email.trim().toLowerCase() },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
    toast.success('Verification code sent to your Gmail');
  };

  const verifyCode = async () => {
    if (code.length < 6) return;
    setBusy(true);
    const { error } = await supabase.functions.invoke('verify-2fa-otp', {
      body: {
        email: email.trim().toLowerCase(),
        code,
        mode: isEnroll ? 'enroll' : 'challenge',
      },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    sessionStorage.setItem(sessionKey, '1');
    toast.success(isEnroll ? '2-step verification enabled' : 'Verified');
    // Re-render
    setProfile(p => p ? { ...p, two_factor_enabled: true, two_factor_email: email } : p);
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-background px-6 pt-12">
      <button onClick={signOut} className="mb-6 self-start text-muted-foreground" aria-label="Sign out">
        <ArrowLeft className="h-6 w-6" />
      </button>
      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <ShieldCheck className="h-8 w-8 text-primary" />
      </div>
      <h2 className="mb-2 text-2xl font-bold text-foreground">
        {isEnroll ? 'Set up 2-step verification' : '2-step verification'}
      </h2>
      <p className="mb-6 text-sm text-muted-foreground">
        {isEnroll
          ? 'Add a Gmail address as your second factor. We will email you a 6-digit code to confirm.'
          : sent
            ? `Enter the 6-digit code we sent to ${email}.`
            : `We will send a 6-digit code to your verified Gmail (${profile.two_factor_email}).`}
      </p>

      {!sent ? (
        <>
          {isEnroll ? (
            <div className="mb-4">
              <label className="mb-1 block text-xs text-muted-foreground">Your Gmail address</label>
              <div className="flex items-center gap-2 rounded-md border border-border bg-secondary px-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  type="email"
                  className="border-none bg-transparent"
                />
              </div>
            </div>
          ) : null}
          <Button onClick={sendCode} disabled={busy} className="py-6 text-lg font-bold" size="lg">
            {busy ? 'Sending…' : 'Send verification code'}
          </Button>
        </>
      ) : (
        <>
          <Input
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6-digit code"
            className="mb-4 text-center text-2xl tracking-[0.5em]"
            maxLength={6}
            autoFocus
          />
          <Button onClick={verifyCode} disabled={code.length < 6 || busy} className="py-6 text-lg font-bold" size="lg">
            {busy ? 'Verifying…' : 'Verify & Continue'}
          </Button>
          <button onClick={() => { setSent(false); setCode(''); }} className="mt-4 text-center text-sm text-primary">
            Resend or change email
          </button>
        </>
      )}

      <p className="mt-auto pb-6 text-center text-xs text-muted-foreground">
        2-step verification is required on Noori Wala to keep your account secure.
      </p>
    </div>
  );
}
