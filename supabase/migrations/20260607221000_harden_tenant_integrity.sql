-- تحصين الأعمدة السيادية للمتاجر والمنتجات ومنع التزوير المعياري من العميل

-- 1. دالة حماية أعمدة المتجر السيادية
CREATE OR REPLACE FUNCTION public.enforce_store_system_fields()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- إذا كان المستخدم ليس مديراً بالنظام، نمنع التلاعب بحقول النظام
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    -- في حالة الإنشاء: فرض القيم الافتراضية الآمنة رغماً عن Payload العميل
    IF TG_OP = 'INSERT' THEN
      NEW.is_verified := false;
      NEW.rating := 0;
      NEW.total_sales := 0;
    -- في حالة التحديث: تجميد القيم القديمة ومنع تعديلها
    ELSIF TG_OP = 'UPDATE' THEN
      NEW.is_verified := OLD.is_verified;
      NEW.rating := OLD.rating;
      NEW.total_sales := OLD.total_sales;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ربط تريجر الحماية بجدول المتاجر
DROP TRIGGER IF EXISTS trg_protect_store_system_fields ON public.stores;
CREATE TRIGGER trg_protect_store_system_fields
  BEFORE INSERT OR UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.enforce_store_system_fields();


-- 2. دالة حماية أعمدة المنتجات السيادية
CREATE OR REPLACE FUNCTION public.enforce_product_system_fields()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.rating := 0;
      NEW.reviews_count := 0;
      NEW.sales_count := 0;
      NEW.is_featured := false;
    ELSIF TG_OP = 'UPDATE' THEN
      NEW.rating := OLD.rating;
      NEW.reviews_count := OLD.reviews_count;
      NEW.sales_count := OLD.sales_count;
      NEW.is_featured := OLD.is_featured; -- حظر تفعيل ميزة الإعلان المجاني
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ربط تريجر الحماية بجدول المنتجات
DROP TRIGGER IF EXISTS trg_protect_product_system_fields ON public.products;
CREATE TRIGGER trg_protect_product_system_fields
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.enforce_product_system_fields();
