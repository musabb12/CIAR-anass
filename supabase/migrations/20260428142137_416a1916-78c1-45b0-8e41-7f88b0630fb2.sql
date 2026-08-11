-- ============ Extend products with rich fields ============
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS brand text,
  ADD COLUMN IF NOT EXISTS size text,
  ADD COLUMN IF NOT EXISTS weight text,
  ADD COLUMN IF NOT EXISTS dimensions text,
  ADD COLUMN IF NOT EXISTS material text,
  ADD COLUMN IF NOT EXISTS usage text,
  ADD COLUMN IF NOT EXISTS specs jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS variants jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sku text,
  ADD COLUMN IF NOT EXISTS condition text DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS warranty text,
  ADD COLUMN IF NOT EXISTS product_type text;

-- ============ Store Promotions ============
CREATE TABLE IF NOT EXISTS public.store_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  image_url text,
  discount_pct numeric DEFAULT 0,
  starts_at timestamptz DEFAULT now(),
  ends_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.store_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promo public read" ON public.store_promotions FOR SELECT USING (true);
CREATE POLICY "owner manages promo" ON public.store_promotions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));

-- ============ Store Announcements ============
CREATE TABLE IF NOT EXISTS public.store_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  title text NOT NULL,
  content text,
  image_url text,
  priority int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.store_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ann public read" ON public.store_announcements FOR SELECT USING (true);
CREATE POLICY "owner manages ann" ON public.store_announcements FOR ALL
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));

-- ============ Store Rewards / Coupons ============
CREATE TABLE IF NOT EXISTS public.store_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  code text NOT NULL,
  reward_type text NOT NULL DEFAULT 'percent', -- percent | fixed | gift
  value numeric NOT NULL DEFAULT 0,
  min_order numeric DEFAULT 0,
  max_uses int DEFAULT 100,
  used_count int DEFAULT 0,
  description text,
  is_active boolean DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id, code)
);
ALTER TABLE public.store_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rewards public read" ON public.store_rewards FOR SELECT USING (is_active = true);
CREATE POLICY "owner manages rewards" ON public.store_rewards FOR ALL
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));

-- ============ Store Settings ============
CREATE TABLE IF NOT EXISTS public.store_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL UNIQUE,
  primary_color text DEFAULT '#4B0082',
  accent_color text DEFAULT '#FFD700',
  background_url text,
  layout text DEFAULT 'grid',
  currency text DEFAULT 'YER',
  shipping_policy text,
  return_policy text,
  privacy_policy text,
  social_links jsonb DEFAULT '{}'::jsonb,
  business_hours jsonb DEFAULT '{}'::jsonb,
  payment_methods jsonb DEFAULT '[]'::jsonb,
  whatsapp text,
  telegram text,
  email text,
  location_lat numeric,
  location_lng numeric,
  location_address text,
  accepts_jobs boolean DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings public read" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "owner manages settings" ON public.store_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));

-- ============ Store Support Tickets ============
CREATE TABLE IF NOT EXISTS public.store_support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  user_id uuid NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  reply text,
  status text NOT NULL DEFAULT 'open', -- open | answered | closed
  priority text NOT NULL DEFAULT 'normal',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.store_support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user creates ticket" ON public.store_support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user sees own tickets" ON public.store_support_tickets FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));
CREATE POLICY "owner replies tickets" ON public.store_support_tickets FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));

-- ============ Store Reports ============
CREATE TABLE IF NOT EXISTS public.store_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  product_id uuid,
  reporter_id uuid NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending', -- pending | reviewing | resolved | rejected
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.store_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user submits report" ON public.store_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "view reports" ON public.store_reports FOR SELECT
  USING (auth.uid() = reporter_id 
    OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "owner/admin update reports" ON public.store_reports FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role));

-- ============ Store Contact Messages ============
CREATE TABLE IF NOT EXISTS public.store_contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  sender_id uuid,
  name text NOT NULL,
  email text,
  phone text,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.store_contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone sends contact" ON public.store_contact_messages FOR INSERT
  WITH CHECK (true);
CREATE POLICY "owner reads contacts" ON public.store_contact_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid())
    OR auth.uid() = sender_id);
CREATE POLICY "owner updates contacts" ON public.store_contact_messages FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));

-- ============ Store Followers ============
CREATE TABLE IF NOT EXISTS public.store_followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id, user_id)
);
ALTER TABLE public.store_followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "followers public read" ON public.store_followers FOR SELECT USING (true);
CREATE POLICY "user follows" ON public.store_followers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user unfollows" ON public.store_followers FOR DELETE USING (auth.uid() = user_id);

-- ============ Storage bucket for store/product media ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-media', 'store-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "store-media public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'store-media');

CREATE POLICY "auth uploads to store-media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'store-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "owner updates store-media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'store-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "owner deletes store-media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'store-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============ Trigger: auto-create store_settings when store is created ============
CREATE OR REPLACE FUNCTION public.create_store_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.store_settings(store_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_store_settings ON public.stores;
CREATE TRIGGER trg_store_settings
AFTER INSERT ON public.stores
FOR EACH ROW EXECUTE FUNCTION public.create_store_settings();