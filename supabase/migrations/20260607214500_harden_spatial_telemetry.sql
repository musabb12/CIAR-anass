-- تحصين أنظمة التتبع الجغرافي الحي ومنع التسريب الزمني للإحداثيات

-- 1. تطهير السياسات القديمة والمكشوفة
DROP POLICY IF EXISTS "self upserts location" ON public.live_locations;
DROP POLICY IF EXISTS "self updates location" ON public.live_locations;
DROP POLICY IF EXISTS "order participants view location" ON public.live_locations;

-- 2. سياسة الإدخال الصارمة: التحقق من شرعية الدور والارتباط بالطلب النشط
CREATE POLICY "self inserts validated location" ON public.live_locations
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND (
      order_id IS NULL OR EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_id
          AND o.status NOT IN ('completed', 'cancelled') -- يجب أن يكون الطلب نشطاً حوسبياً
          AND (
            (role = 'pilot' AND o.pilot_id = auth.uid()) OR
            (role = 'customer' AND o.customer_id = auth.uid()) OR
            (role = 'seller' AND EXISTS (
              SELECT 1 FROM public.order_items oi
              JOIN public.products p ON p.id = oi.product_id
              JOIN public.stores s ON s.id = p.store_id
              WHERE oi.order_id = o.id AND s.owner_id = auth.uid()
            ))
          )
      )
    )
  );

-- 3. سياسة التحديث: حصر التعديل على صاحب الإحداثية وضمن النطاق النشط فقط
CREATE POLICY "self updates validated location" ON public.live_locations
  FOR UPDATE USING (
    auth.uid() = user_id
    AND (
      order_id IS NULL OR EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = live_locations.order_id
          AND o.status NOT IN ('completed', 'cancelled')
      )
    )
  );

-- 4. سياسة القراءة المحصنة زمنياً: قطع البث الجغرافي فور إغلاق المعاملة
CREATE POLICY "order participants view active location" ON public.live_locations
  FOR SELECT USING (
    auth.uid() = user_id OR
    (
      order_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = live_locations.order_id
          AND o.status NOT IN ('completed', 'cancelled') -- حظر استخباراتي للموقع بعد إغلاق الطلب
          AND (
            o.customer_id = auth.uid() OR 
            o.pilot_id = auth.uid() OR 
            EXISTS (
              SELECT 1 FROM public.order_items oi
              JOIN public.products p ON p.id = oi.product_id
              JOIN public.stores s ON s.id = p.store_id
              WHERE oi.order_id = o.id AND s.owner_id = auth.uid()
            )
          )
      )
    )
  );
