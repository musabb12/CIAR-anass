DROP TRIGGER IF EXISTS trg_bump_admin_channel ON public.admin_messages;
CREATE TRIGGER trg_bump_admin_channel
AFTER INSERT ON public.admin_messages
FOR EACH ROW EXECUTE FUNCTION public.bump_admin_channel();

DROP TRIGGER IF EXISTS trg_notify_admin_message ON public.admin_messages;
CREATE TRIGGER trg_notify_admin_message
AFTER INSERT ON public.admin_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_admin_message();

CREATE OR REPLACE FUNCTION public.admin_close_channel(_channel_id uuid, _status public.admin_channel_status)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _label text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;

  UPDATE public.admin_channels SET status = _status, updated_at = now() WHERE id = _channel_id;

  _label := CASE _status::text
    WHEN 'open' THEN 'أعاد المسؤول فتح المحادثة'
    WHEN 'in_progress' THEN 'بدأ المسؤول معالجة الطلب'
    WHEN 'resolved' THEN 'وضع المسؤول الطلب كتم حله'
    WHEN 'closed' THEN 'أغلق المسؤول الطلب أو رفضه'
    ELSE 'حدّث المسؤول حالة الطلب'
  END;

  INSERT INTO public.admin_messages(channel_id, sender_id, sender_role, body, is_system)
  VALUES (_channel_id, auth.uid(), 'admin', '🛡️ ' || _label, true);

  INSERT INTO public.admin_actions(admin_id, action_type, target_type, target_id, metadata)
  VALUES (auth.uid(), 'change_channel_status', 'channel', _channel_id, jsonb_build_object('status', _status));

  RETURN jsonb_build_object('ok', true);
END $function$;