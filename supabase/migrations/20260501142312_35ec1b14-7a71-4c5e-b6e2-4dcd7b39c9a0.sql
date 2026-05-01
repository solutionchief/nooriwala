
-- Raise pin limit to 10
CREATE OR REPLACE FUNCTION public.enforce_pin_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.is_pinned = true THEN
    IF (SELECT COUNT(*) FROM public.conversation_participants
        WHERE user_id = NEW.user_id AND is_pinned = true
        AND id != NEW.id) >= 10 THEN
      RAISE EXCEPTION 'Maximum 10 pinned conversations allowed';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Mute + manual unread on participants
ALTER TABLE public.conversation_participants
  ADD COLUMN IF NOT EXISTS is_muted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marked_unread boolean NOT NULL DEFAULT false;

-- Announcement flag for community announcement chats
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS is_announcement boolean NOT NULL DEFAULT false;

-- ============== STARRED MESSAGES ==============
CREATE TABLE IF NOT EXISTS public.starred_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  message_id uuid NOT NULL,
  conversation_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, message_id)
);
ALTER TABLE public.starred_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner view starred" ON public.starred_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner add starred" ON public.starred_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.is_conversation_member(auth.uid(), conversation_id));
CREATE POLICY "Owner remove starred" ON public.starred_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_starred_user ON public.starred_messages(user_id, created_at DESC);

-- ============== CHANNELS ==============
CREATE TABLE IF NOT EXISTS public.channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  handle text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  avatar_url text,
  is_verified boolean NOT NULL DEFAULT false,
  follower_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view channels" ON public.channels FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner create channel" ON public.channels FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner update channel" ON public.channels FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Owner delete channel" ON public.channels FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE TRIGGER channels_updated BEFORE UPDATE ON public.channels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_channels_owner ON public.channels(owner_id);

CREATE TABLE IF NOT EXISTS public.channel_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  content text,
  content_type text NOT NULL DEFAULT 'text',
  media_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.channel_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view posts" ON public.channel_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner create post" ON public.channel_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id AND EXISTS (SELECT 1 FROM public.channels c WHERE c.id = channel_id AND c.owner_id = auth.uid()));
CREATE POLICY "Owner delete post" ON public.channel_posts FOR DELETE TO authenticated USING (auth.uid() = author_id);
CREATE INDEX IF NOT EXISTS idx_channel_posts_channel ON public.channel_posts(channel_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.channel_followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (channel_id, user_id)
);
ALTER TABLE public.channel_followers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own follows or own channel" ON public.channel_followers FOR SELECT TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.channels c WHERE c.id = channel_id AND c.owner_id = auth.uid()));
CREATE POLICY "Self follow" ON public.channel_followers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Self unfollow" ON public.channel_followers FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_followers_user ON public.channel_followers(user_id);

-- Maintain follower_count
CREATE OR REPLACE FUNCTION public.bump_follower_count()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.channels SET follower_count = follower_count + 1 WHERE id = NEW.channel_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.channels SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = OLD.channel_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;
CREATE TRIGGER channel_followers_count_ins AFTER INSERT ON public.channel_followers FOR EACH ROW EXECUTE FUNCTION public.bump_follower_count();
CREATE TRIGGER channel_followers_count_del AFTER DELETE ON public.channel_followers FOR EACH ROW EXECUTE FUNCTION public.bump_follower_count();

-- ============== COMMUNITIES ==============
CREATE TABLE IF NOT EXISTS public.communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  name text NOT NULL,
  description text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER communities_updated BEFORE UPDATE ON public.communities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.community_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (community_id, user_id)
);
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_community_member(_user_id uuid, _community_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.community_members WHERE user_id = _user_id AND community_id = _community_id)
$$;

CREATE OR REPLACE FUNCTION public.is_community_admin(_user_id uuid, _community_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.community_members WHERE user_id = _user_id AND community_id = _community_id AND role IN ('admin','owner'))
$$;

CREATE POLICY "Members view community" ON public.communities FOR SELECT TO authenticated USING (public.is_community_member(auth.uid(), id) OR auth.uid() = created_by);
CREATE POLICY "Anyone create community" ON public.communities FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Admins update community" ON public.communities FOR UPDATE TO authenticated USING (public.is_community_admin(auth.uid(), id) OR auth.uid() = created_by);
CREATE POLICY "Creator deletes community" ON public.communities FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Members view membership" ON public.community_members FOR SELECT TO authenticated USING (public.is_community_member(auth.uid(), community_id));
CREATE POLICY "Self join or admin add" ON public.community_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.is_community_admin(auth.uid(), community_id));
CREATE POLICY "Self leave or admin remove" ON public.community_members FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.is_community_admin(auth.uid(), community_id));

CREATE TABLE IF NOT EXISTS public.community_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (community_id, conversation_id)
);
ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view community groups" ON public.community_groups FOR SELECT TO authenticated USING (public.is_community_member(auth.uid(), community_id));
CREATE POLICY "Admins link group" ON public.community_groups FOR INSERT TO authenticated WITH CHECK (public.is_community_admin(auth.uid(), community_id));
CREATE POLICY "Admins unlink group" ON public.community_groups FOR DELETE TO authenticated USING (public.is_community_admin(auth.uid(), community_id));

-- Auto-add creator as owner member
CREATE OR REPLACE FUNCTION public.community_add_creator()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.community_members (community_id, user_id, role) VALUES (NEW.id, NEW.created_by, 'owner');
  RETURN NEW;
END;
$$;
CREATE TRIGGER communities_add_owner AFTER INSERT ON public.communities FOR EACH ROW EXECUTE FUNCTION public.community_add_creator();

-- ============== LINKED DEVICES ==============
CREATE TABLE IF NOT EXISTS public.linked_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  device_name text NOT NULL,
  device_code text NOT NULL,
  platform text,
  last_active_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.linked_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner view devices" ON public.linked_devices FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner add device" ON public.linked_devices FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner update device" ON public.linked_devices FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner remove device" ON public.linked_devices FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_devices_user ON public.linked_devices(user_id, last_active_at DESC);
