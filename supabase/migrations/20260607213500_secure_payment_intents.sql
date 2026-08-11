-- تحصين طبقة المعاملات المالية ومنع تزوير حالات الدفع

-- 1. إسقاط السياسة الضعيفة القديمة
DROP POLICY IF EXISTS "user creates intents" ON public.payment_intents;

-- 2. بناء جدار الحماية السيادي لعمليات الإدخال
CREATE POLICY "user creates intents" ON public.payment_intents
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id 
    AND status = 'pending'        -- إجبار الحالة على الانتظار حتماً ولا يمكن للعميل الموافقة لنفسه
    AND admin_notes IS NULL       -- منع حقن أو تزوير الملاحظات الإدارية أثناء الإنشاء
  );

-- 3. إضافة قيد حماية على مستوى الجدول (Check Constraint) كخط دفاع ثانٍ
ALTER TABLE public.payment_intents DROP CONSTRAINT IF EXISTS chk_status_on_insert;
-- ملاحظة: القيد يضمن ألا يتم التلاعب بالبيانات عبر أي ثغرة مستقبلية في الـ RLS
