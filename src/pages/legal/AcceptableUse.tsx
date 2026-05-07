import LegalLayout from '@/components/legal/LegalLayout';
export default function AcceptableUse() {
  return (
    <LegalLayout title="Acceptable Use Policy" updated="May 7, 2026">
      <p>You agree not to use Noori Wala to:</p>
      <ul>
        <li>Send spam, unsolicited bulk messages, or content that violates anti-spam laws (e.g., TCPA, CAN-SPAM, GDPR ePrivacy).</li>
        <li>Distribute child sexual abuse material (CSAM), violent extremism, or content that incites real-world harm. Such content is reported to authorities.</li>
        <li>Harass, threaten, dox, or impersonate others.</li>
        <li>Run scams, fraud, phishing, or fake business profiles.</li>
        <li>Distribute malware, exploits, or attempt to bypass security controls.</li>
        <li>Reverse engineer, scrape, or automate the Services without written permission.</li>
        <li>Infringe intellectual property or privacy rights.</li>
      </ul>
      <h2>Enforcement</h2>
      <p>We may remove violating content, restrict features, or terminate accounts. Severe abuse may be reported to law enforcement.</p>
      <h2>Reporting</h2>
      <p>Report abuse from any chat (3-dot menu → Report) or email <a href="mailto:abuse@nooriwala.com">abuse@nooriwala.com</a>.</p>
    </LegalLayout>
  );
}
