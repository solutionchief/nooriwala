import { useState } from 'react';
import { ArrowLeft, Briefcase, Package, Zap, Tag, Clock, Megaphone, ChevronRight, BadgeCheck } from 'lucide-react';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import BusinessProfileEditor from './business/BusinessProfileEditor';
import CatalogManager from './business/CatalogManager';
import QuickRepliesManager from './business/QuickRepliesManager';
import LabelsManager from './business/LabelsManager';
import AwayMessagesEditor from './business/AwayMessagesEditor';
import BroadcastComposer from './business/BroadcastComposer';
import { Switch } from '@/components/ui/switch';

interface Props { onBack: () => void; }

type View = 'hub' | 'profile' | 'catalog' | 'replies' | 'labels' | 'away' | 'broadcast';

export default function BusinessHubScreen({ onBack }: Props) {
  const [view, setView] = useState<View>('hub');
  const { profile, upsert } = useBusinessProfile();

  if (view === 'profile') return <BusinessProfileEditor onBack={() => setView('hub')} />;
  if (view === 'catalog') return <CatalogManager onBack={() => setView('hub')} />;
  if (view === 'replies') return <QuickRepliesManager onBack={() => setView('hub')} />;
  if (view === 'labels') return <LabelsManager onBack={() => setView('hub')} />;
  if (view === 'away') return <AwayMessagesEditor onBack={() => setView('hub')} />;
  if (view === 'broadcast') return <BroadcastComposer onBack={() => setView('hub')} />;

  const items = [
    { key: 'profile' as const, icon: Briefcase, label: 'Business Profile', desc: 'Name, hours, address, website' },
    { key: 'catalog' as const, icon: Package, label: 'Catalog', desc: 'Products & collections' },
    { key: 'replies' as const, icon: Zap, label: 'Quick Replies', desc: 'Shortcut → message' },
    { key: 'labels' as const, icon: Tag, label: 'Labels', desc: 'Organize chats' },
    { key: 'away' as const, icon: Clock, label: 'Greeting & Away', desc: 'Auto-reply messages' },
    { key: 'broadcast' as const, icon: Megaphone, label: 'Broadcast', desc: 'Message labeled chats' },
  ];

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-4">
        <button onClick={onBack}><ArrowLeft className="h-5 w-5 text-muted-foreground" /></button>
        <h1 className="text-lg font-bold text-foreground">Business Tools</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="rounded-xl bg-card p-4 flex items-center gap-3">
          <BadgeCheck className="h-8 w-8 text-primary" />
          <div className="flex-1">
            <p className="font-semibold text-foreground">Business Mode</p>
            <p className="text-xs text-muted-foreground">Show your business profile & catalog to others</p>
          </div>
          <Switch
            checked={!!profile?.business_mode}
            onCheckedChange={(v) => upsert({ business_mode: v })}
          />
        </div>

        <div className="rounded-xl bg-card overflow-hidden">
          {items.map((it, i) => (
            <button
              key={it.key}
              onClick={() => setView(it.key)}
              className={`flex w-full items-center gap-3 px-4 py-3.5 transition-colors hover:bg-secondary/50 ${i < items.length - 1 ? 'border-b border-border' : ''}`}
            >
              <it.icon className="h-5 w-5 text-primary" />
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground">{it.label}</p>
                <p className="text-xs text-muted-foreground">{it.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
