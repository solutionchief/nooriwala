import { useState } from 'react';
import { ArrowLeft, Bell, Phone, Play, Volume2, Vibrate } from 'lucide-react';
import { CALL_TONES, MESSAGE_TONES, loadNotifPrefs, saveNotifPrefs, playTone } from '@/lib/ringtones';

export default function NotificationsScreen({ onBack }: { onBack: () => void }) {
  const [prefs, setPrefs] = useState(() => loadNotifPrefs());
  const update = (patch: Partial<typeof prefs>) => { const next = { ...prefs, ...patch }; setPrefs(next); saveNotifPrefs(next); };

  const Section = ({ icon: Icon, title, children }: any) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <Icon className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      </div>
      {children}
    </div>
  );

  const ToneList = ({ tones, selectedId, onSelect }: any) => (
    <div className="rounded-xl bg-card divide-y divide-border overflow-hidden">
      {tones.map((t: any) => (
        <div key={t.id} className="flex items-center px-3 py-2.5">
          <button onClick={() => playTone(t)} className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
            <Play className="h-4 w-4" />
          </button>
          <button onClick={() => onSelect(t.id)} className="flex-1 text-left">{t.name}</button>
          <input type="radio" checked={selectedId === t.id} onChange={() => onSelect(t.id)} className="h-4 w-4 accent-primary" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border bg-card px-3 py-3">
        <button onClick={onBack}><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="text-lg font-semibold">Notifications</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="rounded-xl bg-card divide-y divide-border">
          <ToggleRow label="Message notifications" checked={prefs.messageEnabled} onChange={v => update({ messageEnabled: v })} icon={Bell} />
          <ToggleRow label="Call notifications" checked={prefs.callEnabled} onChange={v => update({ callEnabled: v })} icon={Phone} />
          <ToggleRow label="Vibrate" checked={prefs.vibrate} onChange={v => update({ vibrate: v })} icon={Vibrate} />
        </div>

        <Section icon={Bell} title={`Message Tones (${MESSAGE_TONES.length})`}>
          <ToneList tones={MESSAGE_TONES} selectedId={prefs.messageToneId} onSelect={(id: string) => update({ messageToneId: id })} />
        </Section>

        <Section icon={Volume2} title={`Call Ringtones (${CALL_TONES.length})`}>
          <ToneList tones={CALL_TONES} selectedId={prefs.callToneId} onSelect={(id: string) => update({ callToneId: id })} />
        </Section>
      </div>
    </div>
  );
}

function ToggleRow({ label, checked, onChange, icon: Icon }: any) {
  return (
    <label className="flex items-center gap-3 px-4 py-3 cursor-pointer">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <span className="flex-1 text-foreground">{label}</span>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="h-5 w-5 accent-primary" />
    </label>
  );
}
