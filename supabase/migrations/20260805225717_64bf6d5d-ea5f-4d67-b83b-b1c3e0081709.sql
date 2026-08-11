CREATE OR REPLACE FUNCTION public.admin_delete_channel(_channel_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  DELETE FROM public.admin_messages WHERE channel_id = _channel_id;
  DELETE FROM public.admin_channels WHERE id = _channel_id;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_channels_bulk(_ids uuid[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  DELETE FROM public.admin_messages WHERE channel_id = ANY(_ids);
  DELETE FROM public.admin_channels WHERE id = ANY(_ids);
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_channel(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_channels_bulk(uuid[]) TO authenticated;