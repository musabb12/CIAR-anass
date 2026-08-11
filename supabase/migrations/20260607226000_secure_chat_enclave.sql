-- تأسيس وتحصين غرف المراسلات الفورية ومنع انتحال الشخصية والتنصت الأفقي

-- 1. إنشاء جدول غرف المحادثات المرتبطة بالسياق اللوجستي للطلبات
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL,
    vendor_id UUID NOT NULL,
    pilot_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- تفعيل جدار الحماية على مستوى الصفوف لغرف المحادثة
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- سياسة المشاهدة: لا يرى الغرفة إلا أطرافها الشرعيين فقط
CREATE POLICY "Conversations isolation policy" ON public.conversations
    FOR SELECT USING (
        auth.uid() = customer_id OR 
        auth.uid() = vendor_id OR 
        auth.uid() = pilot_id OR 
        public.has_role(auth.uid(), 'admin')
    );


-- 2. إنشاء جدول الرسائل الفورية المحصن
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    message_text TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- تفعيل جدار الحماية على مستوى الصفوف للرسائل
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة المعزولة: كسر ثغرة التنصت الأفقي ومنع الـ WebSockets المشبوهة
CREATE POLICY "Messages isolation select policy" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = conversation_id AND (
                auth.uid() = c.customer_id OR 
                auth.uid() = c.vendor_id OR 
                auth.uid() = c.pilot_id
            )
        ) OR public.has_role(auth.uid(), 'admin')
    );

-- سياسة الإرسال الآمن: كسر ثغرة انتحال الشخصية (Sender Impersonation Bypass)
CREATE POLICY "Messages isolation insert policy" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND -- منع إرسال رسالة باسم مستخدم آخر نهائياً
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = conversation_id AND (
                auth.uid() = c.customer_id OR 
                auth.uid() = c.vendor_id OR 
                auth.uid() = c.pilot_id
            )
        )
    );
