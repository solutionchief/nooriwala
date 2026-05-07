import LegalLayout from '@/components/legal/LegalLayout';
export default function Security() {
  return (
    <LegalLayout title="Security" updated="May 7, 2026">
      <h2>How we protect Noori Wala</h2>
      <ul>
        <li><strong>Transport security:</strong> TLS 1.2+ for all client-server traffic.</li>
        <li><strong>Authentication:</strong> phone OTP, optional in-app PIN lock with auto-lock timers.</li>
        <li><strong>Database:</strong> row-level security policies enforce per-user access.</li>
        <li><strong>Storage:</strong> private buckets with signed URLs for verification artefacts.</li>
        <li><strong>Hardening:</strong> Content-Security-Policy, X-Frame-Options, Referrer-Policy, Permissions-Policy.</li>
        <li><strong>Input validation:</strong> Zod-based validation on edge functions; parameterised queries only.</li>
        <li><strong>Rate limits:</strong> OTP send/verify, selfie verification, broadcast send, and auth endpoints.</li>
        <li><strong>Audit:</strong> permanent-message delete attempts are logged; the receiver always sees the original.</li>
        <li><strong>Verified change-of-number flow:</strong> SMS OTP + email OTP + live selfie match.</li>
      </ul>
      <h2>Responsible disclosure</h2>
      <p>Found a vulnerability? Please email <a href="mailto:security@nooriwala.com">security@nooriwala.com</a> with steps to reproduce. We do not pursue researchers acting in good faith and will credit you on request.</p>
    </LegalLayout>
  );
}
