-- تحصين النظام المالي: منع ثغرات التزامن والخصم المزدوج وقفل المحافظ السيادي

-- 1. إضافة قيد صارم على مستوى جدول المحفظة لمنع الرصيد السالب نهائياً كخط دفاع أخير
ALTER TABLE public.wallets 
ADD CONSTRAINT chk_wallet_balance_non_negative CHECK (balance >= 0);


-- 2. الدالة السيادية الموحدة لمعالجة المعاملات المالية وقفل الأسطر تزامناً
CREATE OR REPLACE FUNCTION public.execute_wallet_transaction(
  p_user_id UUID,
  p_type public.transaction_type,
  p_amount NUMERIC(14,2),
  p_reference TEXT,
  p_description TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id UUID;
  v_current_balance NUMERIC(14,2);
  v_transaction_id UUID;
BEGIN
  -- أمان المدخلات: التحقق من أن القيمة المالية أكبر من الصفر
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'فشل المعاملة: يجب أن تكون القيمة المالية أكبر من الصفر';
  END IF;

  -- التكتيك الحرج: حجز وقفل سطر المحفظة فوراً لمنع أي عمليات متزامنة (Time-of-Check to Time-of-Use Lock)
  SELECT id, balance INTO v_wallet_id, v_current_balance
  FROM public.wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'فشل المعاملة: لم يتم العثور على محفظة نشطة للمستخدم المحدد';
  END IF;

  -- منطق الفحص الحسابي للعمليات
  IF p_type = 'withdrawal' OR p_type = 'payment' THEN
    -- التحقق من كفاية الرصيد قبل الخصم
    IF v_current_balance < p_amount THEN
      RAISE EXCEPTION 'فشل المعاملة: رصيد المحفظة غير كافٍ لإتمام هذه العملية. الرصيد الحالي: % YER', v_current_balance;
    END IF;

    -- خصم القيمة وتحديث المحفظة المحجوزة
    UPDATE public.wallets
    SET balance = balance - p_amount,
        updated_at = now()
    WHERE id = v_wallet_id;

  ELSIF p_type = 'deposit' OR p_type = 'refund' THEN
    -- إضافة القيمة وتحديث المحفظة المحجوزة
    UPDATE public.wallets
    SET balance = balance + p_amount,
        updated_at = now()
    WHERE id = v_wallet_id;
  
  ELSE
    RAISE EXCEPTION 'فشل المعاملة: نوع العملية المالية غير مدرج أو غير مدعوم في النظام';
  END IF;

  -- تسجيل العملية المالية في دفتر الأستاذ غير القابل للتزوير بحالة مكتملة فوراً
  INSERT INTO public.transactions (
    wallet_id,
    user_id,
    type,
    amount,
    status,
    reference,
    description,
    created_at
  ) VALUES (
    v_wallet_id,
    p_user_id,
    p_type,
    p_amount,
    'completed',
    p_reference,
    p_description,
    now()
  ) RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$;
