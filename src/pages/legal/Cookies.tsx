import LegalLayout from '@/components/legal/LegalLayout';
export default function Cookies() {
  return (
    <LegalLayout title="Cookie Policy" updated="May 7, 2026">
      <p>Noori Wala uses a minimal set of cookies and local-storage entries necessary to operate the Services.</p>
      <h2>Strictly Necessary</h2>
      <ul>
        <li>Authentication session tokens.</li>
        <li>App-lock state and security flags.</li>
        <li>UI preferences (theme, wallpaper, language).</li>
      </ul>
      <h2>Analytics</h2>
      <p>We use privacy-friendly, aggregate analytics. No third-party advertising cookies are set by Noori Wala.</p>
      <h2>Your Choices</h2>
      <p>You can clear cookies and local storage at any time from your browser. Doing so will sign you out and reset preferences.</p>
    </LegalLayout>
  );
}
