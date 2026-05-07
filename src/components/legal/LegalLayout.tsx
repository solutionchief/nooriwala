import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function LegalLayout({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-lg font-bold">Noori Wala — {title}</h1>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="mb-6 text-xs uppercase tracking-wider text-muted-foreground">Last updated: {updated}</p>
        <article className="prose prose-invert max-w-none space-y-4 text-sm leading-relaxed text-foreground/90 [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:mt-4 [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_a]:text-primary [&_a]:underline">
          {children}
        </article>
        <footer className="mt-12 border-t border-border pt-6 text-xs text-muted-foreground">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/cookies">Cookies</Link>
            <Link to="/acceptable-use">Acceptable Use</Link>
            <Link to="/security">Security</Link>
            <Link to="/dmca">DMCA</Link>
            <Link to="/contact">Contact</Link>
          </div>
          <p className="mt-3">© {new Date().getFullYear()} Noori Wala. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}
