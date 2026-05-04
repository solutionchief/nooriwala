export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      away_messages: {
        Row: {
          away_enabled: boolean
          away_text: string | null
          greeting_enabled: boolean
          greeting_text: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          away_enabled?: boolean
          away_text?: string | null
          greeting_enabled?: boolean
          greeting_text?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          away_enabled?: boolean
          away_text?: string | null
          greeting_enabled?: boolean
          greeting_text?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      business_profiles: {
        Row: {
          address: string | null
          business_mode: boolean
          business_name: string | null
          category: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          email: string | null
          hours: Json | null
          id: string
          latitude: number | null
          longitude: number | null
          updated_at: string
          user_id: string
          verified: boolean
          website: string | null
        }
        Insert: {
          address?: string | null
          business_mode?: boolean
          business_name?: string | null
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          hours?: Json | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          updated_at?: string
          user_id: string
          verified?: boolean
          website?: string | null
        }
        Update: {
          address?: string | null
          business_mode?: boolean
          business_name?: string | null
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          hours?: Json | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          updated_at?: string
          user_id?: string
          verified?: boolean
          website?: string | null
        }
        Relationships: []
      }
      call_metrics: {
        Row: {
          call_id: string
          call_type: string
          connect_ms: number | null
          created_at: string
          duration_ms: number | null
          end_reason: string | null
          failure_reason: string | null
          id: string
          ring_ms: number | null
          role: string
          user_id: string
        }
        Insert: {
          call_id: string
          call_type: string
          connect_ms?: number | null
          created_at?: string
          duration_ms?: number | null
          end_reason?: string | null
          failure_reason?: string | null
          id?: string
          ring_ms?: number | null
          role: string
          user_id: string
        }
        Update: {
          call_id?: string
          call_type?: string
          connect_ms?: number | null
          created_at?: string
          duration_ms?: number | null
          end_reason?: string | null
          failure_reason?: string | null
          id?: string
          ring_ms?: number | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      call_signals: {
        Row: {
          call_id: string
          created_at: string
          id: string
          payload: Json | null
          sender_id: string
          signal_type: string
        }
        Insert: {
          call_id: string
          created_at?: string
          id?: string
          payload?: Json | null
          sender_id: string
          signal_type: string
        }
        Update: {
          call_id?: string
          created_at?: string
          id?: string
          payload?: Json | null
          sender_id?: string
          signal_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_signals_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
        ]
      }
      calls: {
        Row: {
          call_type: string
          callee_id: string
          caller_id: string
          conversation_id: string | null
          created_at: string
          duration_seconds: number
          ended_at: string | null
          id: string
          started_at: string
          status: string
        }
        Insert: {
          call_type?: string
          callee_id: string
          caller_id: string
          conversation_id?: string | null
          created_at?: string
          duration_seconds?: number
          ended_at?: string | null
          id?: string
          started_at?: string
          status?: string
        }
        Update: {
          call_type?: string
          callee_id?: string
          caller_id?: string
          conversation_id?: string | null
          created_at?: string
          duration_seconds?: number
          ended_at?: string | null
          id?: string
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      change_number_verifications: {
        Row: {
          completed_at: string | null
          created_at: string
          current_phone: string | null
          email: string | null
          email_verified: boolean
          id: string
          new_phone: string
          phone_verified: boolean
          selfie_score: number | null
          selfie_url: string | null
          selfie_verified: boolean
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_phone?: string | null
          email?: string | null
          email_verified?: boolean
          id?: string
          new_phone: string
          phone_verified?: boolean
          selfie_score?: number | null
          selfie_url?: string | null
          selfie_verified?: boolean
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_phone?: string | null
          email?: string | null
          email_verified?: boolean
          id?: string
          new_phone?: string
          phone_verified?: boolean
          selfie_score?: number | null
          selfie_url?: string | null
          selfie_verified?: boolean
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      channel_followers: {
        Row: {
          channel_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_followers_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_posts: {
        Row: {
          author_id: string
          channel_id: string
          content: string | null
          content_type: string
          created_at: string
          id: string
          media_url: string | null
        }
        Insert: {
          author_id: string
          channel_id: string
          content?: string | null
          content_type?: string
          created_at?: string
          id?: string
          media_url?: string | null
        }
        Update: {
          author_id?: string
          channel_id?: string
          content?: string | null
          content_type?: string
          created_at?: string
          id?: string
          media_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channel_posts_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          avatar_url: string | null
          created_at: string
          description: string | null
          follower_count: number
          handle: string
          id: string
          is_verified: boolean
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          follower_count?: number
          handle: string
          id?: string
          is_verified?: boolean
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          follower_count?: number
          handle?: string
          id?: string
          is_verified?: boolean
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_labels: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      communities: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_groups: {
        Row: {
          added_at: string
          community_id: string
          conversation_id: string
          id: string
        }
        Insert: {
          added_at?: string
          community_id: string
          conversation_id: string
          id?: string
        }
        Update: {
          added_at?: string
          community_id?: string
          conversation_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_groups_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_members: {
        Row: {
          community_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          community_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          community_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_labels: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          label_id: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          label_id: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          label_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_labels_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "chat_labels"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          custom_theme_url: string | null
          disappearing_duration: string | null
          id: string
          is_archived: boolean
          is_muted: boolean
          is_pinned: boolean
          joined_at: string
          last_read_at: string | null
          marked_unread: boolean
          role: string
          unread_count: number
          user_id: string
        }
        Insert: {
          conversation_id: string
          custom_theme_url?: string | null
          disappearing_duration?: string | null
          id?: string
          is_archived?: boolean
          is_muted?: boolean
          is_pinned?: boolean
          joined_at?: string
          last_read_at?: string | null
          marked_unread?: boolean
          role?: string
          unread_count?: number
          user_id: string
        }
        Update: {
          conversation_id?: string
          custom_theme_url?: string | null
          disappearing_duration?: string | null
          id?: string
          is_archived?: boolean
          is_muted?: boolean
          is_pinned?: boolean
          joined_at?: string
          last_read_at?: string | null
          marked_unread?: boolean
          role?: string
          unread_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string | null
          id: string
          is_announcement: boolean
          name: string | null
          type: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_announcement?: boolean
          name?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_announcement?: boolean
          name?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_otp_codes: {
        Row: {
          attempts: number
          code_hash: string
          consumed: boolean
          created_at: string
          email: string
          expires_at: string
          id: string
          purpose: string
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed?: boolean
          created_at?: string
          email: string
          expires_at: string
          id?: string
          purpose?: string
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed?: boolean
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          purpose?: string
          user_id?: string
        }
        Relationships: []
      }
      linked_devices: {
        Row: {
          created_at: string
          device_code: string
          device_name: string
          id: string
          last_active_at: string
          platform: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_code: string
          device_name: string
          id?: string
          last_active_at?: string
          platform?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_code?: string
          device_name?: string
          id?: string
          last_active_at?: string
          platform?: string | null
          user_id?: string
        }
        Relationships: []
      }
      message_delete_audit: {
        Row: {
          attempt_type: string
          attempted_by: string
          conversation_id: string
          created_at: string
          id: string
          message_id: string
          prior_content: string | null
          prior_content_type: string | null
        }
        Insert: {
          attempt_type?: string
          attempted_by: string
          conversation_id: string
          created_at?: string
          id?: string
          message_id: string
          prior_content?: string | null
          prior_content_type?: string | null
        }
        Update: {
          attempt_type?: string
          attempted_by?: string
          conversation_id?: string
          created_at?: string
          id?: string
          message_id?: string
          prior_content?: string | null
          prior_content_type?: string | null
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          content_type: string
          conversation_id: string
          created_at: string
          deleted_by_sender: boolean
          forwarded_from_id: string | null
          id: string
          media_url: string | null
          reply_to_id: string | null
          sender_id: string
          status: string
        }
        Insert: {
          content?: string | null
          content_type?: string
          conversation_id: string
          created_at?: string
          deleted_by_sender?: boolean
          forwarded_from_id?: string | null
          id?: string
          media_url?: string | null
          reply_to_id?: string | null
          sender_id: string
          status?: string
        }
        Update: {
          content?: string | null
          content_type?: string
          conversation_id?: string
          created_at?: string
          deleted_by_sender?: boolean
          forwarded_from_id?: string | null
          id?: string
          media_url?: string | null
          reply_to_id?: string | null
          sender_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_forwarded_from_id_fkey"
            columns: ["forwarded_from_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      outbox_messages: {
        Row: {
          client_id: string
          conversation_id: string
          id: string
          queued_at: string
          sent_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          client_id: string
          conversation_id: string
          id?: string
          queued_at?: string
          sent_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          client_id?: string
          conversation_id?: string
          id?: string
          queued_at?: string
          sent_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      product_collections: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          collection_id: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          images: string[]
          in_stock: boolean
          link: string | null
          name: string
          price: number
          sku: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          collection_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          images?: string[]
          in_stock?: boolean
          link?: string | null
          name: string
          price?: number
          sku?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          collection_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          images?: string[]
          in_stock?: boolean
          link?: string | null
          name?: string
          price?: number
          sku?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "product_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          about: string | null
          avatar_url: string | null
          cover_url: string | null
          created_at: string
          display_name: string
          id: string
          is_online: boolean
          last_seen: string | null
          last_seen_visibility: string
          phone: string | null
          profile_photo_visibility: string
          show_last_seen: boolean
          show_profile_photo: boolean
          show_read_receipts: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          about?: string | null
          avatar_url?: string | null
          cover_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_online?: boolean
          last_seen?: string | null
          last_seen_visibility?: string
          phone?: string | null
          profile_photo_visibility?: string
          show_last_seen?: boolean
          show_profile_photo?: boolean
          show_read_receipts?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          about?: string | null
          avatar_url?: string | null
          cover_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_online?: boolean
          last_seen?: string | null
          last_seen_visibility?: string
          phone?: string | null
          profile_photo_visibility?: string
          show_last_seen?: boolean
          show_profile_photo?: boolean
          show_read_receipts?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quick_replies: {
        Row: {
          created_at: string
          id: string
          message: string
          shortcut: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          shortcut: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          shortcut?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reported_user_id: string
          reporter_id: string
          status: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reported_user_id: string
          reporter_id: string
          status?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reported_user_id?: string
          reporter_id?: string
          status?: string
        }
        Relationships: []
      }
      starred_messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: []
      }
      status_viewers: {
        Row: {
          id: string
          status_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          id?: string
          status_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          id?: string
          status_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "status_viewers_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      statuses: {
        Row: {
          background_color: string | null
          content: string | null
          content_type: string
          created_at: string
          expires_at: string
          id: string
          media_url: string | null
          privacy: string
          user_id: string
        }
        Insert: {
          background_color?: string | null
          content?: string | null
          content_type?: string
          created_at?: string
          expires_at?: string
          id?: string
          media_url?: string | null
          privacy?: string
          user_id: string
        }
        Update: {
          background_color?: string | null
          content?: string | null
          content_type?: string
          created_at?: string
          expires_at?: string
          id?: string
          media_url?: string | null
          privacy?: string
          user_id?: string
        }
        Relationships: []
      }
      typing_indicators: {
        Row: {
          conversation_id: string
          id: string
          is_typing: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          is_typing?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          is_typing?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "typing_indicators_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_community_admin: {
        Args: { _community_id: string; _user_id: string }
        Returns: boolean
      }
      is_community_member: {
        Args: { _community_id: string; _user_id: string }
        Returns: boolean
      }
      is_conversation_member: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
