import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AuthScreenProps {
  onLogin: () => void;
  onBack: () => void;
}

export default function AuthScreen({ onLogin, onBack }: AuthScreenProps) {
  const [step, setStep] = useState<'phone' | 'otp' | 'profile'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');

  const handlePhoneSubmit = () => {
    if (phone.length >= 10) setStep('otp');
  };

  const handleOtpSubmit = () => {
    if (otp.length === 6) setStep('profile');
  };

  const handleProfileSubmit = () => {
    if (name.trim()) onLogin();
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pt-12">
      <button onClick={step === 'phone' ? onBack : () => setStep(step === 'otp' ? 'phone' : 'otp')} className="mb-8 self-start text-muted-foreground">
        <ArrowLeft className="h-6 w-6" />
      </button>

      <motion.div
        key={step}
        initial={{ x: 30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-1 flex-col"
      >
        {step === 'phone' && (
          <>
            <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mb-2 mt-4 text-2xl font-bold text-foreground">Enter your phone number</h2>
            <p className="mb-8 text-muted-foreground">We'll send you a verification code</p>

            <div className="mb-4 flex gap-2">
              <Input value="+1" readOnly className="w-16 text-center" />
              <Input
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="Phone number"
                className="flex-1"
                type="tel"
                maxLength={10}
              />
            </div>

            <div className="mb-6 flex items-start gap-2 rounded-lg bg-warning/10 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Important:</strong> Messages on Chief Messenger cannot be erased after sending. What you send, stays seen.
              </p>
            </div>

            <Button onClick={handlePhoneSubmit} disabled={phone.length < 10} className="mt-auto mb-8 py-6 text-lg font-bold" size="lg">
              Send Code
            </Button>
          </>
        )}

        {step === 'otp' && (
          <>
            <h2 className="mb-2 text-2xl font-bold text-foreground">Verify your number</h2>
            <p className="mb-8 text-muted-foreground">Enter the 6-digit code sent to +1{phone}</p>

            <Input
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="mb-4 text-center text-2xl tracking-[0.5em]"
              maxLength={6}
            />

            <p className="mb-8 text-center text-sm text-muted-foreground">
              Didn't receive the code? <button className="text-primary font-semibold">Resend</button>
            </p>

            <Button onClick={handleOtpSubmit} disabled={otp.length < 6} className="mt-auto mb-8 py-6 text-lg font-bold" size="lg">
              Verify
            </Button>
          </>
        )}

        {step === 'profile' && (
          <>
            <h2 className="mb-2 text-2xl font-bold text-foreground">Create your profile</h2>
            <p className="mb-8 text-muted-foreground">This is how others will see you</p>

            <div className="mb-6 flex justify-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/20 text-3xl font-bold text-primary">
                {name ? name[0].toUpperCase() : '?'}
              </div>
            </div>

            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              className="mb-4"
              maxLength={30}
            />

            <Button onClick={handleProfileSubmit} disabled={!name.trim()} className="mt-auto mb-8 py-6 text-lg font-bold" size="lg">
              Continue
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
}
