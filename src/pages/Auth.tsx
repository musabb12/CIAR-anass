import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Hexagon, Mail, Lock, User, Phone, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ROLES } from "@/lib/roles";
import type { AppRole } from "@/hooks/useAuth";

const Auth = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, roles } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">(params.get("mode") === "signup" ? "signup" : "login");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    role: (params.get("role") as AppRole) || ("customer" as AppRole),
  });

  useEffect(() => { document.title = mode === "login" ? "تسجيل دخول | مارد التفوق" : "إنشاء حساب | مارد التفوق"; }, [mode]);

  useEffect(() => {
    if (user && roles.length > 0) {
      const target = ROLES.find((r) => roles.includes(r.id))?.path ?? "/dashboard/customer";
      navigate(target, { replace: true });
    }
  }, [user, roles, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: form.fullName, phone: form.phone, role: form.role },
          },
        });
        if (error) throw error;
        toast.success("تم إنشاء حسابك بنجاح! جاري الدخول...");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
        toast.success("أهلاً بعودتك!");
      }
    } catch (err: any) {
      toast.error(err.message ?? "حدث خطأ، حاول مجدداً");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-hero relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute top-1/3 -left-32 h-80 w-80 rounded-full bg-primary/20 blur-[120px]" />
      <div className="absolute bottom-1/4 -right-32 h-80 w-80 rounded-full bg-accent/15 blur-[120px]" />

      <Link to="/" className="fixed top-6 right-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary z-50">
        <ArrowLeft className="h-4 w-4 rotate-180" /> ال€سية
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md glass rounded-3xl p-8 z-10"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <Hexagon className="h-10 w-10 text-primary animate-pulse-glow" strokeWidth={1.5} />
          </Link>
          <h1 className="font-cyber text-2xl font-black text-gradient-primary mb-1">مارد التفوق</h1>
          <p className="text-sm text-muted-foreground">{mode === "login" ? "ادخل المنظومة" : "انضم إلى المنظومة"}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-secondary/50 rounded-lg">
          <button onClick={() => setMode("login")} className={`py-2 rounded-md text-sm font-medium transition-all ${mode === "login" ? "bg-primary text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.4)]" : "text-muted-foreground"}`}>
            دخول
          </button>
          <button onClick={() => setMode("signup")} className={`py-2 rounded-md text-sm font-medium transition-all ${mode === "signup" ? "bg-primary text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.4)]" : "text-muted-foreground"}`}>
            تسجيل
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <>
              <div>
                <Label htmlFor="fullName" className="text-xs">الاسم الكامل</Label>
                <div className="relative mt-1">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="fullName" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="pr-9" placeholder="محمد عبدالله" />
                </div>
              </div>
              <div>
                <Label htmlFor="phone" className="text-xs">رقم الجوال</Label>
                <div className="relative mt-1">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="pr-9" placeholder="+967 7XX XXX XXX" />
                </div>
              </div>
              <div>
                <Label className="text-xs">اختر دورك في المنظومة</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {ROLES.filter((r) => r.id !== "admin").map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setForm({ ...form, role: r.id })}
                      className={`flex items-center gap-2 p-2.5 rounded-lg text-xs border transition-all ${
                        form.role === r.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      <r.icon className="h-3.5 w-3.5" />
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <Label htmlFor="email" className="text-xs">البريد الإلكتروني</Label>
            <div className="relative mt-1">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="pr-9" placeholder="you@mared.de" />
            </div>
          </div>

          <div>
            <Label htmlFor="password" className="text-xs">كلمة المرور</Label>
            <div className="relative mt-1">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="password" type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="pr-9" placeholder="••••••••" />
            </div>
          </div>

          <Button type="submit" variant="hero" size="lg" className="w-full h-12" disabled={loading}>
            {loading ? "جاري المعالجة..." : mode === "login" ? "ادخل المنظومة" : "أنشئ حسابي"}
          </Button>
        </form>

        <p className="text-xs text-center text-muted-foreground mt-6">
          بالمتابعة، فإنك توافق على شروط الخدمة وسياسة الخصوصية لـ مارد التفوق
        </p>
      </motion.div>
    </main>
  );
};

export default Auth;
