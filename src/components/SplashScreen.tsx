import { motion } from 'framer-motion';
import { Shield, Eye, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import appIcon from '@/assets/app-icon.png';

interface SplashScreenProps {
  onGetStarted: () => void;
}

const features = [
  { icon: Shield, title: 'Privacy First', desc: 'End-to-end encryption for all messages' },
  { icon: Eye, title: 'Permanent Messages', desc: 'What you send, stays seen' },
  { icon: MessageCircle, title: 'Instant Messaging', desc: 'Fast, reliable communication' },
];

export default function SplashScreen({ onGetStarted }: SplashScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="mb-8"
      >
        <img src={appIcon} alt="Noori Wala" className="h-28 w-28 rounded-3xl shadow-lg shadow-primary/30" width={512} height={512} />
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mb-2 text-4xl font-extrabold tracking-tight text-foreground"
      >
        Noori Wala
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.5 }}
        className="mb-12 text-center text-lg text-muted-foreground"
      >
        Say it once. It stays.
      </motion.p>

      <div className="mb-12 w-full max-w-sm space-y-4">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6 + i * 0.15, duration: 0.4 }}
            className="flex items-center gap-4 rounded-xl bg-card p-4"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <f.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{f.title}</p>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <Button
          onClick={onGetStarted}
          className="w-full py-6 text-lg font-bold"
          size="lg"
        >
          Get Started
        </Button>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3 }}
        className="mt-6 text-center text-xs text-muted-foreground"
      >
        By continuing, you agree to our Terms of Service & Privacy Policy
      </motion.p>
    </div>
  );
}
