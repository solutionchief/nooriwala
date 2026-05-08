import { Link, NavLink } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, Download } from 'lucide-react';

const NAV = [
  { to: '/features', label: 'Features' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/help', label: 'Help Center' },
  { to: '/blog', label: 'Blog' },
  { to: '/business', label: 'For Business' },
  { to: '/apps', label: 'Apps' },
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* WhatsApp-style header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground font-bold">N</span>
            <span className="text-xl font-bold tracking-tight">Noori Wala</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground lg:flex">
            {NAV.map(n => (
              <NavLink key={n.to} to={n.to} className={({isActive}) => `hover:text-foreground ${isActive ? 'text-foreground' : ''}`}>
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/app" className="hidden items-center gap-1 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-secondary md:inline-flex">
              Log in →
            </Link>
            <Link to="/apps" className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90">
              Download <Download className="h-4 w-4" />
            </Link>
            <button onClick={() => setOpen(o => !o)} className="lg:hidden" aria-label="menu">
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        {open && (
          <div className="border-t border-border bg-card px-4 py-3 lg:hidden">
            <nav className="flex flex-col gap-3 text-sm">
              {NAV.map(n => (
                <NavLink key={n.to} to={n.to} onClick={() => setOpen(false)} className="text-foreground/80 hover:text-foreground">
                  {n.label}
                </NavLink>
              ))}
              <Link to="/app" onClick={() => setOpen(false)} className="font-semibold text-primary">Log in →</Link>
            </nav>
          </div>
        )}
      </header>

      <main>{children}</main>

      {/* WhatsApp-style footer */}
      <footer className="border-t border-border bg-card/40">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-5 md:px-8">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground font-bold">N</span>
              <span className="text-lg font-bold">Noori Wala</span>
            </Link>
            <Link to="/apps" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
              Download <Download className="h-4 w-4" />
            </Link>
          </div>
          <FooterCol title="What we do" links={[['Features','/features'],['Blog','/blog'],['Security','/security'],['For Business','/business']]} />
          <FooterCol title="Who we are" links={[['About us','/about'],['Careers','/careers'],['Brand Center','/brand'],['Privacy','/privacy']]} />
          <FooterCol title="Use Noori Wala" links={[['Android','/apps#android'],['iPhone','/apps#ios'],['Mac/PC','/apps#desktop'],['Web App','/app']]} />
          <FooterCol title="Need help?" links={[['Contact Us','/contact'],['Help Center','/help'],['Apps','/apps'],['Security Advisories','/security']]} />
        </div>
        <div className="border-t border-border">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-8">
            <p>© {new Date().getFullYear()} Noori Wala</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <Link to="/terms">Terms & Privacy Policy</Link>
              <Link to="/cookies">Cookies</Link>
              <Link to="/acceptable-use">Acceptable Use</Link>
              <Link to="/dmca">DMCA</Link>
              <Link to="/sitemap">Sitemap</Link>
            </div>
            <div className="rounded-full border border-border bg-background px-3 py-1.5">English</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="mb-4 font-bold text-foreground">{title}</h4>
      <ul className="space-y-3 text-sm text-muted-foreground">
        {links.map(([l, to]) => (
          <li key={l}><Link to={to} className="hover:text-foreground">{l}</Link></li>
        ))}
      </ul>
    </div>
  );
}
