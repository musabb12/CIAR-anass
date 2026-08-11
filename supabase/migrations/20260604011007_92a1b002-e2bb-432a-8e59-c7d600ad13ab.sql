CREATE TABLE IF NOT EXISTS public.hero_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_type text NOT NULL DEFAULT 'image',
  url text NOT NULL,
  poster_url text,
  title text,
  subtitle text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  overlay_opacity numeric NOT NULL DEFAULT 0.55,
  duration_ms int NOT NULL DEFAULT 6000,
  effect text NOT NULL DEFAULT 'kenburns',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hero_media TO anon, authenticated;
GRANT ALL ON public.hero_media TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.hero_media TO authenticated;
ALTER TABLE public.hero_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hero_media public read" ON public.hero_media FOR SELECT USING (true);
CREATE POLICY "hero_media admin insert" ON public.hero_media FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "hero_media admin update" ON public.hero_media FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "hero_media admin delete" ON public.hero_media FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX IF NOT EXISTS hero_media_active_idx ON public.hero_media(is_active, sort_order);
ALTER PUBLICATION supabase_realtime ADD TABLE public.hero_media;