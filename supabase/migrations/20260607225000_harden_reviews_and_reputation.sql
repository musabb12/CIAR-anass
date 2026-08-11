-- تحصين السمعة التجارية: فرض مراجعات مشروطة بالشراء الفعلي وتجميد الهويات

CREATE OR REPLACE FUNCTION public.enforce_review_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_purchased BOOLEAN;
BEGIN
  -- 1. كسر ثغرة خطف المراجعات: تجميد معلمات التقييم عند التحديث
  IF TG_OP = 'UPDATE' THEN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.product_id IS DISTINCT FROM OLD.product_id THEN
      RAISE EXCEPTION 'عملية مرفوضة: يحظر نقل المراجعة إلى منتج آخر أو تزوير هوية كاتبها';
    END IF;
  END IF;

  -- 2. كسر ثغرة الحسابات الوهمية: التحقق من الفاتورة والاستلام الفعلي (Verified Purchase Lock)
  IF TG_OP = 'INSERT' THEN
    SELECT EXISTS (
      SELECT 1 
      FROM public.orders o
      JOIN public.order_items oi ON o.id = oi.order_id
      WHERE o.customer_id = NEW.user_id 
        AND oi.product_id = NEW.product_id 
        AND o.status = 'delivered'
    ) INTO v_has_purchased;

    IF NOT v_has_purchased THEN
      RAISE EXCEPTION 'فشل أمني: لا يمكنك تقييم هذا المنتج إلا بعد إتمام عملية شرائه واستلامه شحنياً (Verified Purchase Required)';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_review_integrity ON public.reviews;
CREATE TRIGGER trg_enforce_review_integrity
  BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.enforce_review_integrity();
