CREATE OR REPLACE FUNCTION public.notify_admin_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _channel public.admin_channels%ROWTYPE;
  _admin uuid;
BEGIN
  SELECT * INTO _channel FROM public.admin_channels WHERE id = NEW.channel_id;
  IF _channel IS NULL THEN RETURN NEW; END IF;

  IF NEW.sender_role = 'admin' THEN
    INSERT INTO public.notifications(user_id, title, message, type, link)
    VALUES (
      _channel.user_id,
      '🛡️ رد جديد من المسؤول',
      COALESCE(LEFT(NEW.body, 120), '📎 مرفقات جديدة') || ' — ' || _channel.subject,
      'system'::notification_type,
      '/admin-contact'
    );
  ELSIF NEW.sender_role = 'user' THEN
    FOR _admin IN SELECT user_id FROM public.user_roles WHERE role = 'admin'::app_role LOOP
      INSERT INTO public.notifications(user_id, title, message, type, link)
      VALUES (
        _admin,
        '📨 رسالة دعم جديدة',
        COALESCE(LEFT(NEW.body, 120), '📎 مرفقات') || ' — ' || _channel.subject,
        'system'::notification_type,
        '/dashboard/admin'
      );
    END LOOP;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_admin_message ON public.admin_messages;
CREATE TRIGGER trg_notify_admin_message
AFTER INSERT ON public.admin_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_admin_message();

DROP TRIGGER IF EXISTS trg_bump_admin_channel ON public.admin_messages;
CREATE TRIGGER trg_bump_admin_channel
AFTER INSERT ON public.admin_messages
FOR EACH ROW EXECUTE FUNCTION public.bump_admin_channel();

DROP POLICY IF EXISTS "admin updates channels" ON public.admin_channels;
CREATE POLICY "admin updates channels"
ON public.admin_channels FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.mark_admin_channel_read(_channel_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF has_role(auth.uid(), 'admin'::app_role) THEN
    UPDATE public.admin_channels SET unread_for_admin = 0 WHERE id = _channel_id;
  ELSE
    UPDATE public.admin_channels SET unread_for_user = 0
    WHERE id = _channel_id AND user_id = auth.uid();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.user_close_channel(_channel_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _ch public.admin_channels%ROWTYPE;
BEGIN
  SELECT * INTO _ch FROM public.admin_channels WHERE id = _channel_id;
  IF _ch.user_id <> auth.uid() THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;
  UPDATE public.admin_channels SET status = 'resolved', updated_at = now() WHERE id = _channel_id;
  INSERT INTO public.admin_messages(channel_id, sender_id, sender_role, body, is_system)
  VALUES (_channel_id, auth.uid(), 'user', '✅ تم إغلاق التذكرة من قِبل المستخدم', true);
  RETURN jsonb_build_object('ok', true);
END $$;

DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_channels; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;