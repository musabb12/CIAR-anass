-- === Admin read access to device sessions ===
DROP POLICY IF EXISTS "admin reads devices" ON public.device_sessions;
CREATE POLICY "admin reads devices" ON public.device_sessions
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "admin updates devices" ON public.device_sessions;
CREATE POLICY "admin updates devices" ON public.device_sessions
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));

-- === Orders: admin status change ===
CREATE OR REPLACE FUNCTION public.admin_update_order_status(_order_id uuid, _status order_status)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _o record;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;
  UPDATE public.orders SET status = _status, updated_at = now() WHERE id = _order_id RETURNING * INTO _o;
  IF _o.id IS NULL THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;

  INSERT INTO public.admin_actions(admin_id, action_type, target_type, target_id, reason, metadata)
  VALUES (auth.uid(), 'order_status', 'order', _order_id, _status::text, jsonb_build_object('order_number', _o.order_number));

  INSERT INTO public.notifications(user_id, title, message, type)
  VALUES (_o.customer_id, '📦 تحديث حالة الطلب',
    'طلبك ' || _o.order_number || ' أصبح: ' || _status::text, 'order'::notification_type);

  RETURN jsonb_build_object('ok', true);
END $$;

-- === Orders: assign pilot ===
CREATE OR REPLACE FUNCTION public.admin_assign_order_pilot(_order_id uuid, _pilot_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _o record;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;
  IF _pilot_id IS NOT NULL AND NOT public.has_role(_pilot_id, 'pilot'::app_role) THEN
    RAISE EXCEPTION 'NOT_A_PILOT';
  END IF;

  UPDATE public.orders SET pilot_id = _pilot_id, updated_at = now() WHERE id = _order_id RETURNING * INTO _o;
  IF _o.id IS NULL THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;

  INSERT INTO public.admin_actions(admin_id, action_type, target_type, target_id, reason, metadata)
  VALUES (auth.uid(), 'assign_pilot', 'order', _order_id, coalesce(_pilot_id::text, 'unassigned'), jsonb_build_object('order_number', _o.order_number));

  IF _pilot_id IS NOT NULL THEN
    INSERT INTO public.notifications(user_id, title, message, type)
    VALUES (_pilot_id, '🛵 مهمة توصيل جديدة', 'تم تعيينك للطلب ' || _o.order_number, 'order'::notification_type);
  END IF;

  RETURN jsonb_build_object('ok', true);
END $$;

-- === Orders: refund ===
CREATE OR REPLACE FUNCTION public.admin_refund_order(_order_id uuid, _reason text DEFAULT 'استرجاع إداري')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _o record; _tx uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;
  SELECT * INTO _o FROM public.orders WHERE id = _order_id;
  IF _o.id IS NULL THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;
  IF _o.payment_status = 'refunded' THEN RAISE EXCEPTION 'ALREADY_REFUNDED'; END IF;

  _tx := public.wallet_transact(_o.customer_id, _o.total, 'credit',
    'استرجاع مبلغ الطلب ' || _o.order_number || ' - ' || _reason, _o.order_number);

  UPDATE public.orders
    SET payment_status = 'refunded'::payment_status, status = 'cancelled'::order_status, updated_at = now()
  WHERE id = _order_id;

  INSERT INTO public.admin_actions(admin_id, action_type, target_type, target_id, reason, metadata)
  VALUES (auth.uid(), 'refund_order', 'order', _order_id, _reason, jsonb_build_object('amount', _o.total, 'tx', _tx));

  INSERT INTO public.notifications(user_id, title, message, type)
  VALUES (_o.customer_id, '💸 تم استرجاع مبلغ طلبك',
    'تمت إعادة ' || _o.total::text || ' ر.ي إلى محفظتك للطلب ' || _o.order_number, 'wallet'::notification_type);

  RETURN jsonb_build_object('ok', true, 'tx', _tx);
END $$;

-- === Pilots overview ===
CREATE OR REPLACE FUNCTION public.admin_pilots_overview()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE AS $$
DECLARE _res jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;

  SELECT coalesce(jsonb_agg(x ORDER BY x->>'full_name'), '[]'::jsonb) INTO _res
  FROM (
    SELECT jsonb_build_object(
      'user_id', ur.user_id,
      'full_name', p.full_name,
      'phone', p.phone,
      'avatar_url', p.avatar_url,
      'city', p.city,
      'joined_at', ur.created_at,
      'total_tasks', (SELECT count(*) FROM public.orders o WHERE o.pilot_id = ur.user_id),
      'active_tasks', (SELECT count(*) FROM public.orders o WHERE o.pilot_id = ur.user_id AND o.status IN ('confirmed','preparing','shipping')),
      'delivered_tasks', (SELECT count(*) FROM public.orders o WHERE o.pilot_id = ur.user_id AND o.status = 'delivered'),
      'earnings', (SELECT coalesce(sum(o.shipping_fee + o.pilot_tip),0) FROM public.orders o WHERE o.pilot_id = ur.user_id AND o.status = 'delivered'),
      'balance', (SELECT coalesce(w.balance,0) FROM public.wallets w WHERE w.user_id = ur.user_id),
      'banned', EXISTS (SELECT 1 FROM public.user_bans b WHERE b.user_id = ur.user_id AND b.is_active),
      'last_location', (SELECT jsonb_build_object('lat', l.lat, 'lng', l.lng, 'updated_at', l.updated_at)
                        FROM public.live_locations l WHERE l.user_id = ur.user_id ORDER BY l.updated_at DESC LIMIT 1)
    ) AS x
    FROM public.user_roles ur
    LEFT JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.role = 'pilot'::app_role
  ) s;

  RETURN _res;
END $$;

-- === Security overview ===
CREATE OR REPLACE FUNCTION public.admin_security_overview()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;
  RETURN jsonb_build_object(
    'signals_total', (SELECT count(*) FROM public.fraud_signals),
    'signals_high', (SELECT count(*) FROM public.fraud_signals WHERE severity = 'high'),
    'signals_24h', (SELECT count(*) FROM public.fraud_signals WHERE created_at > now() - interval '24 hours'),
    'devices_total', (SELECT count(*) FROM public.device_sessions),
    'devices_trusted', (SELECT count(*) FROM public.device_sessions WHERE trusted),
    'active_bans', (SELECT count(*) FROM public.user_bans WHERE is_active),
    'locked_wallets', (SELECT count(*) FROM public.wallet_security WHERE locked_until IS NOT NULL AND locked_until > now())
  );
END $$;

-- === Trust / untrust a device ===
CREATE OR REPLACE FUNCTION public.admin_trust_device(_device_id uuid, _trusted boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;
  UPDATE public.device_sessions SET trusted = _trusted WHERE id = _device_id;
  INSERT INTO public.admin_actions(admin_id, action_type, target_type, target_id, reason)
  VALUES (auth.uid(), 'trust_device', 'device', _device_id, CASE WHEN _trusted THEN 'trusted' ELSE 'untrusted' END);
  RETURN jsonb_build_object('ok', true);
END $$;