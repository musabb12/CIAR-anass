// Admin-only: validates a Stripe secret key by calling Stripe /v1/account,
// then saves it via SECURITY DEFINER RPC and activates the integration.
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: authErr } = await supabase.auth.getClaims(token);
    if (authErr || !claims?.claims?.sub) return json({ error: 'Unauthorized' }, 401);

    const userId = claims.claims.sub;
    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
    if (!isAdmin) return json({ error: 'FORBIDDEN' }, 403);

    const body = await req.json().catch(() => ({}));
    const { secret_key, publishable_key } = body ?? {};
    if (typeof secret_key !== 'string' || !/^r?sk_(test|live)_[A-Za-z0-9]+$/.test(secret_key)) {
      return json({ error: 'مفتاح Stripe غير صالح (يجب أن يبدأ بـ sk_test / sk_live / rk_test / rk_live)' }, 400);
    }

    // Validate against Stripe: GET /v1/account
    const stripeRes = await fetch('https://api.stripe.com/v1/account', {
      headers: { Authorization: `Bearer ${secret_key}` },
    });
    const account = await stripeRes.json();
    if (!stripeRes.ok) {
      return json({ error: `فشل التحقق: ${account?.error?.message ?? 'المفتاح مرفوض من Stripe'}` }, 400);
    }

    // Save secret via admin RPC (uses caller's JWT — server-side re-verifies role)
    const { error: saveErr } = await supabase.rpc('admin_save_integration_secret', {
      _provider: 'stripe',
      _value: secret_key,
    });
    if (saveErr) return json({ error: saveErr.message }, 500);

    // Activate app_integrations row
    const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    await service.from('app_integrations').upsert({
      provider: 'stripe',
      category: 'payments',
      display_name: 'Stripe — بوابة الدفع العالمية',
      description: 'دفع بالبطاقة (Visa, Mastercard, Amex) عبر Stripe',
      icon: '💳',
      docs_url: 'https://dashboard.stripe.com/apikeys',
      public_key: publishable_key || null,
      config: { mode: secret_key.includes('_test_') ? 'test' : 'live', account_id: account.id },
      has_secret: true,
      secret_name: 'STRIPE_SECRET_KEY',
      enabled: true,
      status: 'active',
      last_error: null,
      last_tested_at: new Date().toISOString(),
    }, { onConflict: 'provider' });

    return json({
      ok: true,
      account: {
        id: account.id,
        country: account.country,
        email: account.email,
        business_name: account.business_profile?.name ?? null,
        mode: secret_key.includes('_test_') ? 'test' : 'live',
      },
    });
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
