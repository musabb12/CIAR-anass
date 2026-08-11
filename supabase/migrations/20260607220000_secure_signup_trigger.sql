-- تطهير دالة إنشاء المستخدمين الجدد ومنع حقن الصلاحيات عبر الميتا-داتا

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
BEGIN
  -- 1. إدخال الحساب الشخصي الأساسي وتطهير المدخلات النصية
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name',''), 
    COALESCE(NEW.raw_user_meta_data->>'phone','')
  );

  -- 2. كسر ثغرة الحقن: إجبار الدور الجديد على 'customer' حتماً ومنع تجاوزه من العميل
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id, 
    'customer'::public.app_role
  );

  -- 3. تصفير محفظة العميل المالية عند نقطة الصفر بأمان
  INSERT INTO public.wallets (user_id, balance) 
  VALUES (
    NEW.id, 
    0
  );

  RETURN NEW;
END;
$$;
