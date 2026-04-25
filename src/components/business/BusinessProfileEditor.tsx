import { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useBusinessProfile, type BusinessHours } from '@/hooks/useBusinessProfile';
import { toast } from 'sonner';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const CATEGORIES = ['Retail', 'Food & Beverage', 'Services', 'Health & Beauty', 'Education', 'Tech', 'Other'];

export default function BusinessProfileEditor({ onBack }: { onBack: () => void }) {
  const { profile, upsert } = useBusinessProfile();
  const [form, setForm] = useState({
    business_name: '', category: '', description: '',
    address: '', website: '', email: '',
  });
  const [hours, setHours] = useState<BusinessHours>({});

  useEffect(() => {
    if (profile) {
      setForm({
        business_name: profile.business_name || '',
        category: profile.category || '',
        description: profile.description || '',
        address: profile.address || '',
        website: profile.website || '',
        email: profile.email || '',
      });
      setHours(profile.hours || {});
    }
  }, [profile]);

  const save = async () => {
    try {
      await upsert({ ...form, hours } as any);
      toast.success('Business profile saved');
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-4">
        <button onClick={onBack}><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="flex-1 text-lg font-bold text-foreground">Business Profile</h1>
        <Button size="sm" onClick={save}><Save className="h-4 w-4 mr-1" />Save</Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <Field label="Business name">
          <Input value={form.business_name} onChange={e => setForm({ ...form, business_name: e.target.value })} placeholder="My Store" />
        </Field>
        <Field label="Category">
          <select
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
            className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm"
          >
            <option value="">Select…</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Description (max 250)">
          <Textarea value={form.description} maxLength={250} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
        </Field>
        <Field label="Address">
          <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
        </Field>
        <Field label="Website">
          <Input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://" />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        </Field>

        <div>
          <p className="mb-2 text-sm font-semibold text-muted-foreground">Operating Hours</p>
          <div className="rounded-xl bg-card divide-y divide-border">
            {DAYS.map(d => {
              const h = hours[d] || { open: '09:00', close: '18:00', closed: false };
              return (
                <div key={d} className="flex items-center gap-2 px-3 py-2">
                  <span className="w-12 text-sm font-medium">{d}</span>
                  <input type="checkbox" checked={!h.closed} onChange={e => setHours({ ...hours, [d]: { ...h, closed: !e.target.checked } })} />
                  <input type="time" value={h.open} disabled={h.closed} onChange={e => setHours({ ...hours, [d]: { ...h, open: e.target.value } })} className="rounded bg-secondary px-2 py-1 text-xs disabled:opacity-40" />
                  <span className="text-xs text-muted-foreground">to</span>
                  <input type="time" value={h.close} disabled={h.closed} onChange={e => setHours({ ...hours, [d]: { ...h, close: e.target.value } })} className="rounded bg-secondary px-2 py-1 text-xs disabled:opacity-40" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
