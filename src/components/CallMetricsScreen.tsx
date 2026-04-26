import { useEffect, useState } from 'react';
import { ArrowLeft, Activity, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface MetricRow {
  id: string;
  call_id: string;
  role: 'caller' | 'callee';
  call_type: 'audio' | 'video';
  ring_ms: number | null;
  connect_ms: number | null;
  duration_ms: number | null;
  end_reason: string | null;
  failure_reason: string | null;
  created_at: string;
}

interface Props {
  onBack: () => void;
}

export default function CallMetricsScreen({ onBack }: Props) {
  const { user } = useAuth();
  const [rows, setRows] = useState<MetricRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('call_metrics')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200);
    setRows((data as MetricRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const completed = rows.filter(r => r.end_reason === 'completed');
  const failed = rows.filter(r => r.failure_reason || r.end_reason === 'failed');
  const avg = (xs: (number | null)[]) => {
    const v = xs.filter((n): n is number => typeof n === 'number');
    return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0;
  };
  const fmtMs = (n: number | null) => (n == null ? '—' : n >= 1000 ? `${(n / 1000).toFixed(1)}s` : `${n}ms`);

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <button onClick={onBack} className="rounded-full p-2 hover:bg-secondary" aria-label="Back">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="flex flex-1 items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold text-foreground">Call Metrics (QA)</h1>
        </div>
        <button onClick={load} className="rounded-full p-2 hover:bg-secondary" aria-label="Refresh">
          <RefreshCw className={`h-4 w-4 text-foreground ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 border-b border-border bg-card p-3 text-center sm:grid-cols-4">
        <Stat label="Total" value={rows.length.toString()} />
        <Stat label="Completed" value={completed.length.toString()} />
        <Stat label="Failed" value={failed.length.toString()} />
        <Stat label="Avg connect" value={fmtMs(avg(rows.map(r => r.connect_ms)))} />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center text-muted-foreground">
            <Activity className="h-10 w-10" />
            <p className="text-sm">No call metrics recorded yet. Make a call to populate data.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map(r => (
              <li key={r.id} className="px-4 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">{r.call_id.slice(0, 8)}</span>
                  <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <Pill>{r.call_type}</Pill>
                  <Pill>{r.role}</Pill>
                  <span className="text-muted-foreground">ring: <span className="text-foreground">{fmtMs(r.ring_ms)}</span></span>
                  <span className="text-muted-foreground">connect: <span className="text-foreground">{fmtMs(r.connect_ms)}</span></span>
                  <span className="text-muted-foreground">duration: <span className="text-foreground">{fmtMs(r.duration_ms)}</span></span>
                </div>
                <div className="mt-1 text-xs">
                  <span className={`font-semibold ${r.failure_reason ? 'text-destructive' : 'text-primary'}`}>
                    {r.failure_reason ? `failed: ${r.failure_reason}` : r.end_reason || 'unknown'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary px-2 py-2">
      <div className="text-lg font-bold text-foreground">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </span>
  );
}
