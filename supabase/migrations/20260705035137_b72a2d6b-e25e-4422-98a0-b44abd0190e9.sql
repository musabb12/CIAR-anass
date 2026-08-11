
-- Secure per-provider secret vault; only admins can write, only service_role can read
CREATE TABLE IF NOT EXISTS public.integration_secrets (
  provider text PRIMARY KEY,
  secret_value text NOT NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.integration_secrets TO service_role;
-- No grants for anon / authenticated: reads go through edge functions with service_role
ALTER TABLE public.integration_secrets ENABLE ROW LEVEL SECURITY;

-- Admin write via SECURITY DEFINER RPC (never expose value to client after save)
CREATE OR REPLACE FUNCTION public.admin_save_integration_secret(_provider text, _value text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;
  IF _value IS NULL OR length(_value) < 8 THEN
    RAISE EXCEPTION 'INVALID_SECRET';
  END IF;
  INSERT INTO public.integration_secrets(provider, secret_value, updated_by, updated_at)
  VALUES (_provider, _value, auth.uid(), now())
  ON CONFLICT (provider) DO UPDATE SET
    secret_value = EXCLUDED.secret_value,
    updated_by = EXCLUDED.updated_by,
    updated_at = now();
  INSERT INTO public.admin_actions(admin_id, action_type, target_type, target_id, metadata)
  VALUES (auth.uid(), 'save_integration_secret', 'integration', NULL, jsonb_build_object('provider', _provider));
  RETURN jsonb_build_object('ok', true);
END $$;

GRANT EXECUTE ON FUNCTION public.admin_save_integration_secret(text, text) TO authenticated;

-- Boolean check: does provider have a secret? (safe for clients)
CREATE OR REPLACE FUNCTION public.has_integration_secret(_provider text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.integration_secrets WHERE provider = _provider)
$$;

GRANT EXECUTE ON FUNCTION public.has_integration_secret(text) TO authenticated, anon;
