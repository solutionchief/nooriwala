import MarketingPage from '@/components/marketing/MarketingPage';

export default function Business() {
  return (
    <MarketingPage title="Noori Wala for Business" subtitle="Run your store, brand and customer service inside the app.">
      <h2>Business Profile</h2>
      <ul>
        <li>Multiple websites and social links (Facebook, Instagram, YouTube, LinkedIn, X)</li>
        <li>30+ categories</li>
        <li>Custom hours including 24h or date ranges (e.g. opens 7 May 3pm → closes 8 May 3am)</li>
        <li>OpenStreetMap location picker</li>
      </ul>
      <h2>Sell</h2>
      <ul>
        <li>Catalog with 50 currencies</li>
        <li>Quick replies, labels, away messages</li>
        <li>Auto-reply bot for FAQs, hours, and pricing</li>
      </ul>
      <h2>Reach</h2>
      <ul>
        <li>Private broadcasts with per-recipient delivery</li>
        <li>Channels & communities</li>
      </ul>
    </MarketingPage>
  );
}
