-- 1. حماية المحفظة (PIN + OTP)
CREATE TABLE public.wallet_security (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  pin_hash text,
  otp_code text,
  otp_expires_at timestamptz,
  failed_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.wallet_security ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user manages own wallet security" ON public.wallet_security
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. طرق الدفع المتعددة
CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL, -- 'wallet' | 'bank_kuraimi' | 'bank_qasimi' | 'bank_tadhamon' | 'binance' | 'crypto_usdt' | 'cod'
  label text,
  account_ref text, -- masked account/wallet identifier
  is_default boolean DEFAULT false,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user manages own payment methods" ON public.payment_methods
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. نوايا الشحن (للتحويلات البنكية اليدوية)
CREATE TABLE public.payment_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  gateway text NOT NULL, -- 'kuraimi' | 'qasimi' | 'tadhamon' | 'binance' | ...
  reference text,
  proof_url text,
  status text NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user sees own intents" ON public.payment_intents
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "user creates intents" ON public.payment_intents
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin updates intents" ON public.payment_intents
  FOR UPDATE USING (public.has_role(auth.uid(),'admin'));

-- 4. تقسيم العمولة
CREATE TABLE public.commission_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  app_amount numeric NOT NULL DEFAULT 0,
  seller_amount numeric NOT NULL DEFAULT 0,
  pilot_amount numeric NOT NULL DEFAULT 0,
  pilot_tip numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.commission_splits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin views splits" ON public.commission_splits
  FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "order parties view splits" ON public.commission_splits
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = commission_splits.order_id
      AND (o.customer_id = auth.uid() OR o.pilot_id = auth.uid())
  ));

-- 5. مواقع GPS الحية
CREATE TABLE public.live_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  order_id uuid,
  role text NOT NULL, -- 'pilot' | 'customer' | 'seller'
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  heading numeric,
  speed numeric,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_live_locations_order ON public.live_locations(order_id);
CREATE INDEX idx_live_locations_user ON public.live_locations(user_id);
ALTER TABLE public.live_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "self upserts location" ON public.live_locations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "self updates location" ON public.live_locations
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "order participants view location" ON public.live_locations
  FOR SELECT USING (
    auth.uid() = user_id OR
    (order_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = live_locations.order_id
        AND (o.customer_id = auth.uid() OR o.pilot_id = auth.uid()
             OR EXISTS (SELECT 1 FROM public.order_items oi
                        JOIN public.products p ON p.id = oi.product_id
                        JOIN public.stores s ON s.id = p.store_id
                        WHERE oi.order_id = o.id AND s.owner_id = auth.uid()))
    ))
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.live_locations;
ALTER TABLE public.live_locations REPLICA IDENTITY FULL;

-- 6. المحادثات المشفرة
CREATE TABLE public.chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid,
  participants uuid[] NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants see threads" ON public.chat_threads
  FOR SELECT USING (auth.uid() = ANY(participants));
CREATE POLICY "create thread as participant" ON public.chat_threads
  FOR INSERT WITH CHECK (auth.uid() = ANY(participants));

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  ciphertext text NOT NULL,
  iv text,
  is_read boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_chat_messages_thread ON public.chat_messages(thread_id, created_at);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "thread participants read messages" ON public.chat_messages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.chat_threads t
    WHERE t.id = chat_messages.thread_id AND auth.uid() = ANY(t.participants)
  ));
