// Appearance presets: themes (color palette), wallpapers (app background), chat backgrounds.
// Stored in localStorage under "appearance.v1". Applied via CSS vars on :root and a body class.

export interface Theme {
  id: string;
  name: string;
  // HSL string values "H S% L%"
  primary: string;
  primaryFg: string;
  background: string;
  card: string;
  secondary: string;
  border: string;
  bubbleSent: string;
  ring: string;
  accent: string;
}

export const THEMES: Theme[] = [
  { id: 'emerald-dark', name: 'Emerald Dark', primary: '152 69% 45%', primaryFg: '220 20% 7%', background: '220 20% 7%', card: '220 18% 10%', secondary: '220 16% 16%', border: '220 14% 18%', bubbleSent: '152 69% 30%', ring: '152 69% 45%', accent: '152 50% 35%' },
  { id: 'midnight-blue', name: 'Midnight Blue', primary: '212 96% 58%', primaryFg: '222 47% 8%', background: '222 47% 8%', card: '222 40% 12%', secondary: '222 32% 18%', border: '222 28% 22%', bubbleSent: '212 80% 38%', ring: '212 96% 58%', accent: '212 70% 45%' },
  { id: 'royal-purple', name: 'Royal Purple', primary: '270 75% 60%', primaryFg: '270 30% 8%', background: '270 30% 8%', card: '270 25% 12%', secondary: '270 22% 18%', border: '270 20% 22%', bubbleSent: '270 65% 38%', ring: '270 75% 60%', accent: '290 60% 50%' },
  { id: 'sunset-orange', name: 'Sunset Orange', primary: '20 90% 55%', primaryFg: '20 30% 8%', background: '20 25% 8%', card: '20 22% 12%', secondary: '20 18% 18%', border: '20 15% 22%', bubbleSent: '20 80% 38%', ring: '20 90% 55%', accent: '12 80% 50%' },
  { id: 'rose-noir', name: 'Rose Noir', primary: '340 82% 60%', primaryFg: '340 30% 8%', background: '340 20% 8%', card: '340 18% 12%', secondary: '340 14% 18%', border: '340 12% 22%', bubbleSent: '340 70% 40%', ring: '340 82% 60%', accent: '320 65% 50%' },
  { id: 'cyan-mint', name: 'Cyan Mint', primary: '180 80% 45%', primaryFg: '190 40% 8%', background: '190 30% 8%', card: '190 26% 12%', secondary: '190 22% 18%', border: '190 18% 22%', bubbleSent: '180 70% 32%', ring: '180 80% 45%', accent: '168 70% 40%' },
  { id: 'amber-gold', name: 'Amber Gold', primary: '42 95% 55%', primaryFg: '38 30% 8%', background: '38 25% 8%', card: '38 22% 12%', secondary: '38 18% 18%', border: '38 15% 22%', bubbleSent: '42 75% 40%', ring: '42 95% 55%', accent: '32 80% 50%' },
  { id: 'arctic-light', name: 'Arctic Light', primary: '210 90% 50%', primaryFg: '210 100% 98%', background: '210 25% 96%', card: '0 0% 100%', secondary: '210 20% 92%', border: '210 18% 86%', bubbleSent: '210 90% 55%', ring: '210 90% 50%', accent: '195 85% 50%' },
  { id: 'ivory-cream', name: 'Ivory Cream', primary: '24 80% 45%', primaryFg: '40 50% 98%', background: '40 35% 96%', card: '40 25% 100%', secondary: '40 25% 92%', border: '40 20% 85%', bubbleSent: '24 70% 50%', ring: '24 80% 45%', accent: '14 70% 50%' },
  { id: 'graphite', name: 'Graphite', primary: '0 0% 88%', primaryFg: '0 0% 8%', background: '0 0% 8%', card: '0 0% 12%', secondary: '0 0% 18%', border: '0 0% 22%', bubbleSent: '0 0% 30%', ring: '0 0% 88%', accent: '0 0% 60%' },
];

export interface Wallpaper { id: string; name: string; css: string; }

export const WALLPAPERS: Wallpaper[] = [
  { id: 'none', name: 'None', css: 'transparent' },
  { id: 'dots', name: 'Dots', css: 'radial-gradient(hsl(var(--primary)/0.15) 1px, transparent 1px) 0 0/16px 16px' },
  { id: 'grid', name: 'Grid', css: 'linear-gradient(hsl(var(--border)/0.4) 1px, transparent 1px) 0 0/24px 24px, linear-gradient(90deg, hsl(var(--border)/0.4) 1px, transparent 1px) 0 0/24px 24px' },
  { id: 'aurora', name: 'Aurora', css: 'radial-gradient(at 20% 10%, hsl(var(--primary)/0.25), transparent 60%), radial-gradient(at 80% 90%, hsl(var(--accent)/0.25), transparent 60%)' },
  { id: 'sunset', name: 'Sunset', css: 'linear-gradient(135deg, hsl(20 80% 50%/0.18), hsl(340 80% 55%/0.18))' },
  { id: 'ocean', name: 'Ocean', css: 'linear-gradient(160deg, hsl(212 90% 50%/0.18), hsl(180 80% 45%/0.18))' },
  { id: 'forest', name: 'Forest', css: 'linear-gradient(180deg, hsl(152 60% 30%/0.22), hsl(180 60% 25%/0.18))' },
  { id: 'noise', name: 'Noise', css: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.05 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")" },
  { id: 'waves', name: 'Waves', css: 'repeating-radial-gradient(circle at 50% 100%, hsl(var(--primary)/0.08) 0 18px, transparent 18px 36px)' },
  { id: 'stripes', name: 'Stripes', css: 'repeating-linear-gradient(45deg, hsl(var(--secondary)/0.7) 0 12px, hsl(var(--background)) 12px 24px)' },
];

