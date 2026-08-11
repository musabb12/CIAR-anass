
-- profiles enhancements
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'ar',
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

-- admin_messages: soft delete
ALTER TABLE public.admin_messages
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid;

-- Allow sender or admin to soft-delete via UPDATE
DROP POLICY IF EXISTS "sender or admin updates message" ON public.admin_messages;
CREATE POLICY "sender or admin updates message"
ON public.admin_messages
FOR UPDATE
USING (auth.uid() = sender_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admin to view all profiles (already public-read, fine)

-- Admin change role
CREATE OR REPLACE FUNCTION public.admin_set_user_role(_user_id uuid, _role app_role, _add boolean)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;
  IF _add THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (_user_id, _role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    DELETE FROM public.user_roles WHERE user_id = _user_id AND role = _role;
  END IF;
  INSERT INTO public.admin_actions(admin_id, action_type, target_type, target_id, metadata)
  VALUES (auth.uid(), CASE WHEN _add THEN 'grant_role' ELSE 'revoke_role' END, 'user', _user_id, jsonb_build_object('role', _role));
  RETURN jsonb_build_object('ok', true);
END $$;

-- Admin archive user
CREATE OR REPLACE FUNCTION public.admin_archive_user(_user_id uuid, _archive boolean)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;
  UPDATE public.profiles SET is_archived = _archive, archived_at = CASE WHEN _archive THEN now() ELSE NULL END WHERE id = _user_id;
  INSERT INTO public.admin_actions(admin_id, action_type, target_type, target_id)
  VALUES (auth.uid(), CASE WHEN _archive THEN 'archive_user' ELSE 'unarchive_user' END, 'user', _user_id);
  RETURN jsonb_build_object('ok', true);
END $$;

-- Admin unban
CREATE OR REPLACE FUNCTION public.admin_unban_user(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;
  UPDATE public.user_bans SET is_active = false WHERE user_id = _user_id;
  INSERT INTO public.admin_actions(admin_id, action_type, target_type, target_id)
  VALUES (auth.uid(), 'unban_user', 'user', _user_id);
  RETURN jsonb_build_object('ok', true);
END $$;

-- Delete message (soft)
CREATE OR REPLACE FUNCTION public.delete_admin_message(_message_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _m public.admin_messages%ROWTYPE;
BEGIN
  SELECT * INTO _m FROM public.admin_messages WHERE id = _message_id;
  IF _m IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF _m.sender_id <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;
  UPDATE public.admin_messages
    SET body = NULL, attachments = '[]'::jsonb, deleted_at = now(), deleted_by = auth.uid()
    WHERE id = _message_id;
  RETURN jsonb_build_object('ok', true);
END $$;
