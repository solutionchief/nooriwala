import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck, Phone, Users, Megaphone, Radio, Briefcase, ScanLine,
  Lock, Globe2, Sparkles, Smartphone, ArrowRight,
} from 'lucide-react';
import MarketingLayout from '@/components/marketing/MarketingLayout';

const FEATURES = [
  { icon: ShieldCheck, t: 'Bank-grade Security', d: 'TLS, RLS, CSP, app lock, audited delete attempts and rate-limited APIs.' },
  { icon: Phone, t: 'HD Calls', d: 'Crystal-clear 1-to-1 and group voice & video, with add-during-call.' },
  { icon: Users, t: 'Groups up to 2,500', d: 'Invite contacts or recent unknown numbers. Admins, roles, announcements.' },
  { icon: Megaphone, t: 'Private Broadcasts', d: 'Reach many, replies stay private. Per-recipient delivery status.' },
  { icon: Radio, t: 'Channels & Communities', d: 'One-to-many updates and group-of-groups for organisations.' },
  { icon: Briefcase, t: 'Business Tools', d: 'Multi-website profile, social links, 30+ categories, catalog, auto-bot.' },
  { icon: ScanLine, t: 'Built-in Scanner', d: 'CamScanner-style document scanner with filters and PDF export.' },
];

export default function Landing() {
  return (
    <MarketingLayout>
      <div className="bg-gradient-to-b from-background via-background to-card">

      {/* Hero — phone-frame on right (web/laptop) */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Privacy-first messenger
          </p>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Say it once.<br/><span className="text-primary">It stays.</span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted-foreground">
            Noori Wala is a fast, secure messenger for personal chats, calls, status, channels and business — built around permanent message delivery.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/app" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground hover:opacity-90">
              Open Web App <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#download" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 font-semibold hover:bg-secondary">
              <Smartphone className="h-4 w-4" /> Get the App
            </a>
          </div>
          <div className="mt-6 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Lock className="h-3.5 w-3.5 text-primary" /> TLS + RLS</span>
            <span className="inline-flex items-center gap-1"><Globe2 className="h-3.5 w-3.5 text-primary" /> nooriwala.com</span>
            <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> CSP hardened</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }} className="flex justify-center">
          <div className="relative">
            <div className="absolute -inset-10 -z-10 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative h-[560px] w-[280px] rounded-[44px] border-[10px] border-foreground/80 bg-card shadow-2xl">
              <div className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-foreground/80" />
              <iframe
                title="Noori Wala app preview"
                src="/app"
                className="h-full w-full rounded-[34px]"
                loading="lazy"
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features grid */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-2 text-3xl font-bold md:text-4xl">Everything you need. Nothing you don’t.</h2>
        <p className="mb-10 max-w-2xl text-muted-foreground">A complete messenger with the polish of a chat app and the power of a business platform.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.t} className="rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40">
              <f.icon className="mb-3 h-6 w-6 text-primary" />
              <h3 className="font-semibold">{f.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Business band */}
      <section id="business" className="border-y border-border bg-card/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold md:text-4xl">Built for Business</h2>
            <p className="mt-4 text-muted-foreground">
              Run your store inside Noori Wala. Multiple websites, social links, 30+ categories, smart hours,
              a Google-Maps-ready location, a 50-currency catalog, and an auto-reply bot that handles routine questions.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li>• Multi-website + Facebook, Instagram, YouTube, LinkedIn, X</li>
              <li>• 24h or custom date-range hours (e.g. opens 7 May 3pm → closes 8 May 3am)</li>
              <li>• 30+ business categories</li>
              <li>• Catalog with 50 currencies</li>
              <li>• Built-in auto-bot for FAQs, hours, and price replies</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-background p-6">
            <div className="grid grid-cols-3 gap-3 text-xs">
              {['Retail','Food','Services','Health','Beauty','Education','Tech','Travel','Real Estate','Fitness','Legal','Finance','Auto','Media','Logistics','+'].map(c => (
                <span key={c} className="rounded-full border border-border bg-card px-3 py-1.5 text-center">{c}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-bold md:text-4xl">Security you can verify</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Defense in depth: TLS in transit, row-level security in the database, signed URLs for verification artefacts, app lock with auto-timeout, audited delete attempts, rate-limited auth, and a strict Content Security Policy.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ['Encrypted in transit','TLS 1.2+ on every request, HSTS preload.'],
            ['Strict CSP','frame-ancestors, no inline scripts where possible, sandboxed media.'],
            ['Verified change of number','SMS OTP + email OTP + live selfie. Bilingual warnings (English & اردو).'],
          ].map(([t,d]) => (
            <div key={t} className="rounded-2xl border border-border bg-card p-5">
              <ShieldCheck className="mb-2 h-5 w-5 text-primary" />
              <h3 className="font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Download */}
      <section id="download" className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/15 via-card to-card p-8 md:p-12">
          <h2 className="text-3xl font-bold md:text-4xl">Get Noori Wala</h2>
          <p className="mt-3 max-w-xl text-muted-foreground">Use it instantly on the web, or install on Android. iOS coming soon.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/app" className="rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground">Open Web App</Link>
            <a href="#" className="rounded-full border border-border bg-card px-5 py-3 font-semibold opacity-80">Google Play (coming)</a>
            <a href="#" className="rounded-full border border-border bg-card px-5 py-3 font-semibold opacity-50">App Store (coming)</a>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card/50">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Noori Wala. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/cookies">Cookies</Link>
            <Link to="/acceptable-use">Acceptable Use</Link>
            <Link to="/security">Security</Link>
            <Link to="/dmca">DMCA</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
