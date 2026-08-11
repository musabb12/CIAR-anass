// Generic real-provider verification + one-click activation for all integrations.
// Admin submits secret(s) → we call the real provider API → on success we save
// the secret via admin_save_integration_secret and flip the integration to active.
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type VerifyResult = {
  ok: boolean;
  mode?: 'test' | 'live';
  account_id?: string;
  label?: string;
  extra?: Record<string, unknown>;
  error?: string;
};

// ---------- Provider verifiers ----------
async function verifyStripe(secret: string): Promise<VerifyResult> {
  if (!/^r?sk_(test|live)_[A-Za-z0-9]+$/.test(secret))
    return { ok: false, error: 'الصيغة غير صحيحة (sk_/rk_ test|live)' };
  const r = await fetch('https://api.stripe.com/v1/account', {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const j = await r.json();
  if (!r.ok) return { ok: false, error: j?.error?.message ?? 'مرفوض من Stripe' };
  return {
    ok: true,
    mode: secret.includes('_test_') ? 'test' : 'live',
    account_id: j.id,
    label: j.business_profile?.name || j.email || j.id,
    extra: { country: j.country, email: j.email },
  };
}

async function verifyOpenAI(secret: string): Promise<VerifyResult> {
  if (!secret.startsWith('sk-')) return { ok: false, error: 'يجب أن يبدأ بـ sk-' };
  const r = await fetch('https://api.openai.com/v1/models', {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const j = await r.json();
  if (!r.ok) return { ok: false, error: j?.error?.message ?? 'مرفوض من OpenAI' };
  return { ok: true, mode: 'live', label: `${(j.data ?? []).length} model`, extra: { models: (j.data ?? []).length } };
}

async function verifyGoogleMaps(secret: string): Promise<VerifyResult> {
  const r = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=Sanaa&key=${encodeURIComponent(secret)}`,
  );
  const j = await r.json();
  if (j.status === 'REQUEST_DENIED') return { ok: false, error: j.error_message || 'مفتاح Google Maps مرفوض' };
  return { ok: true, mode: 'live', label: 'Google Maps API', extra: { status: j.status } };
}

async function verifyMapbox(secret: string): Promise<VerifyResult> {
  const r = await fetch(`https://api.mapbox.com/tokens/v2?access_token=${encodeURIComponent(secret)}`);
  const j = await r.json();
  if (!r.ok) return { ok: false, error: j?.message ?? 'مرفوض من Mapbox' };
  return { ok: true, mode: 'live', label: 'Mapbox Token', extra: { tokens: Array.isArray(j) ? j.length : 1 } };
}

async function verifyResend(secret: string): Promise<VerifyResult> {
  if (!secret.startsWith('re_')) return { ok: false, error: 'يجب أن يبدأ بـ re_' };
  const r = await fetch('https://api.resend.com/domains', { headers: { Authorization: `Bearer ${secret}` } });
  const j = await r.json();
  if (!r.ok) return { ok: false, error: j?.message ?? 'مرفوض من Resend' };
  return { ok: true, mode: 'live', label: 'Resend', extra: { domains: (j.data ?? []).length } };
}

async function verifySentry(secret: string): Promise<VerifyResult> {
  const r = await fetch('https://sentry.io/api/0/', { headers: { Authorization: `Bearer ${secret}` } });
  if (!r.ok) return { ok: false, error: `Sentry ${r.status}` };
  await r.text();
  return { ok: true, mode: 'live', label: 'Sentry API' };
}

async function verifyTwilio(secret: string, extras: Record<string, string>): Promise<VerifyResult> {
  const sid = extras.account_sid;
  if (!sid) return { ok: false, error: 'أضف account_sid في الإعدادات' };
  const auth = btoa(`${sid}:${secret}`);
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  const j = await r.json();
  if (!r.ok) return { ok: false, error: j?.message ?? 'مرفوض من Twilio' };
  return { ok: true, mode: 'live', account_id: sid, label: j.friendly_name };
}

async function verifyOneSignal(secret: string, extras: Record<string, string>): Promise<VerifyResult> {
  const appId = extras.app_id;
  const r = await fetch('https://onesignal.com/api/v1/apps', {
    headers: { Authorization: `Basic ${secret}` },
  });
  const j = await r.json();
  if (!r.ok) return { ok: false, error: j?.errors?.[0] ?? 'مرفوض من OneSignal' };
  return { ok: true, mode: 'live', account_id: appId, label: `${Array.isArray(j) ? j.length : 0} apps` };
}

async function verifyCloudinary(secret: string, extras: Record<string, string>): Promise<VerifyResult> {
  const cloud = extras.cloud_name, key = extras.api_key;
  if (!cloud || !key) return { ok: false, error: 'أضف cloud_name و api_key' };
  const auth = btoa(`${key}:${secret}`);
  const r = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/ping`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  const j = await r.json();
  if (!r.ok) return { ok: false, error: j?.error?.message ?? 'مرفوض من Cloudinary' };
  return { ok: true, mode: 'live', account_id: cloud, label: `Cloud: ${cloud}` };
}

async function verifyWhatsApp(secret: string): Promise<VerifyResult> {
  const r = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${encodeURIComponent(secret)}`);
  const j = await r.json();
  if (!r.ok || j.error) return { ok: false, error: j?.error?.message ?? 'مرفوض من Meta' };
  return { ok: true, mode: 'live', account_id: j.id, label: j.name };
}

async function verifyFirebase(secret: string): Promise<VerifyResult> {
  // FCM legacy server key: send a dry_run to invalid token → expect InvalidRegistration (200)
  const r = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: { Authorization: `key=${secret}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: 'test', dry_run: true }),
  });
  const j = await r.json();
  if (r.status === 401) return { ok: false, error: 'مفتاح FCM غير صالح' };
  return { ok: true, mode: 'live', label: 'Firebase FCM', extra: j };
}

async function verifyAgora(secret: string, extras: Record<string, string>): Promise<VerifyResult> {
  const appId = extras.app_id;
  if (!appId) return { ok: false, error: 'أضف app_id في الإعدادات' };
  // No free ping endpoint — validate format only
  if (secret.length < 20) return { ok: false, error: 'App Certificate قصير جداً' };
  return { ok: true, mode: 'live', account_id: appId, label: `Agora App: ${appId.slice(0, 8)}…` };
}

const VERIFIERS: Record<string, (s: string, extras: Record<string, string>) => Promise<VerifyResult>> = {
  stripe: verifyStripe,
  openai: verifyOpenAI,
  google_maps: verifyGoogleMaps,
  mapbox: verifyMapbox,
  resend: verifyResend,
  sentry: verifySentry,
  twilio: verifyTwilio,
  onesignal: verifyOneSignal,
  cloudinary: verifyCloudinary,
  whatsapp: verifyWhatsApp,
  firebase: verifyFirebase,
  agora: verifyAgora,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claims } = await supabase.auth.getClaims(token);
    const userId = claims?.claims?.sub;
    if (!userId) return json({ error: 'Unauthorized' }, 401);
    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
    if (!isAdmin) return json({ error: 'FORBIDDEN' }, 403);

    const body = await req.json().catch(() => ({}));
    const { provider, secret_key, publishable_key, config_extras } = body ?? {};
    if (typeof provider !== 'string' || !VERIFIERS[provider])
      return json({ error: `المزوّد "${provider}" غير مدعوم للتحقق التلقائي بعد` }, 400);
    if (typeof secret_key !== 'string' || secret_key.length < 8)
      return json({ error: 'المفتاح قصير جداً' }, 400);

    const extras = (config_extras && typeof config_extras === 'object') ? config_extras : {};
    const result = await VERIFIERS[provider](secret_key.trim(), extras);
    if (!result.ok) return json({ ok: false, error: result.error ?? 'فشل التحقق' }, 400);

    // Save secret (JSON if extras present, so edge functions can read both)
    const savedValue = Object.keys(extras).length
      ? JSON.stringify({ secret: secret_key.trim(), ...extras })
      : secret_key.trim();

    const { error: saveErr } = await supabase.rpc('admin_save_integration_secret', {
      _provider: provider,
      _value: savedValue,
    });
    if (saveErr) return json({ error: saveErr.message }, 500);

    // Activate + store account summary in config
    const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const configPatch = {
      mode: result.mode ?? 'live',
      account_id: result.account_id ?? null,
      account_label: result.label ?? null,
      verified_at: new Date().toISOString(),
      ...extras,
      ...(result.extra ?? {}),
    };
    await service.from('app_integrations').update({
      public_key: publishable_key || null,
      config: configPatch,
      has_secret: true,
      enabled: true,
      status: 'active',
      last_error: null,
      last_tested_at: new Date().toISOString(),
    }).eq('provider', provider);

    return json({ ok: true, provider, account: configPatch });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
