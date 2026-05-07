import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, CheckCheck, Shield, Lock, ChevronRight, LogOut, Bell, Palette, HelpCircle, Info, User, Camera, Briefcase, Activity, Phone, ScanLine, Pencil } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import BusinessHubScreen from './BusinessHubScreen';
import CallMetricsScreen from './CallMetricsScreen';
import ChangeNumberScreen from './ChangeNumberScreen';
import AppearanceScreen from './AppearanceScreen';
import NotificationsScreen from './NotificationsScreen';
import HelpScreen from './HelpScreen';
import AboutScreen from './AboutScreen';
import AppLockScreen from './AppLockScreen';
import ScannerScreen from './ScannerScreen';
import { ABOUT_PRESETS, ABOUT_MAX } from '@/lib/aboutPresets';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Sub = null | 'business' | 'metrics' | 'change' | 'appearance' | 'notif' | 'help' | 'about' | 'lock' | 'scanner';

interface SettingsScreenProps { onSignOut: () => void; }

const VIS_OPTIONS = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'contacts', label: 'My Contacts' },
  { value: 'nobody', label: 'Nobody' },
];

export default function SettingsScreen({ onSignOut }: SettingsScreenProps) {
  const { profile, updateProfile, uploadAvatar, uploadCover } = useProfile();
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [sub, setSub] = useState<Sub>(null);
  const [vizPicker, setVizPicker] = useState<null | 'last_seen' | 'photo'>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [customAbout, setCustomAbout] = useState('');

  if (sub === 'business') return <BusinessHubScreen onBack={() => setSub(null)} />;
  if (sub === 'metrics') return <CallMetricsScreen onBack={() => setSub(null)} />;
  if (sub === 'change') return <ChangeNumberScreen onBack={() => setSub(null)} />;
  if (sub === 'appearance') return <AppearanceScreen onBack={() => setSub(null)} />;
  if (sub === 'notif') return <NotificationsScreen onBack={() => setSub(null)} />;
  if (sub === 'help') return <HelpScreen onBack={() => setSub(null)} />;
  if (sub === 'about') return <AboutScreen onBack={() => setSub(null)} />;
  if (sub === 'lock') return <AppLockScreen onBack={() => setSub(null)} />;
  if (sub === 'scanner') return <ScannerScreen onBack={() => setSub(null)} />;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Profile photo max 5 MB');
    toast.promise(uploadAvatar(file), { loading: 'Uploading…', success: 'Photo updated! (Recommended 500×500)', error: 'Upload failed' });
    e.target.value = '';
  };
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 8 * 1024 * 1024) return toast.error('Cover photo max 8 MB');
    toast.promise(uploadCover(file), { loading: 'Uploading…', success: 'Cover updated! (Recommended 1200×600)', error: 'Upload failed' });
    e.target.value = '';
  };

  const lastSeenVal = (profile as any)?.last_seen_visibility || 'everyone';
  const photoVal = (profile as any)?.profile_photo_visibility || 'everyone';
  const visLabel = (v: string) => VIS_OPTIONS.find(o => o.value === v)?.label || 'Everyone';

  const setAbout = async (text: string) => {
    if (text.length > ABOUT_MAX) return toast.error(`Max ${ABOUT_MAX} characters`);
    await updateProfile({ about: text });
    setAboutOpen(false); setCustomAbout('');
    toast.success('About updated');
  };

  return (
    <div className="flex flex-col px-4 py-4 space-y-6">
      {/* Cover + Profile */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-card overflow-hidden">
        <div className="relative h-32 bg-gradient-to-r from-primary/30 to-accent/30" onClick={() => coverRef.current?.click()}>
          {profile?.cover_url && <img src={profile.cover_url} alt="Cover" className="h-full w-full object-cover" loading="lazy" />}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
            <Camera className="h-6 w-6 text-white" />
          </div>
          <span className="absolute bottom-1 right-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">1200×600</span>
          <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
        </div>

        <div className="flex items-center gap-4 p-4 -mt-8">
          <div className="relative cursor-pointer" onClick={() => avatarRef.current?.click()}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="h-16 w-16 rounded-full object-cover border-4 border-card" loading="lazy" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground border-4 border-card">
                {profile?.display_name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <div className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Camera className="h-3 w-3" />
            </div>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div className="flex-1 pt-6 min-w-0">
            <p className="text-lg font-bold text-foreground truncate">{profile?.display_name || 'User'}</p>
            <p className="text-sm text-muted-foreground truncate">{profile?.about || 'Hey there!'}</p>
            <p className="text-[10px] text-muted-foreground">Profile photo 500×500 • Cover 1200×600</p>
          </div>
          <button onClick={() => setAboutOpen(true)} className="text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></button>
        </div>
      </motion.div>

      {/* Privacy */}
      <div>
        <div className="mb-2 flex items-center gap-2 px-1">
          <Shield className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Privacy</p>
        </div>
        <div className="rounded-xl bg-card overflow-hidden">
          <PrivacyRow icon={Eye} label="Last Seen & Online" value={visLabel(lastSeenVal)} onClick={() => setVizPicker('last_seen')} />
          <PrivacyRow icon={User} label="Profile Photo" value={visLabel(photoVal)} onClick={() => setVizPicker('photo')} />
          <PrivacyRow icon={CheckCheck} label="Read Receipts" value={profile?.show_read_receipts ? 'On' : 'Off'} onClick={() => updateProfile({ show_read_receipts: !profile?.show_read_receipts })} />
          <PrivacyRow icon={Lock} label="App Lock" value="Manage" onClick={() => setSub('lock')} last />
        </div>
      </div>

      <ActionRow icon={Phone} label="Change Phone Number" desc="2-step verification: phone + email + selfie" onClick={() => setSub('change')} />
      <ActionRow icon={Briefcase} label="Business Tools" desc="Profile, catalog, quick replies, labels" onClick={() => setSub('business')} />
      <ActionRow icon={ScanLine} label="Document Scanner" desc="Scan, enhance and export PDFs" onClick={() => setSub('scanner')} />
      <ActionRow icon={Activity} label="Call Metrics (QA)" desc="Anonymized ring, connect, failure stats" onClick={() => setSub('metrics')} />

      <div>
        <p className="mb-2 px-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">General</p>
        <div className="rounded-xl bg-card overflow-hidden">
          <GeneralRow icon={Bell} label="Notifications" desc="Tones, ringtones & vibration" onClick={() => setSub('notif')} />
          <GeneralRow icon={Palette} label="Appearance" desc="Themes, wallpapers, photos & chat backgrounds" onClick={() => setSub('appearance')} />
          <GeneralRow icon={HelpCircle} label="Help" desc="FAQ, contact us, policies" onClick={() => setSub('help')} />
          <GeneralRow icon={Info} label="About" desc="Noori Wala v1.0.0" onClick={() => setSub('about')} last />
        </div>
      </div>

      <button onClick={onSignOut} className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive/10 py-3.5 text-destructive font-semibold transition-colors hover:bg-destructive/20">
        <LogOut className="h-5 w-5" /> Sign Out
      </button>

      <p className="text-center text-xs text-muted-foreground pb-4">Noori Wala v1.0.0 • Say it once. It stays.</p>

      {/* Visibility picker */}
      <Dialog open={!!vizPicker} onOpenChange={(o) => !o && setVizPicker(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>{vizPicker === 'last_seen' ? 'Who can see my last seen & online' : 'Who can see my profile photo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            {VIS_OPTIONS.map(opt => {
              const current = vizPicker === 'last_seen' ? lastSeenVal : photoVal;
              return (
                <button
                  key={opt.value}
                  onClick={async () => {
                    const patch = vizPicker === 'last_seen'
                      ? { last_seen_visibility: opt.value, show_last_seen: opt.value !== 'nobody' }
                      : { profile_photo_visibility: opt.value, show_profile_photo: opt.value !== 'nobody' };
                    await updateProfile(patch as any);
                    setVizPicker(null);
                    toast.success('Privacy updated');
                  }}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left ${current === opt.value ? 'bg-primary/15 text-primary' : 'hover:bg-secondary'}`}
                >
                  <span>{opt.label}</span>
                  {current === opt.value && <Check className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* About / status picker */}
      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>About / Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {ABOUT_PRESETS.map(p => (
              <button key={p} onClick={() => setAbout(p)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-secondary ${profile?.about === p ? 'bg-primary/15 text-primary' : ''}`}>
                <span>{p}</span>
                {profile?.about === p && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground">Custom (max {ABOUT_MAX} chars)</p>
            <Input value={customAbout} onChange={e => setCustomAbout(e.target.value.slice(0, ABOUT_MAX))} placeholder="Type your status…" />
            <p className="text-right text-[10px] text-muted-foreground">{customAbout.length}/{ABOUT_MAX}</p>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setAboutOpen(false)}>Cancel</Button>
            <Button disabled={!customAbout.trim()} onClick={() => setAbout(customAbout.trim())}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PrivacyRow({ icon: Icon, label, value, onClick, last }: any) {
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-3 px-4 py-3.5 transition-colors hover:bg-secondary/50 ${!last ? 'border-b border-border' : ''}`}>
      <Icon className="h-5 w-5 text-muted-foreground" />
      <span className="flex-1 text-left font-medium text-foreground">{label}</span>
      <span className="text-sm text-muted-foreground">{value}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
function ActionRow({ icon: Icon, label, desc, onClick }: any) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-xl bg-card px-4 py-3.5 transition-colors hover:bg-secondary/50">
      <Icon className="h-5 w-5 text-primary" />
      <div className="flex-1 text-left">
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
function GeneralRow({ icon: Icon, label, desc, onClick, last }: any) {
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-3 px-4 py-3.5 transition-colors hover:bg-secondary/50 ${!last ? 'border-b border-border' : ''}`}>
      <Icon className="h-5 w-5 text-muted-foreground" />
      <div className="flex-1 text-left">
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}

// inline icon
function Check(props: any) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>; }
