import MarketingPage from '@/components/marketing/MarketingPage';

export default function Blog() {
  const posts = [
    { t: 'Welcome to Noori Wala', d: 'A privacy-first messenger built for the global community.', date: '2026-05-01' },
    { t: 'How we secure your messages', d: 'TLS, RLS, CSP and app lock — defense in depth.', date: '2026-04-22' },
    { t: 'Business profiles in 2026', d: 'Multi-website, 50 currencies, auto-reply bot.', date: '2026-04-10' },
  ];
  return (
    <MarketingPage title="Blog" subtitle="Updates from the Noori Wala team.">
      <ul className="not-prose space-y-4">
        {posts.map(p => (
          <li key={p.t} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{p.date}</p>
            <h3 className="mt-1 text-lg font-bold">{p.t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{p.d}</p>
          </li>
        ))}
      </ul>
    </MarketingPage>
  );
}
