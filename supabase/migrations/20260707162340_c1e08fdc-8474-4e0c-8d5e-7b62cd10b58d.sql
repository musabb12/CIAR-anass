
-- Phase 1: Admin Store Management RPCs

-- Add commission override + featured flag on stores
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS commission_pct_override numeric,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_until timestamptz,
  ADD COLUMN IF NOT EXISTS admin_notes text;

-- Suspend / unsuspend a store (soft, keeps data)
CREATE OR REPLACE FUNCTION public.admin_suspend_store(_store_id uuid, _suspend boolean, _reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _owner uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;
  UPDATE public.stores SET
    suspended = _suspend,
    suspended_reason = CASE WHEN _suspend THEN _reason ELSE NULL END,
    is_active = CASE WHEN _suspend THEN false ELSE is_active END,
    updated_at = now()
  WHERE id = _store_id
  RETURNING owner_id INTO _owner;

  INSERT INTO public.admin_actions(admin_id, action_type, target_type, target_id, reason)
  VALUES (auth.uid(), CASE WHEN _suspend THEN 'suspend_store' ELSE 'unsuspend_store' END, 'store', _store_id, _reason);

  IF _owner IS NOT NULL THEN
    INSERT INTO public.notifications(user_id, title, message, type)
    VALUES (_owner,
      CASE WHEN _suspend THEN '⛔ تم تعليق متجرك' ELSE '✅ تم إعادة تفعيل متجرك' END,
      COALESCE('السبب: ' || _reason, 'تواصل مع الإدارة للمزيد'),
      'system'::notification_type);
  END IF;

  RETURN jsonb_build_object('ok', true, 'suspended', _suspend);
END $$;

-- Feature / unfeature a store
CREATE OR REPLACE FUNCTION public.admin_feature_store(_store_id uuid, _featured boolean, _days integer DEFAULT 7)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;
  UPDATE public.stores SET
    is_featured = _featured,
    featured_until = CASE WHEN _featured THEN now() + (_days || ' days')::interval ELSE NULL END,
    updated_at = now()
  WHERE id = _store_id;
  INSERT INTO public.admin_actions(admin_id, action_type, target_type, target_id, metadata)
  VALUES (auth.uid(), CASE WHEN _featured THEN 'feature_store' ELSE 'unfeature_store' END, 'store', _store_id,
          jsonb_build_object('days', _days));
  RETURN jsonb_build_object('ok', true);
END $$;

-- Update arbitrary store fields (whitelist)
CREATE OR REPLACE FUNCTION public.admin_update_store(_store_id uuid, _patch jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;

  UPDATE public.stores SET
    name          = COALESCE(_patch->>'name', name),
    slug          = COALESCE(_patch->>'slug', slug),
    description   = COALESCE(_patch->>'description', description),
    logo_url      = COALESCE(_patch->>'logo_url', logo_url),
    cover_url     = COALESCE(_patch->>'cover_url', cover_url),
    city          = COALESCE(_patch->>'city', city),
    phone         = COALESCE(_patch->>'phone', phone),
    theme_color   = COALESCE(_patch->>'theme_color', theme_color),
    category_id   = COALESCE(NULLIF(_patch->>'category_id','')::uuid, category_id),
    is_verified   = COALESCE((_patch->>'is_verified')::boolean, is_verified),
    is_active     = COALESCE((_patch->>'is_active')::boolean, is_active),
    commission_pct_override = COALESCE(NULLIF(_patch->>'commission_pct_override','')::numeric, commission_pct_override),
    admin_notes   = COALESCE(_patch->>'admin_notes', admin_notes),
    updated_at    = now()
  WHERE id = _store_id;

  INSERT INTO public.admin_actions(admin_id, action_type, target_type, target_id, metadata)
  VALUES (auth.uid(), 'update_store', 'store', _store_id, _patch);

  RETURN jsonb_build_object('ok', true);
END $$;

-- Set store-specific commission override (nullable)
CREATE OR REPLACE FUNCTION public.admin_set_store_commission(_store_id uuid, _pct numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;
  UPDATE public.stores SET commission_pct_override = _pct, updated_at = now() WHERE id = _store_id;
  INSERT INTO public.admin_actions(admin_id, action_type, target_type, target_id, metadata)
  VALUES (auth.uid(), 'set_store_commission', 'store', _store_id, jsonb_build_object('pct', _pct));
  RETURN jsonb_build_object('ok', true);
END $$;

-- Hard delete store (cascades handled by FK where set; otherwise items remain)
CREATE OR REPLACE FUNCTION public.admin_delete_store(_store_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;
  DELETE FROM public.stores WHERE id = _store_id;
  INSERT INTO public.admin_actions(admin_id, action_type, target_type, target_id)
  VALUES (auth.uid(), 'delete_store', 'store', _store_id);
  RETURN jsonb_build_object('ok', true);
END $$;

-- Create a store on behalf of a seller. Grants seller role if missing.
CREATE OR REPLACE FUNCTION public.admin_create_store_for_user(_owner_id uuid, _payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _store_id uuid; _slug text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;
  IF _payload->>'name' IS NULL THEN RAISE EXCEPTION 'NAME_REQUIRED'; END IF;

  _slug := COALESCE(_payload->>'slug',
    lower(regexp_replace(_payload->>'name', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(md5(random()::text),1,6));

  INSERT INTO public.user_roles(user_id, role) VALUES (_owner_id, 'seller'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.stores(
    owner_id, name, slug, description, logo_url, cover_url, city, phone,
    theme_color, category_id, is_verified, is_active, approval_status
  ) VALUES (
    _owner_id,
    _payload->>'name', _slug, _payload->>'description',
    _payload->>'logo_url', _payload->>'cover_url',
    _payload->>'city', _payload->>'phone',
    _payload->>'theme_color',
    NULLIF(_payload->>'category_id','')::uuid,
    COALESCE((_payload->>'is_verified')::boolean, false),
    true, 'approved'
  ) RETURNING id INTO _store_id;

  INSERT INTO public.admin_actions(admin_id, action_type, target_type, target_id, metadata)
  VALUES (auth.uid(), 'create_store_for_user', 'store', _store_id, jsonb_build_object('owner_id', _owner_id));

  INSERT INTO public.notifications(user_id, title, message, type, link)
  VALUES (_owner_id, '🏪 تم إنشاء متجرك',
    'قام المسؤول بإنشاء متجر باسمك: ' || (_payload->>'name'),
    'system'::notification_type, '/dashboard/seller');

  RETURN jsonb_build_object('ok', true, 'store_id', _store_id);
END $$;

-- Admin stats per store (fast dashboard read)
CREATE OR REPLACE FUNCTION public.admin_store_stats(_store_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'products_count', (SELECT count(*) FROM public.products WHERE store_id = _store_id),
    'active_products', (SELECT count(*) FROM public.products WHERE store_id = _store_id AND is_active = true),
    'orders_count', (SELECT count(DISTINCT oi.order_id) FROM public.order_items oi JOIN public.products p ON p.id=oi.product_id WHERE p.store_id = _store_id),
    'reports_count', (SELECT count(*) FROM public.store_reports WHERE store_id = _store_id),
    'followers_count', (SELECT count(*) FROM public.store_followers WHERE store_id = _store_id)
  );
$$;
