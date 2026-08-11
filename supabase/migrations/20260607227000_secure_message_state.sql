-- تحصين حالة الرسائل: حظر تعديل النصوص وتأمين حقل حالة القراءة (is_read)

CREATE OR REPLACE FUNCTION public.enforce_message_update_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_customer_id UUID;
    v_vendor_id UUID;
    v_pilot_id UUID;
BEGIN
    -- 1. كسر ثغرة التلاعب بالماضي: حظر تعديل نص الرسالة أو معرّف المحادثة أو المرسل نهائياً
    IF NEW.id IS DISTINCT FROM OLD.id OR
       NEW.conversation_id IS DISTINCT FROM OLD.conversation_id OR
       NEW.sender_id IS DISTINCT FROM OLD.sender_id OR
       NEW.message_text IS DISTINCT FROM OLD.message_text OR
       NEW.created_at IS DISTINCT FROM OLD.created_at THEN
        RAISE EXCEPTION 'خرق أمني: يحظر تعديل نص الرسالة أو بياناتها الأساسية بعد الإرسال (Immutable Message Payload)';
    END IF;

    -- 2. تأمين حقل حالة القراءة (is_read): التحقق من أن القائم بالتحديث هو مستلم الرسالة وليس مرسلها
    IF NEW.is_read IS DISTINCT FROM OLD.is_read THEN
        -- استخراج أطراف المحادثة للتحقق
        SELECT customer_id, vendor_id, pilot_id 
        INTO v_customer_id, v_vendor_id, v_pilot_id
        FROM public.conversations
        WHERE id = OLD.conversation_id;

        -- إذا كان القائم بالتعديل هو المرسل نفسه، يتم حظر العملية لمنع تزوير Receipts
        IF auth.uid() = OLD.sender_id THEN
            RAISE EXCEPTION 'عملية مرفوضة: لا يمكن لمرسل الرسالة تعديل حالة القراءة الخاصة بها';
        END IF;

        -- التحقق من أن القائم بالتعديل هو أحد الأطراف الشرعيين الأخرى في الغرفة
        IF auth.uid() NOT IN (v_customer_id, v_vendor_id, COALESCE(v_pilot_id, '00000000-0000-0000-0000-000000000000')) THEN
            RAISE EXCEPTION 'فشل الصلاحية: أنت لست طرفاً مستلماً في هذه المحادثة لتحديث حالة القراءة';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_message_update_integrity ON public.messages;
CREATE TRIGGER trg_enforce_message_update_integrity
    BEFORE UPDATE ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.enforce_message_update_integrity();

-- إضافة سياسة الـ RLS الخاصة بالتحديث للسماح للطرفين بالتعديل المقيد بالتريجر
CREATE POLICY "Messages update policy" ON public.messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = conversation_id AND (
                auth.uid() = c.customer_id OR 
                auth.uid() = c.vendor_id OR 
                auth.uid() = c.pilot_id
            )
        )
    );
