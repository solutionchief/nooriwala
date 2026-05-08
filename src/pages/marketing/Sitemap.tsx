import MarketingPage from '@/components/marketing/MarketingPage';
import { Link } from 'react-router-dom';

const ALL = [
  ['/', 'Home'],
  ['/features', 'Features'],
  ['/business', 'For Business'],
  ['/apps', 'Apps'],
  ['/help', 'Help Center'],
  ['/blog', 'Blog'],
  ['/about', 'About us'],
  ['/careers', 'Careers'],
  ['/brand', 'Brand Center'],
  ['/contact', 'Contact'],
  ['/terms', 'Terms'],
  ['/privacy', 'Privacy'],
  ['/cookies', 'Cookies'],
  ['/acceptable-use', 'Acceptable Use'],
  ['/security', 'Security'],
  ['/dmca', 'DMCA'],
  ['/app', 'Web App'],
];

export default function Sitemap() {
  return (
    <MarketingPage title="Sitemap" subtitle="Every page on nooriwala.com.">
      <ul className="not-prose grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ALL.map(([to, l]) => (
          <li key={to}><Link to={to} className="text-primary hover:underline">{l}</Link></li>
        ))}
      </ul>
    </MarketingPage>
  );
}
