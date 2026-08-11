-- حصن الأمان المالي: فرض النزاهة السعرية وإدارة الحالات الحرج لجدول الطلبات

-- 1. دالة معالجة وحساب أسعار عناصر الطلب وتدقيق المخزون (قبل الإدخال)
CREATE OR REPLACE FUNCTION public.process_order_item_genesis()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_real_price NUMERIC(12,2);
  v_discount_price NUMERIC(12,2);
  v_current_stock INT;
  v_product_name TEXT;
  v_final_unit_price NUMERIC(12,2);
BEGIN
  -- جلب بيانات المنتج الحقيقية والمحمية من جدول المنتجات
  SELECT name, price, discount_price, stock 
  INTO v_product_name, v_real_price, v_discount_price, v_current_stock
  FROM public.products 
  WHERE id = NEW.product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'العملية مرفوضة: المنتج المحدد غير موجود في قاعدة البيانات';
  END IF;

  -- التحقق الصارم من كفاية المخزون
  IF v_current_stock < NEW.quantity THEN
    RAISE EXCEPTION 'فشل إتمام الطلب: المخزون الحالي من [%] غير كافٍ. المتوفر: %', v_product_name, v_current_stock;
  END IF;

  -- كسر ثغرة تزوير الأسعار: تحديد السعر الفعلي بناءً على وجود تخفيض أم لا
  v_final_unit_price := COALESCE(v_discount_price, v_real_price);
  
  -- حقن البيانات الصحيحة رغماً عن Payload العميل
  NEW.product_name := v_product_name;
  NEW.unit_price   := v_final_unit_price;
  NEW.subtotal     := v_final_unit_price * NEW.quantity;

  -- استنزاف المخزون تزامناً مع العملية بأمان
  UPDATE public.products 
  SET stock = stock - NEW.quantity 
  WHERE id = NEW.product_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_item_genesis ON public.order_items;
CREATE TRIGGER trg_order_item_genesis
  BEFORE INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.process_order_item_genesis();


-- 2. دالة التحديث التلقائي والمستمر لإجمالي الطلب الأم (بعد التغيير في العناصر)
CREATE OR REPLACE FUNCTION public.sync_order_totals()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_order_id UUID;
  v_new_subtotal NUMERIC(12,2);
BEGIN
  v_target_order_id := COALESCE(NEW.order_id, OLD.order_id);

  -- حساب المجموع الفعلي الحقيقي من عناصر الطلب المحمية
  SELECT COALESCE(SUM(subtotal), 0) 
  INTO v_new_subtotal
  FROM public.order_items 
  WHERE order_id = v_target_order_id;

  -- تحديث الطلب الأب خلفياً وحساب المجموع الكلي مع رسوم الشحن الثابتة في النظام
  UPDATE public.orders 
  SET 
    subtotal = v_new_subtotal,
    total = v_new_subtotal + shipping_fee
  WHERE id = v_target_order_id;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_order_totals ON public.order_items;
CREATE TRIGGER trg_sync_order_totals
  AFTER INSERT OR UPDATE OR DELETE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.sync_order_totals();


-- 3. دالة حظر تعديل معلمات الحسابات وفرض آلة الحالات الصارمة للطلب
CREATE OR REPLACE FUNCTION public.enforce_order_state_machine()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- إذا كان المنفذ مديراً للنظام، يتم تمرير العملية بالكامل
  IF public.has_role(auth.uid(), 'admin') THEN
    -- معالجة إعادة المخزون إذا قام الآدمن بإلغاء الطلب
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
      UPDATE public.products p
      SET stock = p.stock + oi.quantity
      FROM public.order_items oi
      WHERE oi.order_id = NEW.id AND p.id = oi.product_id;
    END IF;
    RETURN NEW;
  END IF;

  -- فحص محاولات المستخدم (العميل صاحب الطلب)
  IF auth.uid() = OLD.customer_id THEN
    -- منعه تماماً من تغيير أي قيم مالية أو معلمات بنيوية للطلب
    IF NEW.subtotal IS DISTINCT FROM OLD.subtotal OR 
       NEW.shipping_fee IS DISTINCT FROM OLD.shipping_fee OR 
       NEW.total IS DISTINCT FROM OLD.total OR 
       NEW.payment_status IS DISTINCT FROM OLD.payment_status OR 
       NEW.customer_id IS DISTINCT FROM OLD.customer_id OR 
       NEW.pilot_id IS DISTINCT FROM OLD.pilot_id THEN
      RAISE EXCEPTION 'محاولة غير مصرح بها: لا تملك الصلاحية لتعديل البيانات المالية أو البنيوية للطلب';
    END IF;

    -- تقييد صلاحية تعديل الحالة: يسمح له فقط بالإلغاء وإذا كان الطلب معلقاً فقط
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      IF NEW.status = 'cancelled' AND OLD.status = 'pending' THEN
        -- إعادة المنتجات إلى المخزن تلقائياً فور إلغاء العميل لطلبه المعلق
        UPDATE public.products p
        SET stock = p.stock + oi.quantity
        FROM public.order_items oi
        WHERE oi.order_id = NEW.id AND p.id = oi.product_id;
      ELSE
        RAISE EXCEPTION 'خرق آلة الحالات: لا يمكن إلغاء الطلب إلا إذا كانت حالته الحالية قيد الانتظار (Pending)';
      END IF;
    END IF;
  END IF;

  -- فحص محاولات الطيار (السائق المسؤول عن التوصيل)
  IF auth.uid() = OLD.pilot_id THEN
    -- منعه من تزوير الحسابات المالية أو تغيير هوية صاحب الطلب
    IF NEW.subtotal IS DISTINCT FROM OLD.subtotal OR 
       NEW.shipping_fee IS DISTINCT FROM OLD.shipping_fee OR 
       NEW.total IS DISTINCT FROM OLD.total OR 
       NEW.customer_id IS DISTINCT FROM OLD.customer_id THEN
      RAISE EXCEPTION 'عملية مرفوضة: غير مسموح للطيار بتعديل القيم المالية أو هويات العملاء';
    END IF;
    
    -- الطيار يسمح له فقط بالتنقل بين حالات التوصيل (مثل: accepted -> picked_up -> delivered)
    -- لا يسمح له بالتلاعب بحالة الدفع إلا إذا كان الدفع عند الاستلام (COD) وتحول الطلب إلى مستلم
    IF NEW.payment_status IS DISTINCT FROM OLD.payment_status AND OLD.payment_method != 'cod' THEN
      RAISE EXCEPTION 'عملية مرفوضة: تحديث حالة الدفع الإلكتروني مقتصر على خوادم النظام الحيوية';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_order_state_machine ON public.orders;
CREATE TRIGGER trg_enforce_order_state_machine
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.enforce_order_state_machine();
