import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Palette, Image as ImageIcon, MessageCircle, Camera } from 'lucide-react';
import { THEMES, WALLPAPERS, CHAT_BACKGROUNDS, loadPrefs, savePrefs, type AppearancePrefs } from '@/lib/appearance';
import { PHOTO_WALLPAPERS } from '@/lib/photoWallpapers';

interface Props { onBack: () => void; }

export default function AppearanceScreen({ onBack }: Props) {
  const [prefs, setPrefs] = useState<AppearancePrefs>(() => loadPrefs());

  useEffect(() => { savePrefs(prefs); }, [prefs]);

  const Section = ({ icon: Icon, title, subtitle, children }: any) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <Icon className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      </div>
      {subtitle && <p className="px-1 text-xs text-muted-foreground">{subtitle}</p>}
      {children}
    </div>
  );

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border bg-card px-3 py-3">
        <button onClick={onBack} className="text-muted-foreground"><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="text-lg font-semibold text-foreground">Appearance</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <Section icon={Palette} title="Themes" subtitle="Choose a color palette">
          <div className="grid grid-cols-2 gap-2.5">
            {THEMES.map(t => {
              const sel = prefs.themeId === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setPrefs(p => ({ ...p, themeId: t.id }))}
                  className={`relative rounded-xl border-2 p-3 text-left transition-all ${sel ? 'border-primary' : 'border-border hover:border-muted-foreground/40'}`}
                  style={{ background: `hsl(${t.background})` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="h-5 w-5 rounded-full" style={{ background: `hsl(${t.primary})` }} />
                    <span className="h-5 w-5 rounded-full" style={{ background: `hsl(${t.accent})` }} />
                    <span className="h-5 w-5 rounded-full" style={{ background: `hsl(${t.bubbleSent})` }} />
                  </div>
                  <p className="text-sm font-semibold" style={{ color: `hsl(${t.primary})` }}>{t.name}</p>
                  {sel && (
                    <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Section>

        <Section icon={ImageIcon} title="Wallpapers" subtitle="App background pattern">
          <div className="grid grid-cols-3 gap-2.5">
            {WALLPAPERS.map(w => {
              const sel = prefs.wallpaperId === w.id;
              return (
                <button
                  key={w.id}
                  onClick={() => setPrefs(p => ({ ...p, wallpaperId: w.id }))}
                  className={`relative aspect-square rounded-xl border-2 overflow-hidden transition-all ${sel ? 'border-primary' : 'border-border hover:border-muted-foreground/40'}`}
                  style={{ backgroundImage: w.css === 'transparent' ? undefined : w.css, background: w.css === 'transparent' ? 'hsl(var(--card))' : undefined }}
                >
                  <div className="absolute inset-x-0 bottom-0 bg-background/70 px-1.5 py-1 text-[10px] font-medium text-foreground">{w.name}</div>
                  {sel && (
                    <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Section>

        <Section icon={MessageCircle} title="Chat Backgrounds" subtitle="Background inside conversations">
          <div className="grid grid-cols-3 gap-2.5">
            {CHAT_BACKGROUNDS.map(cb => {
              const sel = prefs.chatBgId === cb.id;
              return (
                <button
                  key={cb.id}
                  onClick={() => setPrefs(p => ({ ...p, chatBgId: cb.id }))}
                  className={`relative aspect-square rounded-xl border-2 overflow-hidden transition-all ${sel ? 'border-primary' : 'border-border hover:border-muted-foreground/40'}`}
                  style={{ background: cb.css }}
                >
                  <div className="absolute right-2 top-2 rounded-full bg-primary/80 px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">Aa</div>
                  <div className="absolute inset-x-0 bottom-0 bg-background/70 px-1.5 py-1 text-[10px] font-medium text-foreground">{cb.name}</div>
                  {sel && (
                    <div className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Section>

        <p className="pt-4 text-center text-xs text-muted-foreground">Changes are saved automatically and applied app-wide.</p>
      </div>
    </div>
  );
}
