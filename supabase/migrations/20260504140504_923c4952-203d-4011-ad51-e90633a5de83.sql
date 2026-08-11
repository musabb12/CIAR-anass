CREATE TABLE IF NOT EXISTS public.support_call_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.admin_channels(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  mode text NOT NULL DEFAULT 'video',
  status text NOT NULL DEFAULT 'waiting',
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_call_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.support_call_sessions(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES public.admin_channels(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  signal_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.support_call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_call_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "channel parties read call sessions" ON public.support_call_sessions;
CREATE POLICY "channel parties read call sessions"
ON public.support_call_sessions
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.admin_channels c
    WHERE c.id = support_call_sessions.channel_id AND c.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "channel parties create call sessions" ON public.support_call_sessions;
CREATE POLICY "channel parties create call sessions"
ON public.support_call_sessions
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.admin_channels c
      WHERE c.id = support_call_sessions.channel_id AND c.user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "channel parties update call sessions" ON public.support_call_sessions;
CREATE POLICY "channel parties update call sessions"
ON public.support_call_sessions
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.admin_channels c
    WHERE c.id = support_call_sessions.channel_id AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.admin_channels c
    WHERE c.id = support_call_sessions.channel_id AND c.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "channel parties read call signals" ON public.support_call_signals;
CREATE POLICY "channel parties read call signals"
ON public.support_call_signals
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.admin_channels c
    WHERE c.id = support_call_signals.channel_id AND c.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "channel parties create call signals" ON public.support_call_signals;
CREATE POLICY "channel parties create call signals"
ON public.support_call_signals
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.admin_channels c
      WHERE c.id = support_call_signals.channel_id AND c.user_id = auth.uid()
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_support_call_sessions_channel ON public.support_call_sessions(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_call_signals_session ON public.support_call_signals(session_id, created_at ASC);

DROP TRIGGER IF EXISTS trg_support_call_sessions_updated_at ON public.support_call_sessions;
CREATE TRIGGER trg_support_call_sessions_updated_at
BEFORE UPDATE ON public.support_call_sessions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.support_call_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_call_signals;