
-- ============================================
-- 1. SUBSCRIPTION PLANS
-- ============================================
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name_ar text NOT NULL,
  tagline text,
  price_monthly numeric NOT NULL DEFAULT 0,
  price_yearly numeric NOT NULL DEFAULT 0,
  max_products integer NOT NULL DEFAULT 20,
  max_promotions integer NOT NULL DEFAULT 1,
  priority_boost integer NOT NULL DEFAULT 0,
  verified_badge boolean NOT NULL DEFAULT false,
  premium_badge boolean NOT NULL DEFAULT false,
  advanced_analytics boolean NOT NULL DEFAULT false,
  free_ad_credits numeric NOT NULL DEFAULT 0,
  custom_domain boolean NOT NULL DEFAULT false,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plans public read" ON public.subscription_plans
FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin manages plans" ON public.subscription_plans
FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER plans_updated_at BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed default plans
INSERT INTO public.subscription_plans (code, name_ar, tagline, price_monthly, price_yearly, max_products, max_promotions, priority_boost, verified_badge, premium_badge, advanced_analytics, free_ad_credits, features, display_order) VALUES
('free', 'مجاني', 'ابدأ متجرك مجاناً', 0, 0, 20, 1, 0, false, false, false, 0, '["20 منتج","عرض ت€جي واحد","إحصائيات أساسية"]'::jsonb, 1),
('silver', 'الفضية', 'نمو مستقر', 5000, 50000, 100, 3, 10, true, false, true, 1000, '["100 منتج","شارة موثق ⭐","3 عروض ت€جية","إحصائيات متقدمة","1,000 € €د إعلاني","أولوية ظهور +10"]'::jsonb, 2),
('gold', 'الذهبية', 'الأكثر مبيعاً 🔥', 15000, 150000, 500, 10, 30, true, true, true, 5000, '["500 منتج","شارة Premium 💎","10 عروض ت€جية","إحصائيات احترافية","5,000 € €د إعلاني","أولوية ظهور +30","دعم سريع 24/7"]'::jsonb, 3),
('platinum', 'البلاتينية', 'تفوق بلا حدود', 35000, 350000, 99999, 50, 100, true, true, true, 15000, '["منتجات غير محدودة","شارة Premium ذهبية 👑","50 عرض ت€جي","تحليلات AI","15,000 € €د إعلاني","أعلى أولوية ظهور","نطاق مخصص","مدير حساب شخصي"]'::jsonb, 4);

-- ============================================
-- 2. STORE SUBSCRIPTIONS
-- ============================================
CREATE TABLE public.store_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL UNIQUE,
  plan_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active', -- active | expired | cancelled
  billing_cycle text NOT NULL DEFAULT 'monthly', -- monthly | yearly
  starts_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  auto_renew boolean NOT NULL DEFAULT false,
  ad_credits_balance numeric NOT NULL DEFAULT 0,
  total_paid numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.store_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner sees subscription" ON public.store_subscriptions
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "subscription public read" ON public.store_subscriptions
FOR SELECT USING (status = 'active');

CREATE POLICY "admin manages subscriptions" ON public.store_subscriptions
FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.store_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_store_subs_active ON public.store_subscriptions(store_id, status, expires_at);

-- ============================================
-- 3. AD CAMPAIGNS
-- ============================================
CREATE TABLE public.ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  product_id uuid,
  campaign_type text NOT NULL, -- search_boost | category_banner | featured_product | homepage_hero
  title text NOT NULL,
  image_url text,
  target_category_id uuid,
  target_city text,
  bid_per_click numeric NOT NULL DEFAULT 50,
  daily_budget numeric NOT NULL DEFAULT 1000,
  total_budget numeric NOT NULL DEFAULT 5000,
  spent numeric NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending', -- pending | active | paused | finished | rejected
  starts_at timestamp with time zone NOT NULL DEFAULT now(),
  ends_at timestamp with time zone NOT NULL,
  reviewed_by uuid,
  rejection_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "active ads public" ON public.ad_campaigns
FOR SELECT USING (status = 'active' AND ends_at > now());

CREATE POLICY "owner manages campaigns" ON public.ad_campaigns
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid())
);

CREATE POLICY "admin manages all campaigns" ON public.ad_campaigns
FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER ads_updated_at BEFORE UPDATE ON public.ad_campaigns
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_ads_active ON public.ad_campaigns(status, campaign_type, ends_at);

-- ============================================
-- 4. AD EVENTS
-- ============================================
CREATE TABLE public.ad_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
  event_type text NOT NULL, -- impression | click
  user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone logs events" ON public.ad_events
FOR INSERT WITH CHECK (true);

CREATE POLICY "owner reads events" ON public.ad_events
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.ad_campaigns c JOIN public.stores s ON s.id = c.store_id
          WHERE c.id = campaign_id AND s.owner_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE INDEX idx_ad_events_campaign ON public.ad_events(campaign_id, event_type, created_at);

-- ============================================
-- 5. SECURITY DEFINER FUNCTIONS
-- ============================================

