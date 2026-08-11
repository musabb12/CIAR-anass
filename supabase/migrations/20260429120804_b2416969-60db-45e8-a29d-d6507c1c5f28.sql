-- =====================================================
-- 1) STORE APPROVAL SYSTEM
-- =====================================================
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_reason text;

-- Set existing stores to approved (so we don't break current data)
UPDATE public.stores SET approval_status = 'approved' WHERE approval_status = 'pending';

-- Replace the public read policy to filter only approved + non-suspended stores
DROP POLICY IF EXISTS "Stores public" ON public.stores;
CREATE POLICY "Stores public read approved"
  ON public.stores FOR SELECT
  USING (
    (approval_status = 'approved' AND suspended = false)
    OR auth.uid() = owner_id
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- Admin can update any store (approve/reject/suspend)
CREATE POLICY "Admin manages all stores"
  ON public.stores FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Also restrict products visibility to approved stores
DROP POLICY IF EXISTS "Products public" ON public.products;
CREATE POLICY "Products public approved stores"
  ON public.products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = products.store_id
        AND s.approval_status = 'approved'
        AND s.suspended = false
    )
    OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = products.store_id AND s.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- =====================================================
-- 2) ADMIN COMMUNICATION CHANNELS
-- =====================================================
DO $$ BEGIN
  CREATE TYPE public.admin_channel_kind AS ENUM ('support','ticket','complaint','report','contact','help');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.admin_channel_status AS ENUM ('open','in_progress','resolved','closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.admin_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind public.admin_channel_kind NOT NULL,
  subject text NOT NULL,
  status public.admin_channel_status NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'normal',
  assigned_admin uuid,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  unread_for_user int NOT NULL DEFAULT 0,
  unread_for_admin int NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user creates own channel"
  ON public.admin_channels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user reads own channels"
  ON public.admin_channels FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "admin updates channels"
  ON public.admin_channels FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_admin_channels_user ON public.admin_channels(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_channels_kind ON public.admin_channels(kind, status);

-- Messages
CREATE TABLE IF NOT EXISTS public.admin_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.admin_channels(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL DEFAULT 'user', -- 'user' or 'admin'
  body text,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{url, kind, name, size}]
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "channel parties read messages"
  ON public.admin_messages FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (SELECT 1 FROM public.admin_channels c WHERE c.id = admin_messages.channel_id AND c.user_id = auth.uid())
  );

CREATE POLICY "channel parties send messages"
  ON public.admin_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR EXISTS (SELECT 1 FROM public.admin_channels c WHERE c.id = admin_messages.channel_id AND c.user_id = auth.uid())
    )
  );

CREATE INDEX IF NOT EXISTS idx_admin_messages_channel ON public.admin_messages(channel_id, created_at);

-- Trigger: bump last_message_at + unread counters
CREATE OR REPLACE FUNCTION public.bump_admin_channel()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.admin_channels SET
    last_message_at = now(),
    updated_at = now(),
    unread_for_user = CASE WHEN NEW.sender_role = 'admin' THEN unread_for_user + 1 ELSE unread_for_user END,
    unread_for_admin = CASE WHEN NEW.sender_role = 'user' THEN unread_for_admin + 1 ELSE unread_for_admin END
  WHERE id = NEW.channel_id;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_bump_admin_channel ON public.admin_messages;
CREATE TRIGGER trg_bump_admin_channel
  AFTER INSERT ON public.admin_messages
  FOR EACH ROW EXECUTE FUNCTION public.bump_admin_channel();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_channels;

-- =====================================================
-- 3) ADMIN ACTIONS LOG
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action_type text NOT NULL, -- 'approve_store','reject_store','suspend_store','ban_user','unban_user','adjust_wallet','close_ticket', etc.
  target_type text NOT NULL, -- 'store','user','wallet','ticket','channel','order'
  target_id uuid NOT NULL,
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin writes actions"
  ON public.admin_actions FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) AND auth.uid() = admin_id);

CREATE POLICY "admin reads actions"
  ON public.admin_actions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON public.admin_actions(target_type, target_id);

