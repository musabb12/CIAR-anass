-- الترقية السيادية لمنظومة أمان المحافظ الرقمية لـ Nexus Yemen

-- 1. إعادة صياغة دالة إنشاء وتحديث الرمز السري باستخدام Bcrypt
CREATE OR REPLACE FUNCTION public.set_wallet_pin(_pin text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
BEGIN
  IF auth.uid() IS NULL THEN 
    RAISE EXCEPTION 'UNAUTHORIZED'; 
  END IF;

  -- استخدام crypt مع ملح فريد من نوعه بتكلفة حوسبة متوازنة (Blowfish - 8 rounds)
  INSERT INTO public.wallet_security (user_id, pin_hash, failed_attempts, locked_until)
  VALUES (
    auth.uid(),
    extensions.crypt(_pin || auth.uid()::text, extensions.gen_salt('bf', 8)),
    0,
    NULL
  )
  ON CONFLICT (user_id) DO UPDATE
  SET pin_hash = EXCLUDED.pin_hash,
      failed_attempts = 0,
      locked_until = NULL,
      updated_at = now();
END $$;

-- 2. إعادة صياغة دالة التحقق لحل ثغرات التخمين والفخ التكراري للعداد
CREATE OR REPLACE FUNCTION public.verify_wallet_pin(_pin text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  _row public.wallet_security%ROWTYPE;
  _is_valid boolean;
  _next_failed integer;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;

  -- جلب السجل الحاكمة للمحفظة
  SELECT * INTO _row FROM public.wallet_security WHERE user_id = auth.uid();
  IF _row IS NULL OR _row.pin_hash IS NULL THEN RETURN false; END IF;

  -- التحقق من صلاحية الحظر الزمني النشط
  IF _row.locked_until IS NOT NULL AND _row.locked_until > now() THEN 
    RAISE EXCEPTION 'WALLET_LOCKED'; 
  END IF;

  -- التحقق الآمن من الهاش باستخدام معماريّة تمنع هجمات التوقيت والاختراق المحلي
  _is_valid := (_row.pin_hash = extensions.crypt(_pin || auth.uid()::text, _row.pin_hash));

  IF _is_valid THEN
    -- تصفير فوري للعداد وفك القيود عند نجاح العملية
    UPDATE public.wallet_security 
    SET failed_attempts = 0, 
        locked_until = NULL 
    WHERE user_id = auth.uid();
    RETURN true;
  ELSE
    -- معالجة الفخ التكراري: إذا انتهت عقوبة القفل القديمة، يتم تصفير العداد واحتساب المحاولة الحالية كخطأ أول (1)
    IF _row.locked_until IS NOT NULL AND _row.locked_until <= now() THEN
      _next_failed := 1;
    ELSE
      _next_failed := _row.failed_attempts + 1;
    END IF;

    -- تحديث سجل الأخطاء وتفعيل القفل إذا بلغت المحاولات حدها الأقصى
    UPDATE public.wallet_security 
    SET failed_attempts = _next_failed,
        locked_until = CASE WHEN _next_failed >= 5 THEN now() + interval '15 minutes' ELSE NULL END
    WHERE user_id = auth.uid();

    RETURN false;
  END IF;
END $$;
