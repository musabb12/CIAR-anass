-- تصفير ثغرة تصعيد الامتيازات وتحصين طبقة الأدوار (RBAC)

-- 1. إسقاط السياسة الانتحارية التي تسمح للمستخدمين بتحديد أدوارهم
DROP POLICY IF EXISTS "Users can insert their own role on signup" ON public.user_roles;

-- 2. بناء جدار حماية سيادي: منع أي عمليات إدخال أو تعديل للأدوار إلا من قبل المشرفين (Admin Only)
-- ملاحظة: دالة has_role مصممة بـ SECURITY DEFINER لذا لن تسبب تكراراً لانهائياً (Recursive RLS)
CREATE POLICY "Admins can mutate all roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- الجدول الآن محمي بالكامل: 
-- - القراءة: للمستخدم نفسه لرؤية دوره، وللأدمن لرؤية الكل.
-- - التعديل والإدخال: حصرياً للأدمن، أو عبر التريجرات الخلفية الموثوقة.
