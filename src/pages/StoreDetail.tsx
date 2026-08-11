import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, MapPin, Phone, BadgeCheck, Tag, Megaphone, Gift, MessageSquare, Flag, MessageCircle, Mail, Send, Heart, Package, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/layout/Navbar";
import ProductCard from "@/components/shop/ProductCard";
import { toast } from "sonner";
import { formatYER } from "@/lib/format";

const StoreDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [store, setStore] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [anns, setAnns] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(false);

  // forms
  const [contact, setContact] = useState({ name: "", email: "", phone: "", message: "" });
  const [ticket, setTicket] = useState({ subject: "", message: "", priority: "normal" });
  const [report, setReport] = useState({ reason: "", details: "" });

  const refresh = async () => {
    if (!id) return;
    const [{ data: st }, { data: stg }, { data: prods }, { data: pr }, { data: an }, { data: rw }, { data: rv }, { count }] = await Promise.all([
      supabase.from("stores").select("*").eq("id", id).maybeSingle(),
      supabase.from("store_settings").select("*").eq("store_id", id).maybeSingle(),
      supabase.from("products").select("*").eq("store_id", id).eq("is_active", true).order("is_featured", { ascending: false }),
      supabase.from("store_promotions").select("*").eq("store_id", id).eq("is_active", true).order("created_at", { ascending: false }),
      supabase.from("store_announcements").select("*").eq("store_id", id).eq("is_active", true).order("priority", { ascending: false }),
      supabase.from("store_rewards").select("*").eq("store_id", id).eq("is_active", true),
      supabase.from("reviews").select("*, products!inner(name, store_id)").eq("products.store_id", id).order("created_at", { ascending: false }).limit(20),
      supabase.from("store_followers").select("*", { count: "exact", head: true }).eq("store_id", id),
    ]);
    setStore(st);
    setSettings(stg);
    setProducts(prods ?? []);
    setPromos(pr ?? []);
    setAnns(an ?? []);
    setRewards(rw ?? []);
    setReviews(rv ?? []);
    setFollowers(count ?? 0);
    if (user) {
      const { data: f } = await supabase.from("store_followers").select("id").eq("store_id", id).eq("user_id", user.id).maybeSingle();
      setFollowing(!!f);
    }
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [id, user]);

  const toggleFollow = async () => {
    if (!user) { toast.error("سجل دخول أولاً"); return; }
    if (following) {
      await supabase.from("store_followers").delete().eq("store_id", id!).eq("user_id", user.id);
      setFollowing(false); setFollowers((f) => f - 1);
    } else {
      await supabase.from("store_followers").insert({ store_id: id!, user_id: user.id });
      setFollowing(true); setFollowers((f) => f + 1);
      toast.success("تم متابعة المتجر ❤️");
    }
  };

  const sendContact = async () => {
    if (!contact.name || !contact.message) { toast.error("الاسم والرسالة مطلوبان"); return; }
    const { error } = await supabase.from("store_contact_messages").insert({
      store_id: id!, sender_id: user?.id ?? null,
      name: contact.name, email: contact.email || null, phone: contact.phone || null, message: contact.message,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("تم إرسال رسالتك ✨");
    setContact({ name: "", email: "", phone: "", message: "" });
  };

  const sendTicket = async () => {
    if (!user) { toast.error("سجل دخول أولاً"); return; }
    if (!ticket.subject || !ticket.message) { toast.error("املأ كل الحقول"); return; }
    const { error } = await supabase.from("store_support_tickets").insert({
      store_id: id!, user_id: user.id, subject: ticket.subject, message: ticket.message, priority: ticket.priority,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("تم إرسال طلب الدعم 🎫");
    setTicket({ subject: "", message: "", priority: "normal" });
  };

  const sendReport = async () => {
    if (!user) { toast.error("سجل دخول أولاً"); return; }
    if (!report.reason) { toast.error("سبب البلاغ مطلوب"); return; }
    const { error } = await supabase.from("store_reports").insert({
      store_id: id!, reporter_id: user.id, reason: report.reason, details: report.details || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("تم إرسال البلاغ 🚨");
    setReport({ reason: "", details: "" });
  };

  if (!store) return (<div className="min-h-screen bg-background"><Navbar /><div className="container py-20 text-center text-muted-foreground">جاري التحميل... أو أن المتجر غير متاح أو بانتظار اعتماد المسؤول.</div></div>);
  if (store.suspended || (store.approval_status && store.approval_status !== "approved" && store.owner_id !== user?.id)) {
    return (<div className="min-h-screen bg-background"><Navbar /><div className="container py-20 text-center"><h2 className="text-xl font-bold mb-2">⚠️ المتجر غير متاح</h2><p className="text-sm text-muted-foreground">هذا المتجر بانتظار اعتماد المسؤول أو تم تعليقه.</p></div></div>);
  }

  const themeColor = settings?.primary_color || store.theme_color || "#4B0082";

  return (
    <div className="min-h-screen bg-background" style={settings?.background_url ? { backgroundImage: `url(${settings.background_url})`, backgroundSize: "cover", backgroundAttachment: "fixed" } : {}}>
      <Navbar />

      {/* Cover */}
      <div className="relative h-56 md:h-72 overflow-hidden">
        <img src={store.cover_url ?? "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${themeColor}, transparent)` }} />
      </div>

      <main className="container -mt-20 relative z-10 pb-12">
        {/* Store header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 mb-6 flex flex-col md:flex-row gap-5 items-start backdrop-blur-xl">
          <img src={store.logo_url ?? "/placeholder.svg"} alt={store.name} className="h-24 w-24 rounded-2xl border-2 object-cover" style={{ borderColor: themeColor }} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black">{store.name}</h1>
              {store.is_verified && <BadgeCheck className="h-5 w-5 text-primary" />}
            </div>
            <p className="text-sm text-muted-foreground mb-3">{store.description}</p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-accent text-accent" /> {Number(store.rating).toFixed(1)}</span>
              {store.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {store.city}</span>}
              {store.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {store.phone}</span>}
              <span className="font-cyber text-primary">{store.total_sales} مبيع</span>
              <span className="flex items-center gap-1"><Heart className="h-3 w-3 text-destructive" /> {followers}</span>
            </div>
          </div>
          <Button variant={following ? "outline" : "gold"} onClick={toggleFollow}>
            <Heart className={`h-4 w-4 ms-1 ${following ? "fill-destructive text-destructive" : ""}`} />
            {following ? "متابع" : "متابعة"}
          </Button>
        </motion.div>

        {/* Active announcements scroller */}
        {anns.length > 0 && (
          <div className="glass rounded-xl p-3 mb-4 flex items-center gap-3 overflow-x-auto">
            <Megaphone className="h-4 w-4 text-accent shrink-0" />
            {anns.map((a) => (
              <span key={a.id} className="text-xs whitespace-nowrap"><b>{a.title}:</b> {a.content}</span>
            ))}
          </div>
        )}

        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid grid-cols-4 md:grid-cols-8 mb-6 h-auto">
            <TabsTrigger value="browse" className="text-xs"><Package className="h-3 w-3 ms-1" />تصفح</TabsTrigger>
            <TabsTrigger value="products" className="text-xs">المنتجات</TabsTrigger>
            <TabsTrigger value="promos" className="text-xs"><Tag className="h-3 w-3 ms-1" />العروض</TabsTrigger>
            <TabsTrigger value="rewards" className="text-xs"><Gift className="h-3 w-3 ms-1" />جوائز</TabsTrigger>
            <TabsTrigger value="reviews" className="text-xs"><Star className="h-3 w-3 ms-1" />تقييم</TabsTrigger>
            <TabsTrigger value="contact" className="text-xs"><MessageCircle className="h-3 w-3 ms-1" />تواصل</TabsTrigger>
            <TabsTrigger value="support" className="text-xs"><MessageSquare className="h-3 w-3 ms-1" />دعم</TabsTrigger>
            <TabsTrigger value="report" className="text-xs"><Flag className="h-3 w-3 ms-1" />ابلاغ</TabsTrigger>
          </TabsList>

          {/* BROWSE */}
          <TabsContent value="browse">
            {promos.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Tag className="h-5 w-5 text-accent" /> أحدث العروض</h2>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {promos.slice(0, 3).map((p) => (
                    <div key={p.id} className="rounded-xl border border-border/50 overflow-hidden">
                      {p.image_url && <img src={p.image_url} className="w-full h-32 object-cover" />}
                      <div className="p-3"><div className="font-bold flex items-center justify-between">{p.title}<Badge className="bg-accent text-accent-foreground">-{p.discount_pct}%</Badge></div></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <h2 className="text-lg font-bold mb-3">المنتجات المميزة</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {products.slice(0, 8).map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </TabsContent>

          {/* PRODUCTS */}
          <TabsContent value="products">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {products.length === 0 ? <div className="col-span-full text-center py-12 text-muted-foreground">لا منتجات</div> : products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </TabsContent>

          {/* PROMOTIONS */}
          <TabsContent value="promos">
            {promos.length === 0 ? <div className="text-center py-12 text-muted-foreground">لا عروض حالياً</div> : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {promos.map((p) => (
                  <motion.div key={p.id} whileHover={{ scale: 1.02 }} className="glass rounded-xl overflow-hidden">
                    {p.image_url && <img src={p.image_url} className="w-full h-40 object-cover" />}
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold">{p.title}</h3>
                        <Badge className="bg-accent text-accent-foreground">-{p.discount_pct}%</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{p.description}</p>
                      {p.ends_at && <div className="text-[10px] text-destructive flex items-center gap-1"><Clock className="h-3 w-3" /> ينتهي {new Date(p.ends_at).toLocaleDateString("ar")}</div>}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* REWARDS */}
          <TabsContent value="rewards">
            {rewards.length === 0 ? <div className="text-center py-12 text-muted-foreground">لا كوبونات</div> : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {rewards.map((r) => (
                  <div key={r.id} className="glass rounded-xl p-4 border-2 border-dashed border-accent/40">
                    <div className="font-cyber text-xl text-accent text-center mb-2">{r.code}</div>
                    <div className="text-center text-sm font-bold">{r.reward_type === "percent" ? `خصم ${r.value}%` : r.reward_type === "fixed" ? `خصم ${formatYER(r.value)}` : "🎁 هدية"}</div>
                    {r.description && <p className="text-xs text-muted-foreground text-center mt-2">{r.description}</p>}
                    {r.min_order > 0 && <p className="text-[10px] text-center mt-1">أقل طلب: {formatYER(r.min_order)}</p>}
                    <Button size="sm" variant="outline" className="w-full mt-3" onClick={() => { navigator.clipboard.writeText(r.code); toast.success("تم نسخ الكود ✨"); }}>نسخ الكود</Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* REVIEWS */}
          <TabsContent value="reviews">
            {reviews.length === 0 ? <div className="text-center py-12 text-muted-foreground">لا تقييمات بعد</div> : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div key={r.id} className="glass rounded-xl p-4">
                    <div className="text-xs text-muted-foreground mb-1">{r.products?.name}</div>
                    <div className="flex gap-1 mb-2">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3 w-3 ${i < r.rating ? "fill-accent text-accent" : "text-muted"}`} />)}</div>
                    <p className="text-sm">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* CONTACT */}
          <TabsContent value="contact">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="glass rounded-xl p-5 space-y-3">
                <h3 className="font-bold flex items-center gap-2"><MessageCircle className="h-4 w-4 text-primary" /> أرسل رسالة للمتجر</h3>
                <div><Label>الاسم *</Label><Input value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>البريد</Label><Input value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} /></div>
                  <div><Label>الهاتف</Label><Input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} /></div>
                </div>
                <div><Label>الرسالة *</Label><Textarea rows={4} value={contact.message} onChange={(e) => setContact({ ...contact, message: e.target.value })} /></div>
                <Button variant="gold" onClick={sendContact} className="w-full"><Send className="h-4 w-4 ms-1" /> إرسال</Button>
              </div>
              <div className="glass rounded-xl p-5 space-y-3">
                <h3 className="font-bold">معلومات التواصل</h3>
                {settings?.whatsapp && <a href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 rounded bg-secondary/40 hover:bg-secondary"><Phone className="h-4 w-4 text-green-500" /> {settings.whatsapp}</a>}
                {settings?.email && <a href={`mailto:${settings.email}`} className="flex items-center gap-2 p-2 rounded bg-secondary/40 hover:bg-secondary"><Mail className="h-4 w-4 text-primary" /> {settings.email}</a>}
                {settings?.telegram && <a href={`https://t.me/${settings.telegram.replace("@", "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 rounded bg-secondary/40 hover:bg-secondary"><Send className="h-4 w-4 text-sky-500" /> {settings.telegram}</a>}
                {settings?.location_address && <div className="flex items-start gap-2 p-2 rounded bg-secondary/40"><MapPin className="h-4 w-4 mt-0.5 text-accent" /> <span className="text-sm">{settings.location_address}</span></div>}
                {settings?.shipping_policy && <div className="text-xs"><b>سياسة الشحن:</b> {settings.shipping_policy}</div>}
                {settings?.return_policy && <div className="text-xs"><b>سياسة الإرجاع:</b> {settings.return_policy}</div>}
              </div>
            </div>
          </TabsContent>

          {/* SUPPORT */}
          <TabsContent value="support">
            <div className="glass rounded-xl p-5 max-w-2xl mx-auto space-y-3">
              <h3 className="font-bold flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> طلب دعم من المتجر</h3>
              <div><Label>الموضوع *</Label><Input value={ticket.subject} onChange={(e) => setTicket({ ...ticket, subject: e.target.value })} /></div>
              <div>
                <Label>الأولوية</Label>
                <Select value={ticket.priority} onValueChange={(v) => setTicket({ ...ticket, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">منخفضة</SelectItem>
                    <SelectItem value="normal">عادية</SelectItem>
                    <SelectItem value="high">عالية</SelectItem>
                    <SelectItem value="urgent">عاجلة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>الرسالة *</Label><Textarea rows={4} value={ticket.message} onChange={(e) => setTicket({ ...ticket, message: e.target.value })} /></div>
              <Button variant="gold" onClick={sendTicket} className="w-full"><Send className="h-4 w-4 ms-1" /> إرسال التذكرة</Button>
            </div>
          </TabsContent>

          {/* REPORT */}
          <TabsContent value="report">
            <div className="glass rounded-xl p-5 max-w-2xl mx-auto space-y-3">
              <h3 className="font-bold flex items-center gap-2"><Flag className="h-4 w-4 text-destructive" /> الكولونيالاغ عن مشكلة</h3>
              <div>
                <Label>سبب البلاغ *</Label>
                <Select value={report.reason} onValueChange={(v) => setReport({ ...report, reason: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر السبب" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="منتج مزيف">منتج مزيف</SelectItem>
                    <SelectItem value="خداع في السعر">خداع في السعر</SelectItem>
                    <SelectItem value="منتج محظور">منتج محظور</SelectItem>
                    <SelectItem value="سلوك غير لائق">سلوك غير لائق</SelectItem>
                    <SelectItem value="أخرى">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>تفاصيل</Label><Textarea rows={4} value={report.details} onChange={(e) => setReport({ ...report, details: e.target.value })} /></div>
              <Button variant="destructive" onClick={sendReport} className="w-full"><Flag className="h-4 w-4 ms-1" /> إرسال البلاغ</Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default StoreDetail;
