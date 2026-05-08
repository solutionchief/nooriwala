import MarketingLayout from '@/components/marketing/MarketingLayout';
import { Link } from 'react-router-dom';

interface Props {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export default function MarketingPage({ title, subtitle, children }: Props) {
  return (
    <MarketingLayout>
      <section className="mx-auto max-w-4xl px-4 py-20 md:px-8">
        <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">{title}</h1>
        {subtitle && <p className="mt-4 text-lg text-muted-foreground">{subtitle}</p>}
        <div className="prose prose-invert mt-10 max-w-none text-foreground/90 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mt-6 [&_h3]:font-semibold [&_a]:text-primary [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
          {children}
        </div>
        <div className="mt-12 rounded-2xl border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">Ready to try Noori Wala?</p>
          <Link to="/app" className="mt-3 inline-block rounded-full bg-primary px-5 py-2.5 font-bold text-primary-foreground">Open Web App</Link>
        </div>
      </section>
    </MarketingLayout>
  );
}
