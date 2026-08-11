
-- 1. app_integrations: remove public read of webhook secrets
DROP POLICY IF EXISTS "public_read_enabled_integrations" ON public.app_integrations;

-- 2. profiles: restrict reads to authenticated users (hides phone from anon)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated"
  ON public.profiles FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.profiles FROM anon;

-- 3. store_followers: restrict reads to authenticated users
DROP POLICY IF EXISTS "followers public read" ON public.store_followers;
CREATE POLICY "followers authenticated read"
  ON public.store_followers FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.store_followers FROM anon;

-- 4. site_settings: enable RLS + proper policies
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;
CREATE POLICY "site_settings public read"
  ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "site_settings admin write"
  ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 5. user_roles: block privilege escalation - signup may only insert 'customer'
DROP POLICY IF EXISTS "Users can insert their own role on signup" ON public.user_roles;
CREATE POLICY "Users can insert their own customer role on signup"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND role = 'customer'::app_role);

-- 6. support-evidence storage: replace public read with owner+admin read
DROP POLICY IF EXISTS "evidence public read" ON storage.objects;
CREATE POLICY "evidence owner or admin read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'support-evidence'
    AND (
      (auth.uid())::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin'::app_role)
    )
  );

-- 7. fraud_signals: restrict inserts to authenticated users tagging themselves
DROP POLICY IF EXISTS "system inserts signals" ON public.fraud_signals;
CREATE POLICY "auth inserts own signals"
  ON public.fraud_signals FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- 8. ad_events: restrict raw inserts to authenticated users (RPC track_ad_event still works via SECURITY DEFINER)
DROP POLICY IF EXISTS "anyone logs events" ON public.ad_events;
CREATE POLICY "auth logs events"
  ON public.ad_events FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
