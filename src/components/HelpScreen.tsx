import { ArrowLeft, ChevronRight, Mail, MessageCircle, Shield, FileText, BookOpen, Bug, ExternalLink } from 'lucide-react';
import { useState } from 'react';

const FAQS = [
  { q: 'How do I start a new chat?', a: 'Tap the + floating button on the Chats tab and choose "New Chat". Then pick a contact to begin.' },
  { q: 'Are messages permanent?', a: 'Yes. Noori Wala does not allow editing or "Delete for Everyone". Once sent, the recipient always sees the message.' },
  { q: 'How do disappearing messages work?', a: 'In a chat, open chat info and enable disappearing messages (24h or 7d). Both sides must be on the same setting.' },
  { q: 'How do I create a group?', a: 'Tap + → New Group, pick members, set name and avatar, then create.' },
  { q: 'How do broadcasts work?', a: 'Broadcasts let you message many people privately at once. Replies come back individually and recipients cannot see each other.' },
  { q: 'Can I change my number?', a: 'Yes. Settings → Change Phone Number requires phone OTP, email OTP, and a selfie verification.' },
  { q: 'How do I link another device?', a: 'Settings menu → Linked Devices → generate a code and enter it on the other device.' },
  { q: 'How do I block someone?', a: 'Open the chat, tap the contact name → Block. They can no longer message or call you.' },
  { q: 'How do I report content?', a: 'Long press a message or open a profile and tap Report. Our team reviews each report.' },
  { q: 'Where are my starred messages?', a: 'Top-right menu → Starred. All messages you starred from any chat appear here.' },
];

export default function HelpScreen({ onBack }: { onBack: () => void }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border bg-card px-3 py-3">
        <button onClick={onBack}><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="text-lg font-semibold">Help</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="rounded-xl bg-card overflow-hidden divide-y divide-border">
          <Row icon={Mail} label="Contact support" value="support@nooriwalar.app"
               onClick={() => window.location.href = 'mailto:support@nooriwalar.app?subject=Chief%20Messenger%20Support'} />
          <Row icon={Bug} label="Report a problem" value="bugs@nooriwalar.app"
               onClick={() => window.location.href = 'mailto:bugs@nooriwalar.app?subject=Bug%20report'} />
          <Row icon={MessageCircle} label="Community"
               onClick={() => window.open('https://nooriwala.lovable.app', '_blank')} />
        </div>

        <div>
          <p className="mb-2 px-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">FAQ</p>
          <div className="rounded-xl bg-card overflow-hidden divide-y divide-border">
            {FAQS.map((f, i) => (
              <div key={i}>
                <button className="flex w-full items-center justify-between px-4 py-3 text-left" onClick={() => setOpen(open === i ? null : i)}>
                  <span className="font-medium pr-3">{f.q}</span>
                  <ChevronRight className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open === i ? 'rotate-90' : ''}`} />
                </button>
                {open === i && <div className="px-4 pb-3 text-sm text-muted-foreground">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-card overflow-hidden divide-y divide-border">
          <Row icon={Shield} label="Privacy policy" onClick={() => window.open('https://nooriwala.lovable.app/privacy', '_blank')} />
          <Row icon={FileText} label="Terms of service" onClick={() => window.open('https://nooriwala.lovable.app/terms', '_blank')} />
          <Row icon={BookOpen} label="User guide" onClick={() => window.open('https://nooriwala.lovable.app/help', '_blank')} />
        </div>

        <p className="text-center text-xs text-muted-foreground pb-2">Noori Wala v1.0.0</p>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value, onClick }: any) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3 hover:bg-secondary/50">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <div className="flex-1 text-left">
        <p className="font-medium text-foreground">{label}</p>
        {value && <p className="text-xs text-muted-foreground">{value}</p>}
      </div>
      <ExternalLink className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