CREATE POLICY "thread participants send messages" ON public.chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND EXISTS (
      SELECT 1 FROM public.chat_threads t
      WHERE t.id = chat_messages.thread_id AND auth.uid() = ANY(t.participants)
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- 7. إشارات الاحتيال + جلسات الأجهزة
CREATE TABLE public.fraud_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  kind text NOT NULL,
  severity text NOT NULL DEFAULT 'low',
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fraud_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin reads signals" ON public.fraud_signals
  FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "system inserts signals" ON public.fraud_signals
  FOR INSERT WITH CHECK (true);

CREATE TABLE public.device_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  device_fingerprint text NOT NULL,
  user_agent text,
  ip_hash text,
  trusted boolean DEFAULT false,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user sees own devices" ON public.device_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user records device" ON public.device_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user updates device" ON public.device_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- 8. إعدادات التطبيق (نسبة العمولة)
CREATE TABLE public.app_settings (
  id integer PRIMARY KEY DEFAULT 1,
  app_commission_pct numeric NOT NULL DEFAULT 5.0,
  pilot_base_pct numeric NOT NULL DEFAULT 80.0,
  min_pilot_fee numeric NOT NULL DEFAULT 500,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT singleton CHECK (id = 1)
);
INSERT INTO public.app_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "admin manages settings" ON public.app_settings
  FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 9. حقول جديدة للمنتجات والطلبات
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS auto_hide_when_oos boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS visibility_status text NOT NULL DEFAULT 'visible';

-- دالة لتحديث visibility تلقائياً عند تغير المخزون
CREATE OR REPLACE FUNCTION public.sync_product_visibility()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.auto_hide_when_oos THEN
    IF NEW.stock <= 0 THEN
      NEW.visibility_status := 'hidden_oos';
      NEW.is_active := false;
    ELSIF OLD.visibility_status = 'hidden_oos' AND NEW.stock > 0 THEN
      NEW.visibility_status := 'visible';
      NEW.is_active := true;
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_product_visibility ON public.products;
CREATE TRIGGER trg_product_visibility
  BEFORE UPDATE OF stock, auto_hide_when_oos ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.sync_product_visibility();

-- 10. الكوميشن: حساب وتقسيم
CREATE OR REPLACE FUNCTION public.compute_split(_subtotal numeric, _shipping numeric, _tip numeric)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  s public.app_settings%ROWTYPE;
  app_amt numeric; pilot_amt numeric; seller_amt numeric;
BEGIN
  SELECT * INTO s FROM public.app_settings WHERE id = 1;
  app_amt := round(_subtotal * (s.app_commission_pct / 100.0), 2);
  pilot_amt := GREATEST(round(_shipping * (s.pilot_base_pct / 100.0), 2), s.min_pilot_fee);
  seller_amt := _subtotal - app_amt;
  RETURN jsonb_build_object(
    'app_amount', app_amt,
    'seller_amount', seller_amt,
    'pilot_amount', pilot_amt,
    'pilot_tip', COALESCE(_tip, 0)
  );
END $$;

-- 11. ت€ة confirm_delivery لتقسيم العمولة فعلياً
CREATE OR REPLACE FUNCTION public.confirm_delivery(_order_id uuid, _code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _order public.orders%ROWTYPE;
  _split jsonb;
  _seller_id uuid;
BEGIN
  SELECT * INTO _order FROM public.orders WHERE id = _order_id FOR UPDATE;
  IF _order IS NULL THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;
  -- سواء العميل أو السائق يمكنه إدخال الكود (السائق يدخل كود التسليم الذهبي)
  IF auth.uid() NOT IN (_order.customer_id, _order.pilot_id) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;
  IF _order.escrow_status NOT IN ('held') THEN RAISE EXCEPTION 'NOT_IN_ESCROW'; END IF;
  IF _order.escrow_code IS DISTINCT FROM _code THEN RAISE EXCEPTION 'INVALID_CODE'; END IF;

  _split := public.compute_split(_order.subtotal, _order.shipping_fee, COALESCE(_order.pilot_tip, 0));

  -- اعثر على البائع الأول من order_items
  SELECT s.owner_id INTO _seller_id
  FROM public.order_items oi
  JOIN public.products p ON p.id = oi.product_id
  JOIN public.stores s ON s.id = p.store_id
  WHERE oi.order_id = _order_id
  LIMIT 1;

  -- اعتماد البائع
  IF _seller_id IS NOT NULL THEN
    PERFORM public.wallet_transact(_seller_id, (_split->>'seller_amount')::numeric,
      'credit', 'مستحقات بيع - ' || _order.order_number, _order.order_number);
  END IF;

  -- اعتماد السائق
  IF _order.pilot_id IS NOT NULL THEN
    PERFORM public.wallet_transact(_order.pilot_id,
      (_split->>'pilot_amount')::numeric + (_split->>'pilot_tip')::numeric,
      'tip', 'أجرة توصيل + إكرامية', _order.order_number);
  END IF;

  INSERT INTO public.commission_splits(order_id, app_amount, seller_amount, pilot_amount, pilot_tip)
  VALUES (_order_id,
    (_split->>'app_amount')::numeric,
    (_split->>'seller_amount')::numeric,
    (_split->>'pilot_amount')::numeric,
    (_split->>'pilot_tip')::numeric);

  UPDATE public.orders SET
    status = 'delivered', payment_status = 'paid', escrow_status = 'released',
    escrow_released_at = now(), updated_at = now()
  WHERE id = _order_id;

  INSERT INTO public.notifications(user_id, title, message, type, link)
  VALUES (_order.customer_id, '✅ تم تأكيد التسليم',
    'تم تحرير المبالغ بنجاح للبائع والسائق. شكراً لاستخدامك مارد التفوق!',
    'order'::notification_type, '/orders/' || _order_id);

  RETURN jsonb_build_object('ok', true, 'split', _split);
END $$;

-- 12. دالة تعيين/التحقق من PIN المحفظة
CREATE OR REPLACE FUNCTION public.set_wallet_pin(_pin text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE _hash text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  IF length(_pin) < 4 OR length(_pin) > 8 THEN RAISE EXCEPTION 'INVALID_PIN_LENGTH'; END IF;
  _hash := encode(extensions.digest(_pin || auth.uid()::text, 'sha256'), 'hex');
  INSERT INTO public.wallet_security(user_id, pin_hash)
  VALUES (auth.uid(), _hash)
  ON CONFLICT (user_id) DO UPDATE SET pin_hash = EXCLUDED.pin_hash, updated_at = now(),
    failed_attempts = 0, locked_until = NULL;
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.verify_wallet_pin(_pin text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE _row public.wallet_security%ROWTYPE; _hash text;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  SELECT * INTO _row FROM public.wallet_security WHERE user_id = auth.uid();
  IF _row IS NULL OR _row.pin_hash IS NULL THEN RETURN false; END IF;
  IF _row.locked_until IS NOT NULL AND _row.locked_until > now() THEN RAISE EXCEPTION 'WALLET_LOCKED'; END IF;
  _hash := encode(extensions.digest(_pin || auth.uid()::text, 'sha256'), 'hex');
  IF _hash = _row.pin_hash THEN
    UPDATE public.wallet_security SET failed_attempts = 0 WHERE user_id = auth.uid();
    RETURN true;
  ELSE
    UPDATE public.wallet_security SET failed_attempts = failed_attempts + 1,
      locked_until = CASE WHEN failed_attempts + 1 >= 5 THEN now() + interval '15 minutes' ELSE locked_until END
      WHERE user_id = auth.uid();
    RETURN false;
  END IF;
END $$;

-- 13. إنشاء امتداد التشفير إن لم يوجد
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 14. updated_at triggers
CREATE TRIGGER trg_wallet_security_updated BEFORE UPDATE ON public.wallet_security
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_payment_intents_updated BEFORE UPDATE ON public.payment_intents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();