-- =====================================================
-- 4) USER BANS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  banned_by uuid NOT NULL,
  reason text NOT NULL,
  banned_until timestamptz, -- null = permanent
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin manages bans"
  ON public.user_bans FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "user sees own ban"
  ON public.user_bans FOR SELECT
  USING (auth.uid() = user_id);

-- =====================================================
-- 5) STORAGE BUCKET FOR EVIDENCE/ATTACHMENTS
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('support-evidence', 'support-evidence', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "evidence public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'support-evidence');

CREATE POLICY "user uploads own evidence"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'support-evidence' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "user deletes own evidence"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'support-evidence' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =====================================================
-- 6) ADMIN HELPER FUNCTIONS
-- =====================================================
CREATE OR REPLACE FUNCTION public.admin_approve_store(_store_id uuid, _approve boolean, _reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _owner uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;

  UPDATE public.stores SET
    approval_status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    rejection_reason = CASE WHEN _approve THEN NULL ELSE _reason END,
    updated_at = now()
  WHERE id = _store_id
  RETURNING owner_id INTO _owner;

  INSERT INTO public.admin_actions(admin_id, action_type, target_type, target_id, reason)
  VALUES (auth.uid(), CASE WHEN _approve THEN 'approve_store' ELSE 'reject_store' END, 'store', _store_id, _reason);

  -- Notify owner
  IF _owner IS NOT NULL THEN
    INSERT INTO public.notifications(user_id, title, message, type)
    VALUES (
      _owner,
      CASE WHEN _approve THEN '✅ تم اعتماد متجرك' ELSE '⚠️ تم رفض متجرك' END,
      CASE WHEN _approve THEN 'متجرك أصبح الآن م€اً للعملاء وجاهزاً للبيع.' ELSE COALESCE('السبب: ' || _reason, 'يرجى مراجعة بيانات المتجر وإعادة التقديم.') END,
      'system'::notification_type
    );
  END IF;

  RETURN jsonb_build_object('ok', true, 'approved', _approve);
END $$;

CREATE OR REPLACE FUNCTION public.admin_adjust_wallet(_user_id uuid, _amount numeric, _reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _tx uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;

  _tx := public.wallet_transact(
    _user_id, abs(_amount),
    CASE WHEN _amount >= 0 THEN 'credit' ELSE 'debit' END,
    'تعديل من المسؤول: ' || _reason, NULL
  );

  INSERT INTO public.admin_actions(admin_id, action_type, target_type, target_id, reason, metadata)
  VALUES (auth.uid(), 'adjust_wallet', 'wallet', _user_id, _reason, jsonb_build_object('amount', _amount, 'tx', _tx));

  INSERT INTO public.notifications(user_id, title, message, type)
  VALUES (_user_id, '💰 تعديل في المحفظة',
    CASE WHEN _amount >= 0 THEN 'أُضيف لمحفظتك ' ELSE 'خُصم من محفظتك ' END
    || abs(_amount)::text || ' € - ' || _reason,
    'wallet'::notification_type);

  RETURN jsonb_build_object('ok', true, 'tx', _tx);
END $$;

CREATE OR REPLACE FUNCTION public.admin_ban_user(_user_id uuid, _reason text, _until timestamptz DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;

  INSERT INTO public.user_bans(user_id, banned_by, reason, banned_until, is_active)
  VALUES (_user_id, auth.uid(), _reason, _until, true)
  ON CONFLICT (user_id) DO UPDATE SET
    banned_by = EXCLUDED.banned_by,
    reason = EXCLUDED.reason,
    banned_until = EXCLUDED.banned_until,
    is_active = true;

  INSERT INTO public.admin_actions(admin_id, action_type, target_type, target_id, reason)
  VALUES (auth.uid(), 'ban_user', 'user', _user_id, _reason);

  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.admin_close_channel(_channel_id uuid, _status public.admin_channel_status)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;
  UPDATE public.admin_channels SET status = _status, updated_at = now() WHERE id = _channel_id;
  INSERT INTO public.admin_actions(admin_id, action_type, target_type, target_id, metadata)
  VALUES (auth.uid(), 'change_channel_status', 'channel', _channel_id, jsonb_build_object('status', _status));
  RETURN jsonb_build_object('ok', true);
END $$;
