import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, ArrowLeft, AlertTriangle, Mail, ChevronDown, Search, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { countryCodes, type CountryCode } from '@/data/countryCodes';

interface AuthScreenProps {
  onBack: () => void;
}

export default function AuthScreen({ onBack }: AuthScreenProps) {
  const [authMode, setAuthMode] = useState<'phone' | 'email'>('phone');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(countryCodes.find(c => c.code === 'US')!);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const filteredCountries = countryCodes.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.dial.includes(countrySearch)
  );

  const handlePhoneAuth = async () => {
    const fullPhone = `${selectedCountry.dial}${phone.replace(/\D/g, '')}`;
    if (phone.length < 6) { toast.error('Enter a valid phone number'); return; }
    setLoading(true);

    if (!otpSent) {
      const { error } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
        options: { data: { display_name: name || 'User' } },
      });
      setLoading(false);
      if (error) {
        toast.error(error.message);
      } else {
        setOtpSent(true);
        toast.success('Verification code sent!');
      }
    } else {
      const { error } = await supabase.auth.verifyOtp({
        phone: fullPhone,
        token: otp,
        type: 'sms',
      });
      setLoading(false);
      if (error) {
        toast.error(error.message);
      }
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
  };

  const handleEmailSignUp = async () => {
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
    if (error) toast.error(error.message);
    else toast.success('Check your email to confirm your account!');
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) toast.error(error.message);
  };

  // Country picker modal
  if (showCountryPicker) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <button onClick={() => { setShowCountryPicker(false); setCountrySearch(''); }} className="text-muted-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-bold text-foreground">Select Country</h2>
        </div>
        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={countrySearch}
              onChange={e => setCountrySearch(e.target.value)}
              placeholder="Search country..."
              className="pl-10 bg-secondary border-none"
              autoFocus
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredCountries.map(c => (
            <button
              key={c.code}
              onClick={() => { setSelectedCountry(c); setShowCountryPicker(false); setCountrySearch(''); }}
              className="flex w-full items-center gap-3 px-4 py-3 hover:bg-card transition-colors"
            >
              <span className="text-2xl">{c.flag}</span>
              <span className="flex-1 text-left text-foreground">{c.name}</span>
              <span className="text-muted-foreground">{c.dial}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

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
          {otpSent ? 'Enter verification code' : isSignUp ? 'Create your account' : 'Welcome back'}
        </h2>
        <p className="mb-6 text-muted-foreground">
          {otpSent
            ? `We sent a code to ${selectedCountry.dial}${phone}`
            : authMode === 'phone'
              ? 'Enter your phone number to get started'
              : isSignUp ? 'Sign up with email' : 'Sign in to continue'}
        </p>

        {/* Auth mode tabs */}
        {!otpSent && (
          <div className="mb-4 flex rounded-lg bg-secondary p-1">
            <button
              onClick={() => setAuthMode('phone')}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${authMode === 'phone' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            >
              <Phone className="mr-1 inline h-4 w-4" /> Phone
            </button>
            <button
              onClick={() => setAuthMode('email')}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${authMode === 'email' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            >
              <Mail className="mr-1 inline h-4 w-4" /> Email
            </button>
          </div>
        )}

        {otpSent ? (
          <>
            <Input
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit code"
              className="mb-4 text-center text-2xl tracking-[0.5em]"
              maxLength={6}
              autoFocus
            />
            <Button onClick={handlePhoneAuth} disabled={otp.length < 6 || loading} className="py-6 text-lg font-bold" size="lg">
              {loading ? 'Verifying...' : 'Verify'}
            </Button>
            <button onClick={() => { setOtpSent(false); setOtp(''); }} className="mt-4 text-center text-sm text-primary">
              Change phone number
            </button>
          </>
        ) : authMode === 'phone' ? (
          <>
            {isSignUp && (
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Display name"
                className="mb-3"
                maxLength={30}
              />
            )}
            {/* Country code selector */}
            <button
              onClick={() => setShowCountryPicker(true)}
              className="mb-3 flex items-center gap-2 rounded-md border border-border bg-secondary px-4 py-3"
            >
              <span className="text-xl">{selectedCountry.flag}</span>
              <span className="text-foreground">{selectedCountry.name}</span>
              <span className="text-muted-foreground">{selectedCountry.dial}</span>
              <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />
            </button>

            <Input
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="Phone number"
              className="mb-4"
              type="tel"
              maxLength={15}
            />

            <div className="mb-4 flex items-start gap-2 rounded-lg bg-warning/10 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Important:</strong> Messages on Chief Messenger cannot be erased after sending. What you send, stays seen.
              </p>
            </div>

            <Button onClick={handlePhoneAuth} disabled={phone.length < 6 || loading} className="py-6 text-lg font-bold" size="lg">
              {loading ? 'Sending code...' : 'Send Verification Code'}
            </Button>
          </>
        ) : (
          <>
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
              onClick={isSignUp ? handleEmailSignUp : handleEmailLogin}
              disabled={!email || !password || loading}
              className="py-6 text-lg font-bold"
              size="lg"
            >
              {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
          </>
        )}

        {!otpSent && (
          <>
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
          </>
        )}
      </motion.div>
    </div>
  );
}
