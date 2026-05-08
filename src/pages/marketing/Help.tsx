import MarketingPage from '@/components/marketing/MarketingPage';

export default function Help() {
  return (
    <MarketingPage title="Help Center" subtitle="Answers to the most common questions.">
      <h2>Getting started</h2>
      <ul>
        <li>Sign up with your phone or email</li>
        <li>Verify with OTP and a one-time live selfie</li>
        <li>Set your display name, avatar, cover and bio</li>
      </ul>
      <h2>Privacy</h2>
      <ul>
        <li>Choose who sees your last seen, profile photo and about</li>
        <li>Block or report any contact</li>
        <li>Enable App Lock with PIN</li>
      </ul>
      <h2>Messages</h2>
      <ul>
        <li>Senders can <strong>delete for me</strong> or <strong>delete for everyone</strong></li>
        <li>If the receiver already received the message, the receiver continues to see it (audited)</li>
        <li>Forward, reply, react, star, pin chats and set custom wallpapers</li>
      </ul>
      <h2>Contact</h2>
      <p>Email <a href="mailto:support@nooriwala.com">support@nooriwala.com</a>.</p>
    </MarketingPage>
  );
}
