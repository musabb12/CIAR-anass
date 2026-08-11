import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { User, MapPin, Trash2, Plus, Shield, MessageCircle, LifeBuoy, Ticket, AlertOctagon, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>({ full_name: "", phone: "", city: "" });
  const [addresses, setAddresses] = useState<any[]>([]);
  const [newAddr, setNewAddr] = useState({ city: "", district: "", street: "", phone: "", full_name: "", label: "" });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => data && setProfile(data));
    supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false }).then(({ data }) => setAddresses(data ?? []));
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name, phone: profile.phone, city: profile.city,
    }).eq("id", user.id);
    if (error) toast.error("تعذر الحفظ");
    else toast.success("تم حفظ البيانات");
  };

  const addAddress = async () => {
    if (!user || !newAddr.city) return toast.error("أكمل العنوان");
    const { data, error } = await supabase.from("addresses").insert({ user_id: user.id, ...newAddr, is_default: addresses.length === 0 }).select().single();
    if (error) return toast.error("تعذر الإضافة");
    setAddresses([data, ...addresses]);
    setNewAddr({ city: "", district: "", street: "", phone: "", full_name: "", label: "" });
    toast.success("أُضيف العنوان");
  };

  const removeAddress = async (id: string) => {
    await supabase.from("addresses").delete().eq("id", id);
    setAddresses(addresses.filter(a => a.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        <h1 className="text-3xl font-black mb-6">ملفي الشخصي</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-6">
            <h2 className="font-bold mb-5 flex items-center gap-2"><User className="h-5 w-5 text-primary" /> البيانات الشخصية</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">البريد</label>
                <Input value={user?.email ?? ""} disabled />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">الاسم الكامل</label>
                <Input value={profile.full_name ?? ""} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">رقم الجوال</label>
                <Input value={profile.phone ?? ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">المدينة</label>
                <Input value={profile.city ?? ""} onChange={(e) => setProfile({ ...profile, city: e.target.value })} />
              </div>
              <Button variant="hero" onClick={saveProfile} className="w-full">حفظ التغييرات</Button>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h2 className="font-bold mb-5 flex items-center gap-2"><MapPin className="h-5 w-5 text-accent" /> عناويني ({addresses.length})</h2>
            <div className="space-y-2 mb-5">
              {addresses.map(a => (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                  <div className="flex-1 text-sm">
                    <div className="font-medium">{a.label || a.full_name || "عنوان"}</div>
                    <div className="text-xs text-muted-foreground">{a.city} {a.district && `، ${a.district}`}</div>
                  </div>
                  <button onClick={() => removeAddress(a.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
            <div className="border-t border-border/50 pt-4">
              <div className="text-sm font-cyber text-primary mb-3">+ إضافة عنوان</div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="تسمية (المنزل، العمل)" value={newAddr.label} onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })} className="col-span-2" />
                <Input placeholder="المدينة *" value={newAddr.city} onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })} />
                <Input placeholder="الحي" value={newAddr.district} onChange={(e) => setNewAddr({ ...newAddr, district: e.target.value })} />
                <Input placeholder="الشارع" value={newAddr.street} onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })} className="col-span-2" />
                <Input placeholder="الجوال" value={newAddr.phone} onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })} className="col-span-2" />
                <Button variant="cyber" onClick={addAddress} className="col-span-2"><Plus className="ms-2 h-4 w-4" /> إضافة</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Communication with Admin */}
        <div className="glass rounded-2xl p-6 mt-6 relative overflow-hidden">
          <div className="absolute -top-12 -end-12 h-32 w-32 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative">
            <h2 className="font-bold mb-2 flex items-center gap-2"><Shield className="h-5 w-5 text-accent" /> التواصل مع المسؤول</h2>
            <p className="text-xs text-muted-foreground mb-4">دعم، تذاكر، شكاوى، بلاغات وتواصل مباشر — مع رفع الأدلة والملفات والدردشة الحية</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { kind: "contact",   icon: MessageCircle, label: "تواصل مباشر", color: "text-primary",     desc: "محادثة فورية مع المسؤول" },
                { kind: "support",   icon: LifeBuoy,      label: "الدعم الفني",  color: "text-accent",      desc: "مشاكل تقنية ومدفوعات" },
                { kind: "ticket",    icon: Ticket,        label: "تذاكر",         color: "text-blue-400",    desc: "طلبات رسمية للمتابعة" },
                { kind: "complaint", icon: AlertOctagon,  label: "شكاوى",        color: "text-orange-400",  desc: "ضد متجر أو سائق" },
                { kind: "report",    icon: AlertOctagon,  label: "بلاغات",       color: "text-destructive", desc: "احتيال + رفع أدلة" },
                { kind: "help",      icon: HelpCircle,    label: "مساعدة",       color: "text-green-400",   desc: "أسئلة وإرشادات" },
              ].map((it) => (
                <Link key={it.kind} to="/admin-contact"
                  className="group p-4 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/40 transition">
                  <it.icon className={`h-6 w-6 ${it.color} mb-2 group-hover:scale-110 transition`} />
                  <div className="font-bold text-sm">{it.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{it.desc}</div>
                </Link>
              ))}
            </div>
            <Link to="/admin-contact" className="block mt-4">
              <Button variant="hero" className="w-full">
                <MessageCircle className="h-4 w-4 ms-2" /> فتح صندوق المحادثات
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