export interface ChatBackground { id: string; name: string; css: string; }

export const CHAT_BACKGROUNDS: ChatBackground[] = [
  { id: 'default', name: 'Default', css: 'hsl(var(--background))' },
  { id: 'paper', name: 'Paper', css: 'linear-gradient(180deg, hsl(var(--background)), hsl(var(--card)))' },
  { id: 'doodle', name: 'Doodle', css: "hsl(var(--background)) url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' fill='none' stroke='%2322c55e' stroke-opacity='0.18'><circle cx='20' cy='20' r='6'/><path d='M50 10 l10 10 -10 10z'/><path d='M10 60 q 10 -15 25 0 t 25 0'/></svg>\") repeat" },
  { id: 'mint', name: 'Mint', css: 'linear-gradient(160deg, hsl(152 50% 12%), hsl(180 40% 10%))' },
  { id: 'lavender', name: 'Lavender', css: 'linear-gradient(160deg, hsl(270 30% 14%), hsl(290 30% 12%))' },
  { id: 'sunrise', name: 'Sunrise', css: 'linear-gradient(180deg, hsl(20 50% 14%), hsl(40 50% 12%))' },
  { id: 'sky', name: 'Sky', css: 'linear-gradient(180deg, hsl(212 60% 18%), hsl(212 50% 10%))' },
  { id: 'graph', name: 'Graph', css: 'hsl(var(--background)) linear-gradient(hsl(var(--border)/0.5) 1px, transparent 1px) 0 0/22px 22px, hsl(var(--background)) linear-gradient(90deg, hsl(var(--border)/0.5) 1px, transparent 1px) 0 0/22px 22px' },
  { id: 'bokeh', name: 'Bokeh', css: 'radial-gradient(circle at 25% 30%, hsl(var(--primary)/0.18), transparent 30%), radial-gradient(circle at 75% 70%, hsl(var(--accent)/0.18), transparent 35%), hsl(var(--background))' },
  { id: 'carbon', name: 'Carbon', css: 'repeating-linear-gradient(45deg, hsl(0 0% 10%), hsl(0 0% 10%) 4px, hsl(0 0% 13%) 4px, hsl(0 0% 13%) 8px)' },
  { id: 'velvet', name: 'Velvet', css: 'radial-gradient(ellipse at top, hsl(340 30% 18%), hsl(220 20% 7%))' },
];

export interface AppearancePrefs {
  themeId: string;
  wallpaperId: string;
  chatBgId: string;
  photoWallpaperId?: string | null; // overrides chatBgId when set
}

const KEY = 'appearance.v1';
const DEFAULTS: AppearancePrefs = { themeId: 'emerald-dark', wallpaperId: 'none', chatBgId: 'default', photoWallpaperId: null };

export function loadPrefs(): AppearancePrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch { return DEFAULTS; }
}

export function savePrefs(p: AppearancePrefs) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
  applyPrefs(p);
  window.dispatchEvent(new CustomEvent('appearance:changed', { detail: p }));
}

export function applyPrefs(p: AppearancePrefs) {
  const t = THEMES.find(x => x.id === p.themeId) || THEMES[0];
  const root = document.documentElement;
  root.style.setProperty('--primary', t.primary);
  root.style.setProperty('--primary-foreground', t.primaryFg);
  root.style.setProperty('--background', t.background);
  root.style.setProperty('--card', t.card);
  root.style.setProperty('--popover', t.card);
  root.style.setProperty('--secondary', t.secondary);
  root.style.setProperty('--muted', t.secondary);
  root.style.setProperty('--border', t.border);
  root.style.setProperty('--input', t.border);
  root.style.setProperty('--ring', t.ring);
  root.style.setProperty('--accent', t.accent);
  root.style.setProperty('--chat-bubble-sent', t.bubbleSent);

  const w = WALLPAPERS.find(x => x.id === p.wallpaperId) || WALLPAPERS[0];
  document.body.style.backgroundImage = w.css === 'transparent' ? 'none' : w.css;
  document.body.style.backgroundAttachment = 'fixed';

  const cb = CHAT_BACKGROUNDS.find(x => x.id === p.chatBgId) || CHAT_BACKGROUNDS[0];
  root.style.setProperty('--chat-background', cb.css);
}

export function getChatBackgroundCss(): string {
  const p = loadPrefs();
  const cb = CHAT_BACKGROUNDS.find(x => x.id === p.chatBgId) || CHAT_BACKGROUNDS[0];
  return cb.css;
}
