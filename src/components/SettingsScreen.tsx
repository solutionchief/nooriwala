import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, CheckCheck, Shield, Lock, ChevronRight, LogOut, Bell, Palette, HelpCircle, Info, User, Camera, Briefcase, Activity, Phone } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import BusinessHubScreen from './BusinessHubScreen';
import CallMetricsScreen from './CallMetricsScreen';
import ChangeNumberScreen from './ChangeNumberScreen';
import AppearanceScreen from './AppearanceScreen';

interface SettingsScreenProps {
  onSignOut: () => void;
}

export default function SettingsScreen({ onSignOut }: SettingsScreenProps) {
  const { profile, updateProfile, uploadAvatar, uploadCover } = useProfile();
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [showBusiness, setShowBusiness] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [showChangeNumber, setShowChangeNumber] = useState(false);
  const [showAppearance, setShowAppearance] = useState(false);

  if (showBusiness) return <BusinessHubScreen onBack={() => setShowBusiness(false)} />;
  if (showMetrics) return <CallMetricsScreen onBack={() => setShowMetrics(false)} />;
  if (showChangeNumber) return <ChangeNumberScreen onBack={() => setShowChangeNumber(false)} />;
  if (showAppearance) return <AppearanceScreen onBack={() => setShowAppearance(false)} />;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast.promise(uploadAvatar(file), { loading: 'Uploading...', success: 'Photo updated!', error: 'Upload failed' });
    e.target.value = '';
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast.promise(uploadCover(file), { loading: 'Uploading...', success: 'Cover updated!', error: 'Upload failed' });
    e.target.value = '';
  };

  const privacyItems = [
    { icon: Eye, label: 'Last Seen', value: profile?.show_last_seen ? 'Everyone' : 'Nobody', toggle: () => updateProfile({ show_last_seen: !profile?.show_last_seen }) },
    { icon: User, label: 'Profile Photo', value: profile?.show_profile_photo ? 'Everyone' : 'Nobody', toggle: () => updateProfile({ show_profile_photo: !profile?.show_profile_photo }) },
    { icon: CheckCheck, label: 'Read Receipts', value: profile?.show_read_receipts ? 'On' : 'Off', toggle: () => updateProfile({ show_read_receipts: !profile?.show_read_receipts }) },
    { icon: Lock, label: 'App Lock', value: 'Off' },
  ];

  const settingsItems: { icon: any; label: string; desc: string; onClick?: () => void }[] = [
    { icon: Bell, label: 'Notifications', desc: 'Message & call tones' },
    { icon: Palette, label: 'Appearance', desc: 'Themes, wallpapers & chat backgrounds', onClick: () => setShowAppearance(true) },
    { icon: HelpCircle, label: 'Help', desc: 'FAQ, contact us' },
    { icon: Info, label: 'About', desc: 'Chief Messenger v1.0.0' },
  ];

  return (
    <div className="flex flex-col px-4 py-4 space-y-6">
      {/* Cover + Profile */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-card overflow-hidden">
        {/* Cover photo 600x280 */}
        <div className="relative h-32 bg-gradient-to-r from-primary/30 to-accent/30" onClick={() => coverRef.current?.click()}>
          {profile?.cover_url && (
            <img src={profile.cover_url} alt="Cover" className="h-full w-full object-cover" loading="lazy" />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
            <Camera className="h-6 w-6 text-white" />
          </div>
          <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
        </div>

        <div className="flex items-center gap-4 p-4 -mt-8">
          {/* Avatar 500x500 */}
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
          <div className="flex-1 pt-6">
            <p className="text-lg font-bold text-foreground">{profile?.display_name || 'User'}</p>
            <p className="text-sm text-muted-foreground">{profile?.about || 'Hey there!'}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground mt-6" />
        </div>
      </motion.div>

      {/* Privacy */}
      <div>
        <div className="mb-2 flex items-center gap-2 px-1">
          <Shield className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Privacy</p>
        </div>
        <div className="rounded-xl bg-card overflow-hidden">
          {privacyItems.map((item, i) => (
            <button
              key={item.label}
              onClick={item.toggle}
              className={`flex w-full items-center gap-3 px-4 py-3.5 transition-colors hover:bg-secondary/50 ${i < privacyItems.length - 1 ? 'border-b border-border' : ''}`}
            >
              <item.icon className="h-5 w-5 text-muted-foreground" />
              <span className="flex-1 text-left font-medium text-foreground">{item.label}</span>
              <span className="text-sm text-muted-foreground">{item.value}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      {/* Account / Change Number */}
      <button
        onClick={() => setShowChangeNumber(true)}
        className="flex w-full items-center gap-3 rounded-xl bg-card px-4 py-3.5 transition-colors hover:bg-secondary/50"
      >
        <Phone className="h-5 w-5 text-primary" />
        <div className="flex-1 text-left">
          <p className="font-medium text-foreground">Change Phone Number</p>
          <p className="text-xs text-muted-foreground">2-step verification: phone + email + selfie</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Business Tools */}
      <button
        onClick={() => setShowBusiness(true)}
        className="flex w-full items-center gap-3 rounded-xl bg-card px-4 py-3.5 transition-colors hover:bg-secondary/50"
      >
        <Briefcase className="h-5 w-5 text-primary" />
        <div className="flex-1 text-left">
          <p className="font-medium text-foreground">Business Tools</p>
          <p className="text-xs text-muted-foreground">Profile, catalog, quick replies, labels</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* QA / Debug */}
      <button
        onClick={() => setShowMetrics(true)}
        className="flex w-full items-center gap-3 rounded-xl bg-card px-4 py-3.5 transition-colors hover:bg-secondary/50"
      >
        <Activity className="h-5 w-5 text-primary" />
        <div className="flex-1 text-left">
          <p className="font-medium text-foreground">Call Metrics (QA)</p>
          <p className="text-xs text-muted-foreground">Anonymized ring, connect, failure stats</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* General */}
      <div>
        <p className="mb-2 px-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">General</p>
        <div className="rounded-xl bg-card overflow-hidden">
          {settingsItems.map((item, i) => (
            <button key={item.label} onClick={item.onClick} className={`flex w-full items-center gap-3 px-4 py-3.5 transition-colors hover:bg-secondary/50 ${i < settingsItems.length - 1 ? 'border-b border-border' : ''}`}>
              <item.icon className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onSignOut}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive/10 py-3.5 text-destructive font-semibold transition-colors hover:bg-destructive/20"
      >
        <LogOut className="h-5 w-5" />
        Sign Out
      </button>

      <p className="text-center text-xs text-muted-foreground pb-4">
        Chief Messenger v1.0.0 • Say it once. It stays.
      </p>
    </div>
  );
}
