import { ArrowLeft } from 'lucide-react';
import { useAwayMessages } from '@/hooks/useAwayMessages';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

export default function AwayMessagesEditor({ onBack }: { onBack: () => void }) {
  const { data, save } = useAwayMessages();

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-4">
        <button onClick={onBack}><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="text-lg font-bold text-foreground">Greeting & Away</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <Section
          title="Greeting Message"
          desc="Sent automatically when someone messages you for the first time."
          enabled={data.greeting_enabled}
          onToggle={(v) => save({ greeting_enabled: v })}
          text={data.greeting_text}
          onText={(t) => save({ greeting_text: t })}
        />
        <Section
          title="Away Message"
          desc="Sent when someone messages you outside business hours."
          enabled={data.away_enabled}
          onToggle={(v) => save({ away_enabled: v })}
          text={data.away_text}
          onText={(t) => save({ away_text: t })}
        />
      </div>
    </div>
  );
}

function Section({ title, desc, enabled, onToggle, text, onText }: any) {
  return (
    <div className="rounded-xl bg-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
        <Switch checked={enabled} onCheckedChange={onToggle} />
      </div>
      {enabled && <Textarea value={text} onChange={e => onText(e.target.value)} rows={3} />}
    </div>
  );
}
