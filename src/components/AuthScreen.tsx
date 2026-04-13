import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, ArrowLeft, AlertTriangle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthScreenProps {
  onBack: () => void;
}

export default function AuthScreen({ onBack }: AuthScreenProps) {
  const [step, setStep] = useState<'email' | 'signup' | 'profile'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name || 'User' },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Check your email to confirm your account!');
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pt-12">
      <button onClick={onBack} className="mb-8 self-start text-muted-foreground">
        <ArrowLeft className="h-6 w-6" />
      </button>

      <motion.div
        initial={{ x: 30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-1 flex-col"
      >
        <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <MessageCircle className="h-8 w-8 text-primary" />
        </div>
        <h2 className="mb-2 mt-4 text-2xl font-bold text-foreground">
          {isSignUp ? 'Create your account' : 'Welcome back'}
        </h2>
        <p className="mb-8 text-muted-foreground">
          {isSignUp ? 'Sign up to start messaging' : 'Sign in to continue'}
        </p>

        {isSignUp && (
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Display name"
            className="mb-3"
            maxLength={30}
          />
        )}

        <Input
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email address"
          className="mb-3"
          type="email"
        />

        <Input
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          className="mb-4"
          type="password"
          minLength={6}
        />

        <div className="mb-4 flex items-start gap-2 rounded-lg bg-warning/10 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Important:</strong> Messages on Chief Messenger cannot be erased after sending. What you send, stays seen.
          </p>
        </div>

        <Button
          onClick={isSignUp ? handleSignUp : handleLogin}
          disabled={!email || !password || loading}
          className="py-6 text-lg font-bold"
          size="lg"
        >
          {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
        </Button>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button variant="outline" onClick={handleGoogleLogin} className="py-6 text-base font-semibold" size="lg">
          <Mail className="mr-2 h-5 w-5" />
          Continue with Google
        </Button>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => setIsSignUp(!isSignUp)} className="font-semibold text-primary">
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
