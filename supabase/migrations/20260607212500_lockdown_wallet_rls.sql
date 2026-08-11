-- التطهير النهائي لجدار الحماية وإغلاق منافذ واجهة العميل

-- 1. إسقاط السياسة التي تسمح للمستخدم أو العميل بالوصول المباشر للجدول
DROP POLICY IF EXISTS "user manages own wallet security" ON public.wallet_security;

-- 2. التأكيد على تفعيل الـ RLS بدون وجود أي سياسات (Default Deny All)
ALTER TABLE public.wallet_security ENABLE ROW LEVEL SECURITY;

-- مذكرات أمنية للمطورين مستقبلاً:
-- الجدول الآن محمي بالكامل من أي استعلام مباشر عبر الـ API (Anon/Authenticated).
-- الوصول يتم حصرياً عبر الدوال المحمية public.verify_wallet_pin و public.set_wallet_pin.
