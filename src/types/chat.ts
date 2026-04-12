export interface UserProfile {
  id: string;
  phone: string;
  display_name: string;
  avatar_url?: string;
  about?: string;
  last_seen?: string;
  is_online: boolean;
  show_last_seen: boolean;
  show_read_receipts: boolean;
  show_profile_photo: boolean;
}

export interface Conversation {
  id: string;
  participant: UserProfile;
  last_message?: Message;
  unread_count: number;
  is_pinned: boolean;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  content_type: 'text' | 'image' | 'video' | 'document';
  media_url?: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  deleted_by_sender: boolean;
  visible_to_receiver: boolean; // ALWAYS true - core feature
  reply_to_id?: string;
  reactions: MessageReaction[];
  created_at: string;
}

export interface MessageReaction {
  user_id: string;
  emoji: string;
}

export interface Status {
  id: string;
  user_id: string;
  user: UserProfile;
  content: string;
  content_type: 'text' | 'image' | 'video';
  media_url?: string;
  background_color?: string;
  created_at: string;
  expires_at: string;
  viewers: string[];
  privacy: 'everyone' | 'contacts' | 'custom';
}
