// 10 generated ringtones for messages and calls. Uses WebAudio API to synthesize tones.
// Stored selection in localStorage.

export interface Tone {
  id: string;
  name: string;
  // Each step: [frequency Hz, duration sec]. Pause is freq=0.
  pattern: [number, number][];
  type?: OscillatorType;
}

export const MESSAGE_TONES: Tone[] = [
  { id: 'chime',    name: 'Chime',    pattern: [[880, 0.12], [1320, 0.18]] },
  { id: 'pop',      name: 'Pop',      pattern: [[660, 0.05], [990, 0.05]] },
  { id: 'bell',     name: 'Bell',     pattern: [[1568, 0.08], [1318, 0.18]], type: 'triangle' },
  { id: 'ding',     name: 'Ding',     pattern: [[1760, 0.18]] },
  { id: 'water',    name: 'Water',    pattern: [[440, 0.04], [880, 0.04], [660, 0.06]], type: 'sine' },
  { id: 'whistle',  name: 'Whistle',  pattern: [[1200, 0.1], [1500, 0.15]], type: 'sine' },
  { id: 'click',    name: 'Click',    pattern: [[300, 0.04], [200, 0.04]], type: 'square' },
  { id: 'arpeggio', name: 'Arpeggio', pattern: [[523, 0.08], [659, 0.08], [784, 0.12]] },
  { id: 'soft',     name: 'Soft',     pattern: [[523, 0.18]], type: 'triangle' },
  { id: 'glass',    name: 'Glass',    pattern: [[1976, 0.06], [2349, 0.06], [2637, 0.18]] },
];

export const CALL_TONES: Tone[] = [
  { id: 'classic', name: 'Classic',  pattern: [[440, 0.4], [0, 0.2], [440, 0.4], [0, 0.2]] },
  { id: 'pulse',   name: 'Pulse',    pattern: [[660, 0.2], [0, 0.1], [660, 0.2], [0, 0.4]] },
  { id: 'ascend',  name: 'Ascend',   pattern: [[523, 0.15], [659, 0.15], [784, 0.15], [1046, 0.25]] },
  { id: 'descend', name: 'Descend',  pattern: [[1046, 0.15], [784, 0.15], [659, 0.15], [523, 0.25]] },
  { id: 'twin',    name: 'Twin',     pattern: [[700, 0.18], [900, 0.18], [0, 0.25]] },
  { id: 'warble',  name: 'Warble',   pattern: [[600, 0.1], [800, 0.1], [600, 0.1], [800, 0.1], [0, 0.3]] },
  { id: 'soft',    name: 'Soft Bell',pattern: [[880, 0.6], [0, 0.4]], type: 'triangle' },
  { id: 'urgent',  name: 'Urgent',   pattern: [[1200, 0.08], [0, 0.05], [1200, 0.08], [0, 0.05], [1200, 0.08], [0, 0.4]] },
  { id: 'office',  name: 'Office',   pattern: [[480, 0.4], [0, 0.2], [620, 0.4], [0, 0.6]], type: 'square' },
  { id: 'siren',   name: 'Siren',    pattern: [[800, 0.3], [400, 0.3]], type: 'sawtooth' },
];

interface NotifPrefs {
  messageToneId: string;
  callToneId: string;
  messageEnabled: boolean;
  callEnabled: boolean;
  vibrate: boolean;
}

const KEY = 'notif.v1';
const DEFAULTS: NotifPrefs = {
  messageToneId: 'chime', callToneId: 'classic',
  messageEnabled: true, callEnabled: true, vibrate: true,
};

export function loadNotifPrefs(): NotifPrefs {
  try { const raw = localStorage.getItem(KEY); return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS; } catch { return DEFAULTS; }
}
export function saveNotifPrefs(p: NotifPrefs) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {} }

let ctx: AudioContext | null = null;
function getCtx() { if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); return ctx!; }

export async function playTone(tone: Tone) {
  const ac = getCtx();
  if (ac.state === 'suspended') await ac.resume();
  let t = ac.currentTime;
  for (const [freq, dur] of tone.pattern) {
    if (freq === 0) { t += dur; continue; }
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = tone.type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
    t += dur;
  }
}
