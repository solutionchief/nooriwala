import MarketingPage from '@/components/marketing/MarketingPage';

export default function Apps() {
  return (
    <MarketingPage title="Get Noori Wala" subtitle="Use the web app instantly, or install on your phone.">
      <div className="grid gap-4 not-prose sm:grid-cols-2">
        <a id="android" className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-bold">Android</h3>
          <p className="mt-2 text-sm text-muted-foreground">Coming soon to Google Play.</p>
        </a>
        <a id="ios" className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-bold">iPhone</h3>
          <p className="mt-2 text-sm text-muted-foreground">App Store release planned.</p>
        </a>
        <a id="desktop" className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-bold">Mac / PC</h3>
          <p className="mt-2 text-sm text-muted-foreground">Use Noori Wala Web — no install needed.</p>
        </a>
        <a className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-bold">Web</h3>
          <p className="mt-2 text-sm text-muted-foreground">Open at <strong>nooriwala.com/app</strong>.</p>
        </a>
      </div>
    </MarketingPage>
  );
}
