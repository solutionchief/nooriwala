-- Business profiles (extends profiles for business mode)
CREATE TABLE public.business_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  business_mode boolean NOT NULL DEFAULT false,
  business_name text,
  category text,
  description text,
  address text,
  latitude numeric,
  longitude numeric,
  website text,
  email text,
  hours jsonb DEFAULT '{}'::jsonb,
  cover_url text,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View any business profile" ON public.business_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage own business profile insert" ON public.business_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Manage own business profile update" ON public.business_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Manage own business profile delete" ON public.business_profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER tr_business_profiles_updated BEFORE UPDATE ON public.business_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Product collections
CREATE TABLE public.product_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.product_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view collections" ON public.product_collections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner manage collections insert" ON public.product_collections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner manage collections update" ON public.product_collections FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner manage collections delete" ON public.product_collections FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Products
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  collection_id uuid REFERENCES public.product_collections(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  price numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  sku text,
  images text[] NOT NULL DEFAULT ARRAY[]::text[],
  link text,
  in_stock boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner manage products insert" ON public.products FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner manage products update" ON public.products FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner manage products delete" ON public.products FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER tr_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_products_user ON public.products(user_id);

-- Quick replies
CREATE TABLE public.quick_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  shortcut text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, shortcut)
);
ALTER TABLE public.quick_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner view quick replies" ON public.quick_replies FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner insert quick replies" ON public.quick_replies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner update quick replies" ON public.quick_replies FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner delete quick replies" ON public.quick_replies FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Chat labels
CREATE TABLE public.chat_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#22c55e',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_labels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner view labels" ON public.chat_labels FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner insert labels" ON public.chat_labels FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner update labels" ON public.chat_labels FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner delete labels" ON public.chat_labels FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Conversation labels (link table)
CREATE TABLE public.conversation_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  conversation_id uuid NOT NULL,
  label_id uuid NOT NULL REFERENCES public.chat_labels(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, conversation_id, label_id)
);
ALTER TABLE public.conversation_labels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner view conv labels" ON public.conversation_labels FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner insert conv labels" ON public.conversation_labels FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.is_conversation_member(auth.uid(), conversation_id));
CREATE POLICY "Owner delete conv labels" ON public.conversation_labels FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Away / Greeting messages
CREATE TABLE public.away_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  greeting_enabled boolean NOT NULL DEFAULT false,
  greeting_text text DEFAULT 'Hello! Thanks for reaching out. We''ll get back to you soon.',
  away_enabled boolean NOT NULL DEFAULT false,
  away_text text DEFAULT 'We''re currently closed. We''ll respond during business hours.',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.away_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner view away" ON public.away_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner insert away" ON public.away_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner update away" ON public.away_messages FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER tr_away_updated BEFORE UPDATE ON public.away_messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Outbox audit (offline queue server mirror)
CREATE TABLE public.outbox_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id text NOT NULL,
  conversation_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  queued_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  UNIQUE (user_id, client_id)
);
ALTER TABLE public.outbox_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner view outbox" ON public.outbox_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner insert outbox" ON public.outbox_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner update outbox" ON public.outbox_messages FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Public read product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Owner upload product images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner update product images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner delete product images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);