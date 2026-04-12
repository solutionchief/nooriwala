import { motion } from 'framer-motion';
import { Eye, EyeOff, CheckCheck, Shield, Lock, ChevronRight, LogOut, Bell, Palette, HelpCircle, Info, User } from 'lucide-react';

interface SettingsScreenProps {
  onSignOut: () => void;
}

const privacyItems = [
  { icon: Eye, label: 'Last Seen', value: 'Everyone' },
  { icon: User, label: 'Profile Photo', value: 'Everyone' },
  { icon: CheckCheck, label: 'Read Receipts', value: 'On' },
  { icon: Lock, label: 'App Lock', value: 'Off' },
];

const settingsItems = [
  { icon: Bell, label: 'Notifications', desc: 'Message & call tones' },
  { icon: Palette, label: 'Appearance', desc: 'Theme, wallpaper, font size' },
  { icon: HelpCircle, label: 'Help', desc: 'FAQ, contact us' },
  { icon: Info, label: 'About', desc: 'Chief Messenger v1.0.0' },
];

export default function SettingsScreen({ onSignOut }: SettingsScreenProps) {
  return (
    <div className="flex flex-col px-4 py-4 space-y-6">
      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 rounded-xl bg-card p-4"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
          Y
        </div>
        <div className="flex-1">
          <p className="text-lg font-bold text-foreground">You</p>
          <p className="text-sm text-muted-foreground">Hey there! I am using Chief Messenger</p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </motion.div>

      {/* Privacy */}
      <div>
        <div className="mb-2 flex items-center gap-2 px-1">
          <Shield className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Privacy</p>
        </div>
        <div className="rounded-xl bg-card overflow-hidden">
          {privacyItems.map((item, i) => (
            <button key={item.label} className={`flex w-full items-center gap-3 px-4 py-3.5 transition-colors hover:bg-secondary/50 ${i < privacyItems.length - 1 ? 'border-b border-border' : ''}`}>
              <item.icon className="h-5 w-5 text-muted-foreground" />
              <span className="flex-1 text-left font-medium text-foreground">{item.label}</span>
              <span className="text-sm text-muted-foreground">{item.value}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      {/* General Settings */}
      <div>
        <p className="mb-2 px-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">General</p>
        <div className="rounded-xl bg-card overflow-hidden">
          {settingsItems.map((item, i) => (
            <button key={item.label} className={`flex w-full items-center gap-3 px-4 py-3.5 transition-colors hover:bg-secondary/50 ${i < settingsItems.length - 1 ? 'border-b border-border' : ''}`}>
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

      {/* Sign Out */}
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
