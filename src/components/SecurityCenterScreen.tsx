import { useEffect, useState } from 'react';
import { ArrowLeft, ShieldCheck, ShieldAlert, ShieldX, KeyRound, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';

interface SecurityEvent {
  id: string;
  event_type: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  ip_address: string | null;
}

const EVENT_LABELS: Record<string, { label: string; icon: typeof ShieldCheck; tone: string }> = {
  '2fa_enrolled': { label: '2-step verification enabled', icon: ShieldCheck, tone: 'text-primary' },
  '2fa_email_changed': { label: '2-step verification email changed', icon: Mail, tone: 'text-primary' },
  '2fa_challenge_succeeded': { label: 'Successful verification', icon: ShieldCheck, tone: 'text-primary' },
  '2fa_challenge_failed': { label: 'Failed verification attempt', icon: ShieldX, tone: 'text-destructive' },
};

export default function SecurityCenterScreen({ onBack, onChangeEmail }: { onBack: () => void; onChangeEmail: () => void }) {
  const { user } = useAuth();
  const { profile } = useProfile() as any;
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('security_events')
        .select('id, event_type, metadata, created_at, ip_address')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      setEvents((data ?? []) as SecurityEvent[]);
      setLoading(false);
    })();
  }, [user]);

  const twoFa = (profile as any)?.two_factor_enabled;
  const twoFaEmail = (profile as any)?.two_factor_email;

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button onClick={onBack} aria-label="Back"><ArrowLeft className="h-6 w-6" /></button>
        <div>
          <h1 className="text-lg font-bold">Security Center</h1>
          <p className="text-xs text-muted-foreground">Audit your account activity</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <section className="border-b border-border p-4">
          <div className="mb-3 flex items-center gap-3">
            {twoFa ? <ShieldCheck className="h-6 w-6 text-primary" /> : <ShieldAlert className="h-6 w-6 text-destructive" />}
            <div className="flex-1">
              <p className="font-semibold">2-step verification</p>
              <p className="text-xs text-muted-foreground">
                {twoFa ? `Enabled · ${twoFaEmail}` : 'Not enabled'}
              </p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={onChangeEmail} className="w-full">
            <KeyRound className="mr-2 h-4 w-4" /> Change Gmail with OTP re-verification
          </Button>
        </section>

        <section className="p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recent activity</h2>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="space-y-2">
              {events.map((e) => {
                const meta = EVENT_LABELS[e.event_type] ?? { label: e.event_type, icon: ShieldAlert, tone: 'text-muted-foreground' };
                const Icon = meta.icon;
                const reason = (e.metadata as any)?.reason;
                return (
                  <li key={e.id} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
                    <Icon className={`h-5 w-5 shrink-0 ${meta.tone}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{meta.label}{reason ? ` (${reason})` : ''}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(e.created_at).toLocaleString()}
                        {e.ip_address ? ` · ${e.ip_address}` : ''}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
