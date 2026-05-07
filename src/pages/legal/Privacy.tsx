import LegalLayout from '@/components/legal/LegalLayout';

export default function Privacy() {
  return (
    <LegalLayout title="Privacy Policy" updated="May 7, 2026">
      <p>This Privacy Policy explains what personal data Noori Wala collects, why, and how it is protected.</p>
      <h2>1. Data We Collect</h2>
      <ul>
        <li><strong>Account data:</strong> phone number, display name, profile photo, status, about.</li>
        <li><strong>Content:</strong> messages, media, voice notes, status updates, calls metadata.</li>
        <li><strong>Device data:</strong> device model, OS, app version, language, time zone, push token.</li>
        <li><strong>Usage data:</strong> connection logs, message delivery diagnostics, crash reports.</li>
        <li><strong>Optional:</strong> contacts you choose to invite, location you choose to share, business catalog data.</li>
      </ul>
      <h2>2. How We Use Data</h2>
      <ul>
        <li>To deliver and route messages, calls, status, and channels.</li>
        <li>To verify your phone number and prevent fraud, spam, and abuse.</li>
        <li>To improve reliability, security, and quality of the Services.</li>
        <li>To comply with legal obligations.</li>
      </ul>
      <h2>3. Encryption & Security</h2>
      <p>Traffic between your app and Noori Wala servers is protected by TLS. Media is stored in private buckets with strict access rules. Database access is governed by row-level security policies. We harden against common attacks (CSRF, XSS, injection, brute force) and rate-limit sensitive endpoints.</p>
      <h2>4. Sharing</h2>
      <p>We do not sell personal data. We share data only with: (a) infrastructure providers strictly to operate the Services, (b) law enforcement when legally required, (c) other users you choose to communicate with.</p>
      <h2>5. International Transfers</h2>
      <p>Your data may be processed in countries other than your own. Where required, we use Standard Contractual Clauses or equivalent safeguards.</p>
      <h2>6. Retention</h2>
      <p>Account data is kept while your account is active. You can delete your account from Settings; content is removed within 30 days, except where law requires longer retention.</p>
      <h2>7. Your Rights</h2>
      <p>Depending on your jurisdiction (GDPR, UK GDPR, CCPA, PDPL, etc.), you may request access, correction, deletion, portability, or restriction of your data. Email <a href="mailto:privacy@nooriwala.com">privacy@nooriwala.com</a>.</p>
      <h2>8. Children</h2>
      <p>The Services are not directed to children under 13 (16 in the EEA/UK). We do not knowingly collect data from children below this age.</p>
      <h2>9. Changes</h2>
      <p>We will notify you of material changes in-app. Continued use after the effective date constitutes acceptance.</p>
    </LegalLayout>
  );
}
