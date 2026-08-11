-- جدول إدارة تكاملات API
CREATE TABLE public.app_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL UNIQUE,
  category text NOT NULL,
  display_name text NOT NULL,
  description text,
  icon text,
  docs_url text,
  public_key text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  has_secret boolean NOT NULL DEFAULT false,
  secret_name text,
  enabled boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'inactive',
  last_tested_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_integrations ENABLE ROW LEVEL SECURITY;

-- المسؤول يدير كل شيء
CREATE POLICY "admin_full_app_integrations"
ON public.app_integrations FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- جميع المستخدمين يقرأون التكاملات المفعّلة فقط (للوصول للمفاتيح العامة)
CREATE POLICY "public_read_enabled_integrations"
ON public.app_integrations FOR SELECT TO anon, authenticated
USING (enabled = true);

CREATE TRIGGER set_app_integrations_updated_at
BEFORE UPDATE ON public.app_integrations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- البيانات الافتراضية
INSERT INTO public.app_integrations (provider, category, display_name, description, icon, docs_url, has_secret, secret_name) VALUES
('google_maps', 'maps', 'Google Maps', 'خرائط حية بصيغة Satellite/Hybrid مع التنقل والملاحة', '🗺️', 'https://console.cloud.google.com/apis/credentials', false, NULL),
('mapbox', 'maps', 'Mapbox', 'خرائط احترافية بديلة عن Google Maps', '🌍', 'https://account.mapbox.com/access-tokens/', false, NULL),
('openai', 'ai', 'OpenAI', 'نماذج GPT للذكاء الاصطناعي والمحادثة', '🤖', 'https://platform.openai.com/api-keys', true, 'OPENAI_API_KEY'),
('stripe', 'payments', 'Stripe', 'بوابة دفع عالمية بالبطاقات', '💳', 'https://dashboard.stripe.com/apikeys', true, 'STRIPE_SECRET_KEY'),
('twilio', 'messaging', 'Twilio SMS', 'إرسال رسائل SMS و OTP', '📱', 'https://console.twilio.com/', true, 'TWILIO_AUTH_TOKEN'),
('whatsapp', 'messaging', 'WhatsApp Business', 'دردشة وإشعارات عبر واتساب', '💬', 'https://developers.facebook.com/docs/whatsapp', true, 'WHATSAPP_TOKEN'),
('firebase', 'notifications', 'Firebase Cloud Messaging', 'إشعارات Push للأجهزة', '🔔', 'https://console.firebase.google.com/', true, 'FIREBASE_SERVER_KEY'),
('onesignal', 'notifications', 'OneSignal', 'بديل احترافي للإشعارات الفورية', '🔕', 'https://app.onesignal.com/', true, 'ONESIGNAL_REST_KEY'),
('agora', 'video', 'Agora.io', 'مكالمات فيديو وصوت عالية الجودة', '🎥', 'https://console.agora.io/', true, 'AGORA_APP_CERTIFICATE'),
('cloudinary', 'storage', 'Cloudinary', 'رفع وتحسين الصور والفيديو', '🖼️', 'https://cloudinary.com/console', true, 'CLOUDINARY_API_SECRET'),
('resend', 'email', 'Resend', 'إرسال إيميلات احترافية', '📧', 'https://resend.com/api-keys', true, 'RESEND_API_KEY'),
('sentry', 'monitoring', 'Sentry', 'مراقبة الأخطاء والأداء', '🐛', 'https://sentry.io/settings/account/api/auth-tokens/', false, NULL);