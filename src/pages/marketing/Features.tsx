import MarketingPage from '@/components/marketing/MarketingPage';

export default function Features() {
  return (
    <MarketingPage title="Features" subtitle="Everything Noori Wala does — at a glance.">
      <h2>Messaging</h2>
      <ul>
        <li>1-to-1 and group chats up to 2,500 members</li>
        <li>Reactions (👍 ❤️ 😂 🔥), replies, forwards, starred messages</li>
        <li>Disappearing messages (24h / 7d) with mutual opt-in</li>
        <li>Typing indicators, read receipts (configurable)</li>
        <li>Offline outbox — messages send when you reconnect</li>
      </ul>
      <h2>Calls</h2>
      <ul>
        <li>HD voice & video, 1-to-1 and group</li>
        <li>Add contacts during a live call</li>
        <li>Call history with metrics</li>
      </ul>
      <h2>Status & Channels</h2>
      <ul>
        <li>24-hour status (photo, video, text)</li>
        <li>Channels for one-to-many updates</li>
        <li>Communities — group of groups</li>
      </ul>
      <h2>Business</h2>
      <ul>
        <li>Multi-website business profile</li>
        <li>Catalog with 50 currencies</li>
        <li>Auto-reply bot, away messages, quick replies, labels</li>
      </ul>
      <h2>Tools</h2>
      <ul>
        <li>Built-in document scanner with PDF export</li>
        <li>Custom wallpapers (10+ in-app images)</li>
        <li>10 ringtones for messages and calls</li>
      </ul>
    </MarketingPage>
  );
}
