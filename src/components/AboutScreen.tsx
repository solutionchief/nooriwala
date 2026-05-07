import { ArrowLeft, MessageCircle, Heart, Shield, Code, Globe } from 'lucide-react';

export default function AboutScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border bg-card px-3 py-3">
        <button onClick={onBack}><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="text-lg font-semibold">About</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="flex flex-col items-center text-center pt-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary mb-3">
            <MessageCircle className="h-10 w-10 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-extrabold">Noori Wala</h2>
          <p className="text-sm text-muted-foreground">Version 1.0.0 (build 100)</p>
          <p className="mt-2 italic text-sm text-primary">Say it once. It stays.</p>
        </div>

        <div className="rounded-xl bg-card p-4 space-y-2 text-sm leading-relaxed">
          <p>Noori Wala is a fast, private, and powerful messaging app that combines personal communication with business tools.</p>
          <p className="text-muted-foreground">Once a message is sent, it stays — no editing, no "delete for everyone". Your words are permanent and trusted.</p>
        </div>

        <div className="rounded-xl bg-card overflow-hidden divide-y divide-border">
          <Row icon={Shield} label="End-to-transport encryption" value="HTTPS + Realtime over TLS" />
          <Row icon={Code} label="Built with" value="React, Capacitor, Lovable Cloud" />
          <Row icon={Heart} label="Made with care" value="© 2026 Noori Wala" />
          <Row icon={Globe} label="Website" value="nooriwala.lovable.app"
               onClick={() => window.open('https://nooriwala.lovable.app', '_blank')} />
        </div>

        <div className="rounded-xl bg-card p-4 space-y-2">
          <p className="text-sm font-semibold">Recommended image sizes</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Profile photo: <strong className="text-foreground">500 × 500 px</strong> (1:1, max 5 MB)</li>
            <li>• Cover photo: <strong className="text-foreground">1200 × 600 px</strong> (2:1, max 8 MB)</li>
            <li>• Group avatar: <strong className="text-foreground">512 × 512 px</strong> (1:1, max 5 MB)</li>
            <li>• Status photo: <strong className="text-foreground">1080 × 1920 px</strong> (9:16, max 10 MB)</li>
          </ul>
        </div>

        <p className="text-center text-xs text-muted-foreground pb-2">Thank you for using Noori Wala 💚</p>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value, onClick }: any) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-secondary/50">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <div className="flex-1">
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{value}</p>
      </div>
    </button>
  );
}
