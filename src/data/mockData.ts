import type { UserProfile, Conversation, Message, Status } from '@/types/chat';

export const currentUser: UserProfile = {
  id: 'current-user',
  phone: '+1234567890',
  display_name: 'You',
  avatar_url: undefined,
  about: 'Hey there! I am using Noori Wala',
  is_online: true,
  show_last_seen: true,
  show_read_receipts: true,
  show_profile_photo: true,
};

const contacts: UserProfile[] = [
  {
    id: 'user-1',
    phone: '+1987654321',
    display_name: 'Sarah Chen',
    about: 'Available',
    is_online: true,
    show_last_seen: true,
    show_read_receipts: true,
    show_profile_photo: true,
  },
  {
    id: 'user-2',
    phone: '+1122334455',
    display_name: 'Marcus Johnson',
    about: 'In a meeting',
    is_online: false,
    last_seen: new Date(Date.now() - 1800000).toISOString(),
    show_last_seen: true,
    show_read_receipts: true,
    show_profile_photo: true,
  },
  {
    id: 'user-3',
    phone: '+1555666777',
    display_name: 'Emily Rodriguez',
    about: 'Noori Wala is amazing!',
    is_online: true,
    show_last_seen: true,
    show_read_receipts: true,
    show_profile_photo: true,
  },
  {
    id: 'user-4',
    phone: '+1999888777',
    display_name: 'David Kim',
    about: 'Working from home',
    is_online: false,
    last_seen: new Date(Date.now() - 7200000).toISOString(),
    show_last_seen: true,
    show_read_receipts: true,
    show_profile_photo: true,
  },
  {
    id: 'user-5',
    phone: '+1444333222',
    display_name: 'Priya Patel',
    about: 'Transparency matters',
    is_online: true,
    show_last_seen: true,
    show_read_receipts: true,
    show_profile_photo: true,
  },
];

export { contacts };

const now = Date.now();

export const mockMessages: Record<string, Message[]> = {
  'conv-1': [
    { id: 'm1', conversation_id: 'conv-1', sender_id: 'user-1', content: 'Hey! Have you tried the new Noori Wala?', content_type: 'text', status: 'read', deleted_by_sender: false, visible_to_receiver: true, reactions: [], created_at: new Date(now - 3600000).toISOString() },
    { id: 'm2', conversation_id: 'conv-1', sender_id: 'current-user', content: 'Yes! I love that messages can\'t be deleted. Finally some accountability!', content_type: 'text', status: 'read', deleted_by_sender: false, visible_to_receiver: true, reactions: [{ user_id: 'user-1', emoji: '❤️' }], created_at: new Date(now - 3500000).toISOString() },
    { id: 'm3', conversation_id: 'conv-1', sender_id: 'user-1', content: 'Right? No more "This message was deleted" mystery 😂', content_type: 'text', status: 'read', deleted_by_sender: false, visible_to_receiver: true, reactions: [], created_at: new Date(now - 3400000).toISOString() },
    { id: 'm4', conversation_id: 'conv-1', sender_id: 'current-user', content: 'Say it once. It stays. 💪', content_type: 'text', status: 'delivered', deleted_by_sender: false, visible_to_receiver: true, reactions: [], created_at: new Date(now - 300000).toISOString() },
  ],
  'conv-2': [
    { id: 'm5', conversation_id: 'conv-2', sender_id: 'user-2', content: 'Can you send the project files?', content_type: 'text', status: 'read', deleted_by_sender: false, visible_to_receiver: true, reactions: [], created_at: new Date(now - 7200000).toISOString() },
    { id: 'm6', conversation_id: 'conv-2', sender_id: 'current-user', content: 'Sure, sending them now', content_type: 'text', status: 'delivered', deleted_by_sender: false, visible_to_receiver: true, reactions: [], created_at: new Date(now - 7100000).toISOString() },
    { id: 'm7', conversation_id: 'conv-2', sender_id: 'user-2', content: 'Thanks! The client meeting is at 3 PM', content_type: 'text', status: 'read', deleted_by_sender: true, visible_to_receiver: true, reactions: [], created_at: new Date(now - 5400000).toISOString() },
  ],
  'conv-3': [
    { id: 'm8', conversation_id: 'conv-3', sender_id: 'user-3', content: 'Are we still on for lunch? 🍕', content_type: 'text', status: 'read', deleted_by_sender: false, visible_to_receiver: true, reactions: [{ user_id: 'current-user', emoji: '👍' }], created_at: new Date(now - 1800000).toISOString() },
  ],
  'conv-4': [
    { id: 'm9', conversation_id: 'conv-4', sender_id: 'current-user', content: 'The quarterly report is ready for review', content_type: 'text', status: 'sent', deleted_by_sender: false, visible_to_receiver: true, reactions: [], created_at: new Date(now - 86400000).toISOString() },
  ],
  'conv-5': [
    { id: 'm10', conversation_id: 'conv-5', sender_id: 'user-5', content: 'Welcome to Noori Wala! 🎉', content_type: 'text', status: 'read', deleted_by_sender: false, visible_to_receiver: true, reactions: [], created_at: new Date(now - 172800000).toISOString() },
  ],
};

export const mockConversations: Conversation[] = contacts.map((contact, i) => {
  const convId = `conv-${i + 1}`;
  const messages = mockMessages[convId] || [];
  return {
    id: convId,
    participant: contact,
    last_message: messages[messages.length - 1],
    unread_count: i === 0 ? 2 : i === 2 ? 1 : 0,
    is_pinned: i === 0,
    updated_at: messages[messages.length - 1]?.created_at || new Date().toISOString(),
  };
});

export const mockStatuses: Status[] = [
  {
    id: 'status-1',
    user_id: 'user-1',
    user: contacts[0],
    content: 'Just launched our new product! 🚀',
    content_type: 'text',
    background_color: 'from-primary to-accent',
    created_at: new Date(now - 3600000).toISOString(),
    expires_at: new Date(now + 82800000).toISOString(),
    viewers: ['current-user'],
    privacy: 'everyone',
  },
  {
    id: 'status-2',
    user_id: 'user-3',
    user: contacts[2],
    content: 'Beautiful day for a hike! 🌄',
    content_type: 'text',
    background_color: 'from-blue-600 to-purple-600',
    created_at: new Date(now - 7200000).toISOString(),
    expires_at: new Date(now + 79200000).toISOString(),
    viewers: [],
    privacy: 'contacts',
  },
  {
    id: 'status-3',
    user_id: 'user-5',
    user: contacts[4],
    content: 'Accountability in messaging matters. That\'s why I use Noori Wala.',
    content_type: 'text',
    background_color: 'from-emerald-600 to-teal-700',
    created_at: new Date(now - 14400000).toISOString(),
    expires_at: new Date(now + 72000000).toISOString(),
    viewers: ['current-user', 'user-1'],
    privacy: 'everyone',
  },
];
