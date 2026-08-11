-- تحصين قطاع التوظيف: أتمتة العدادات المترية وحظر تزوير النفوذ الرقمي للشركات

-- 1. دالة حماية وتجميد الحقول السيادية للوظائف لمنع التلاعب الخارجي
CREATE OR REPLACE FUNCTION public.enforce_job_integrity_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- كسر ثغرة خطف الهوية الإعلانية: منع تعديل المالك الأصلي للإعلان
  IF NEW.posted_by IS DISTINCT FROM OLD.posted_by THEN
    RAISE EXCEPTION 'خرق أمني: يحظر تعديل أو نقل ملكية الناشر الرئيسي للإعلان (posted_by)';
  END IF;

  -- كسر ثغرة تسميم المؤشرات: حظر تزوير العدادات من قبل واجهة العميل قسراً
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.applications_count := OLD.applications_count;
    NEW.views_count := OLD.views_count;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_job_system_fields ON public.jobs;
CREATE TRIGGER trg_protect_job_system_fields
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.enforce_job_integrity_fields();


-- 2. دالة الأتمتة الذرية لعداد المتقدمين بناءً على الحركات الفعلية للطلبات
CREATE OR REPLACE FUNCTION public.sync_job_applications_metric()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.jobs
    SET applications_count = applications_count + 1
    WHERE id = NEW.job_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.jobs
    SET applications_count = GREATEST(0, applications_count - 1)
    WHERE id = OLD.job_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_job_applications_metric ON public.job_applications;
CREATE TRIGGER trg_sync_job_applications_metric
  AFTER INSERT OR DELETE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.sync_job_applications_metric();


-- 3. دالة سيادية معزولة (RPC) لزيادة المشاهدات بأمان وبمقدار خطوة واحدة منيعة
CREATE OR REPLACE FUNCTION public.increment_job_view_counter(p_job_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.jobs
  SET views_count = views_count + 1
  WHERE id = p_job_id;
END;
$$;
