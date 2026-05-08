import MarketingPage from '@/components/marketing/MarketingPage';

export default function Brand() {
  return (
    <MarketingPage title="Brand Center" subtitle="Logos, colors and guidelines for partners and press.">
      <h2>Name</h2>
      <p>Always written as <strong>Noori Wala</strong> (two words, capital N and W). Never abbreviate.</p>
      <h2>Logo</h2>
      <p>Our mark is a circular green badge with a white "N". Maintain clear space equal to the height of the "N" on every side.</p>
      <h2>Colors</h2>
      <ul>
        <li>Primary green — used for our mark, buttons and accents</li>
        <li>Deep navy / black — used for backgrounds in the app</li>
      </ul>
      <h2>Don'ts</h2>
      <ul>
        <li>Do not stretch, recolor or rotate the mark</li>
        <li>Do not place the mark on busy photos without a backdrop</li>
        <li>Do not imply endorsement without written permission</li>
      </ul>
      <p>Press inquiries: <a href="mailto:press@nooriwala.com">press@nooriwala.com</a>.</p>
    </MarketingPage>
  );
}