-- Subscribe to plan
CREATE OR REPLACE FUNCTION public.subscribe_to_plan(_store_id uuid, _plan_id uuid, _cycle text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _plan public.subscription_plans%ROWTYPE;
  _store public.stores%ROWTYPE;
  _amount numeric;
  _expires timestamp with time zone;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;

  SELECT * INTO _store FROM public.stores WHERE id = _store_id;
  IF _store.owner_id <> auth.uid() THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;

  SELECT * INTO _plan FROM public.subscription_plans WHERE id = _plan_id AND is_active = true;
  IF _plan IS NULL THEN RAISE EXCEPTION 'PLAN_NOT_FOUND'; END IF;

  IF _cycle = 'yearly' THEN
    _amount := _plan.price_yearly;
    _expires := now() + interval '1 year';
  ELSE
    _amount := _plan.price_monthly;
    _expires := now() + interval '1 month';
  END IF;

  IF _amount > 0 THEN
    PERFORM public.wallet_transact(auth.uid(), _amount, 'debit',
      'اشتراك باقة ' || _plan.name_ar || ' (' || _cycle || ')', 'SUB-' || _plan.code);
  END IF;

  INSERT INTO public.store_subscriptions(store_id, plan_id, billing_cycle, starts_at, expires_at, ad_credits_balance, total_paid, status)
  VALUES (_store_id, _plan_id, _cycle, now(), _expires, _plan.free_ad_credits, _amount, 'active')
  ON CONFLICT (store_id) DO UPDATE SET
    plan_id = EXCLUDED.plan_id,
    billing_cycle = EXCLUDED.billing_cycle,
    starts_at = EXCLUDED.starts_at,
    expires_at = EXCLUDED.expires_at,
    ad_credits_balance = public.store_subscriptions.ad_credits_balance + EXCLUDED.ad_credits_balance,
    total_paid = public.store_subscriptions.total_paid + EXCLUDED.total_paid,
    status = 'active',
    updated_at = now();

  -- Auto-verify store on paid plans
  IF _plan.verified_badge THEN
    UPDATE public.stores SET is_verified = true WHERE id = _store_id;
  END IF;

  INSERT INTO public.notifications(user_id, title, message, type)
  VALUES (auth.uid(), '🎉 تم تفعيل باقة ' || _plan.name_ar,
    'متجرك الآن في الباقة ' || _plan.name_ar || ' حتى ' || to_char(_expires, 'YYYY-MM-DD'),
    'system'::notification_type);

  RETURN jsonb_build_object('ok', true, 'expires_at', _expires, 'amount', _amount);
END $$;

-- Purchase ad campaign
CREATE OR REPLACE FUNCTION public.purchase_ad_campaign(
  _store_id uuid, _product_id uuid, _campaign_type text, _title text, _image_url text,
  _target_category uuid, _target_city text, _bid numeric, _daily_budget numeric,
  _total_budget numeric, _days integer
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _store public.stores%ROWTYPE;
  _sub public.store_subscriptions%ROWTYPE;
  _from_credits numeric := 0;
  _from_wallet numeric := 0;
  _campaign_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  SELECT * INTO _store FROM public.stores WHERE id = _store_id;
  IF _store.owner_id <> auth.uid() THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;
  IF _total_budget < 500 THEN RAISE EXCEPTION 'MIN_BUDGET_500'; END IF;

  -- Use ad credits first
  SELECT * INTO _sub FROM public.store_subscriptions WHERE store_id = _store_id AND status = 'active';
  IF _sub.id IS NOT NULL AND _sub.ad_credits_balance > 0 THEN
    _from_credits := LEAST(_sub.ad_credits_balance, _total_budget);
    UPDATE public.store_subscriptions SET ad_credits_balance = ad_credits_balance - _from_credits WHERE id = _sub.id;
  END IF;

  _from_wallet := _total_budget - _from_credits;
  IF _from_wallet > 0 THEN
    PERFORM public.wallet_transact(auth.uid(), _from_wallet, 'debit',
      'حملة إعلانية: ' || _title, 'AD-' || _campaign_type);
  END IF;

  INSERT INTO public.ad_campaigns(store_id, product_id, campaign_type, title, image_url,
    target_category_id, target_city, bid_per_click, daily_budget, total_budget,
    starts_at, ends_at, status)
  VALUES (_store_id, _product_id, _campaign_type, _title, _image_url,
    _target_category, _target_city, _bid, _daily_budget, _total_budget,
    now(), now() + (_days || ' days')::interval, 'active')
  RETURNING id INTO _campaign_id;

  RETURN jsonb_build_object('ok', true, 'campaign_id', _campaign_id,
    'from_credits', _from_credits, 'from_wallet', _from_wallet);
END $$;

-- Track ad event (impression/click) with budget guard
CREATE OR REPLACE FUNCTION public.track_ad_event(_campaign_id uuid, _event text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _camp public.ad_campaigns%ROWTYPE;
BEGIN
  SELECT * INTO _camp FROM public.ad_campaigns WHERE id = _campaign_id FOR UPDATE;
  IF _camp IS NULL OR _camp.status <> 'active' THEN
    RETURN jsonb_build_object('ok', false);
  END IF;

  INSERT INTO public.ad_events(campaign_id, event_type, user_id)
  VALUES (_campaign_id, _event, auth.uid());

  IF _event = 'impression' THEN
    UPDATE public.ad_campaigns SET impressions = impressions + 1 WHERE id = _campaign_id;
  ELSIF _event = 'click' THEN
    UPDATE public.ad_campaigns SET
      clicks = clicks + 1,
      spent = spent + _camp.bid_per_click,
      status = CASE WHEN spent + _camp.bid_per_click >= total_budget THEN 'finished' ELSE status END
    WHERE id = _campaign_id;
  END IF;

  RETURN jsonb_build_object('ok', true);
END $$;

-- Helper: get effective plan boost for a store (used in priority sorting)
CREATE OR REPLACE FUNCTION public.get_store_boost(_store_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(p.priority_boost, 0)
  FROM public.store_subscriptions ss
  JOIN public.subscription_plans p ON p.id = ss.plan_id
  WHERE ss.store_id = _store_id AND ss.status = 'active' AND ss.expires_at > now()
  LIMIT 1;
$$;
