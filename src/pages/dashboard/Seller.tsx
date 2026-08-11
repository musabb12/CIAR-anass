import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Store, TrendingUp, Package, DollarSign, Wand2, Eye, EyeOff, AlertTriangle,
  Plus, Tag, Megaphone, Gift, MessageSquare, Flag, Star, MessageCircle,
  Settings as SettingsIcon, Wallet as WalletIcon, Briefcase, Edit, Trash2,
  ExternalLink, Phone, Send, Mail, BadgeCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatYER } from "@/lib/format";
import { Link } from "react-router-dom";
import AIListingDialog from "@/components/seller/AIListingDialog";
import ProductDialog from "@/components/seller/ProductDialog";
import StoreSetupDialog from "@/components/seller/StoreSetupDialog";
import PromotionDialog from "@/components/seller/PromotionDialog";
import AnnouncementDialog from "@/components/seller/AnnouncementDialog";
import RewardDialog from "@/components/seller/RewardDialog";
import StoreSettingsPanel from "@/components/seller/StoreSettingsPanel";
import ActionHero from "@/components/common/ActionHero";
import { toast } from "sonner";

interface SellerDashboardProps {
  /** وضع التضمين داخل لوحة تحكم المسؤول (بدون هيدر لوحة البائع) */
  embedded?: boolean;
  /** معرّف المتجر المُدار من قبل المسؤول */
  storeId?: string;
}

const SellerDashboard = ({ embedded = false, storeId: embeddedStoreId }: SellerDashboardProps = {}) => {
  const [searchParams] = useSearchParams();
  
  const { user, roles } = useAuth();
  // 🛡️ حقن نظام المحاكاة والتحكم المركزي للمشرف الخارق دون المساس بملف الأدمن
  const urlParams = new URLSearchParams(window.location.search);
  const impersonateStoreId = embeddedStoreId ?? urlParams.get("impersonate_store_id");
  const isAdminMode = roles && roles.includes("admin");

  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [anns, setAnns] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);

  const [stats, setStats] = useState({ revenue: 0, active: 0, lowStock: 0, hidden: 0 });

  // dialogs
  const [storeDlg, setStoreDlg] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [prodDlg, setProdDlg] = useState(false);
  const [editProd, setEditProd] = useState<any>(null);
  const [promoDlg, setPromoDlg] = useState(false);
  const [editPromo, setEditPromo] = useState<any>(null);
  const [annDlg, setAnnDlg] = useState(false);
  const [editAnn, setEditAnn] = useState<any>(null);
  const [rewDlg, setRewDlg] = useState(false);
  const [editRew, setEditRew] = useState<any>(null);

  const [hero, setHero] = useState(false);
  const [heroTitle, setHeroTitle] = useState("");
  const fireHero = (t: string) => { setHeroTitle(t); setHero(true); setTimeout(() => setHero(false), 2200); };

  const refresh = async () => {
    if (!user) return;
    let st;
    if (impersonateStoreId && isAdminMode) {
      const { data: adminSt } = await supabase.from("stores").select("*").eq("id", impersonateStoreId).maybeSingle();
      st = adminSt;
    } else {
      const { data: sellerSt } = await supabase.from("stores").select("*").eq("owner_id", user.id).order("created_at", { ascending: true }).limit(1).maybeSingle();
      st = sellerSt;
    }
    setStore(st);
    if (!st) return;

    const [{ data: prods }, { data: ords }, { data: pr }, { data: an }, { data: rw }, { data: tk }, { data: rp }, { data: ct }, { data: rv }, { data: wl }] = await Promise.all([
      supabase.from("products").select("*").eq("store_id", st.id).order("created_at", { ascending: false }),
      supabase.from("orders").select("*, order_items!inner(product_id, products!inner(store_id))").eq("order_items.products.store_id", st.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("store_promotions").select("*").eq("store_id", st.id).order("created_at", { ascending: false }),
      supabase.from("store_announcements").select("*").eq("store_id", st.id).order("created_at", { ascending: false }),
      supabase.from("store_rewards").select("*").eq("store_id", st.id).order("created_at", { ascending: false }),
      supabase.from("store_support_tickets").select("*").eq("store_id", st.id).order("created_at", { ascending: false }),
      supabase.from("store_reports").select("*").eq("store_id", st.id).order("created_at", { ascending: false }),
      supabase.from("store_contact_messages").select("*").eq("store_id", st.id).order("created_at", { ascending: false }),
      supabase.from("reviews").select("*, products!inner(name, store_id)").eq("products.store_id", st.id).order("created_at", { ascending: false }),
      supabase.from("wallets").select("balance").eq("user_id", st?.owner_id || user.id).maybeSingle(),
    ]);
    setProducts(prods ?? []);
    setOrders(ords ?? []);
    setPromos(pr ?? []);
    setAnns(an ?? []);
    setRewards(rw ?? []);
    setTickets(tk ?? []);
    setReports(rp ?? []);
    setContacts(ct ?? []);
    setReviews(rv ?? []);
    setWalletBalance(Number(wl?.balance ?? 0));

    const list = prods ?? [];
    setStats({
      revenue: list.reduce((s, p) => s + Number(p.sales_count || 0) * Number(p.price || 0), 0),
      active: list.filter((p) => p.is_active).length,
      lowStock: list.filter((p) => p.stock > 0 && p.stock < 5).length,
      hidden: list.filter((p) => p.visibility_status === "hidden_oos").length,
    });
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [user, impersonateStoreId]);

  const handleAIGenerated = async (data: any) => {
    if (!store?.id) { toast.error("أنشئ متجرك أولاً"); return; }
    const { error } = await supabase.from("products").insert({
      store_id: store.id, name: data.name, description: data.description,
      price: Number(data.suggested_price_yer) || 0, stock: Number(data.stock_recommendation) || 10,
      tags: data.tags ?? [], is_active: true, auto_hide_when_oos: true,
    });
    if (error) { toast.error("تعذّر إضافة المنتج"); return; }
    fireHero("🎉 منتج جديد منشور بالذكاء الاصطناعي!");
    refresh();
  };

  const toggleVisibility = async (p: any) => {
    const newStatus = p.visibility_status === "visible" ? "hidden_manual" : "visible";
    await supabase.from("products").update({ visibility_status: newStatus, is_active: newStatus === "visible" }).eq("id", p.id);
    refresh();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("هل تريد حذف هذا المنتج؟")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("تم الحذف"); refresh();
  };

  const replyTicket = async (t: any) => {
    const reply = prompt("اكتب ردك:", t.reply ?? "");
    if (reply === null) return;
    await supabase.from("store_support_tickets").update({ reply, status: "answered" }).eq("id", t.id);
    toast.success("تم الرد"); refresh();
  };

  const markContactRead = async (id: string) => {
    await supabase.from("store_contact_messages").update({ is_read: true }).eq("id", id);
    refresh();
  };

  // غلاف ذكي: هيدر لوحة البائع في الوضع العادي، ومحتوى نظيف داخل لوحة المسؤول
  const wrap = (title: string, subtitle: string, children: React.ReactNode) =>
    embedded ? (
      <div className="space-y-4">
        <div className="mb-2">
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        {children}
      </div>
    ) : (
      <DashboardShell role="seller" title={title} subtitle={subtitle}>{children}</DashboardShell>
    );

  // ==== No store yet ====
  if (!store) {
    return wrap("🏪 ابدأ رحلتك التجارية", "أنشئ متجرك في خطوات بسيطة وانطلق إلى عالم التسوق", (
      <>
        <div className="max-w-xl mx-auto glass rounded-2xl p-10 text-center">
          <div className="h-20 w-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Store className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">لا يوجد لديك متجر بعد</h2>
          <p className="text-muted-foreground mb-6">أنشئ متجرك الأول وابدأ بإضافة منتجاتك للعرض في مارد التفوق</p>
          <Button variant="gold" size="lg" onClick={() => setStoreDlg(true)}>
            <Plus className="h-5 w-5 ms-1" /> إنشاء متجري الآن
          </Button>
        </div>
        <StoreSetupDialog open={storeDlg} onClose={() => setStoreDlg(false)} onSaved={() => refresh()} />
      </>
    ));
  }

  return wrap(`🏪 ${store.name}`, "مركز قيادة المتجر — إدارة كاملة بطريقة ذكية ومطورة", (
    <>

      <ActionHero show={hero} title={heroTitle} subtitle="تم بنجاح في مارد التفوق" />

      {store.approval_status === "pending" && (
        <div className="glass rounded-xl p-4 mb-5 border border-accent/40 bg-accent/5 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-accent shrink-0" />
          <div className="flex-1">
            <div className="font-bold text-sm">⏳ متجرك قيد المراجعة من قبل المسؤول</div>
            <div className="text-xs text-muted-foreground mt-0.5">لن يظهر متجرك ولا منتجاتك للعملاء حتى يتم اعتماده.</div>
          </div>
        </div>
      )}
      {store.approval_status === "rejected" && (
        <div className="glass rounded-xl p-4 mb-5 border border-destructive/40 bg-destructive/5 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-sm">❌ تم رفض متجرك</div>
            {store.rejection_reason && <div className="text-xs text-muted-foreground mt-0.5">السبب: {store.rejection_reason}</div>}
            <Link to="/admin-contact" className="text-xs text-accent underline mt-1 inline-block">تواصل مع المسؤول</Link>
          </div>
        </div>
      )}
      {store.suspended && (
        <div className="glass rounded-xl p-4 mb-5 border border-destructive/40 bg-destructive/5">
          <div className="font-bold text-sm text-destructive">⛔ متجرك معلّق إدارياً</div>
        </div>
      )}

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { icon: DollarSign, label: "إيرادات", value: formatYER(stats.revenue) },
          { icon: WalletIcon, label: "محفظة", value: formatYER(walletBalance) },
          { icon: Package, label: "منتجات", value: stats.active.toString() },
          { icon: AlertTriangle, label: "مخزون قليل", value: stats.lowStock.toString() },
          { icon: EyeOff, label: "مخفية", value: stats.hidden.toString() },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="glass rounded-xl p-4">
            <s.icon className="mb-2 h-4 w-4 text-primary" />
            <div className="font-cyber text-base font-bold">{s.value}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Quick actions bar */}
      <div className="glass rounded-xl p-3 mb-6 flex flex-wrap gap-2 items-center">
        <Link to={`/store/${store.id}`} className="me-auto">
          <Button variant="outline" size="sm"><ExternalLink className="h-4 w-4 ms-1" /> عرض المتجر</Button>
        </Link>
        <Link to="/seller/upgrade">
          <Button variant="gold" size="sm" className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white border-0">
            👑 ت€ة الباقة
          </Button>
        </Link>
        <Link to="/seller/promote">
          <Button variant="outline" size="sm"><Megaphone className="h-4 w-4 ms-1" /> إعلانات</Button>
        </Link>
        <Button variant="outline" size="sm" onClick={() => setStoreDlg(true)}><Edit className="h-4 w-4 ms-1" /> تعديل المتجر</Button>
        <Button variant="gold" size="sm" onClick={() => { setEditProd(null); setProdDlg(true); }}><Plus className="h-4 w-4 ms-1" /> منتج</Button>
        <Button variant="gold" size="sm" onClick={() => setAiOpen(true)}><Wand2 className="h-4 w-4 ms-1" /> AI</Button>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid grid-cols-3 md:grid-cols-9 mb-6 h-auto">
          <TabsTrigger value="products" className="text-xs"><Package className="h-3 w-3 ms-1" />المنتجات</TabsTrigger>
          <TabsTrigger value="orders" className="text-xs"><TrendingUp className="h-3 w-3 ms-1" />الطلبات</TabsTrigger>
          <TabsTrigger value="promos" className="text-xs"><Tag className="h-3 w-3 ms-1" />العروض</TabsTrigger>
          <TabsTrigger value="rewards" className="text-xs"><Gift className="h-3 w-3 ms-1" />جوائز</TabsTrigger>
          <TabsTrigger value="anns" className="text-xs"><Megaphone className="h-3 w-3 ms-1" />إعلانات</TabsTrigger>
          <TabsTrigger value="support" className="text-xs"><MessageSquare className="h-3 w-3 ms-1" />دعم</TabsTrigger>
          <TabsTrigger value="reports" className="text-xs"><Flag className="h-3 w-3 ms-1" />بلاغات</TabsTrigger>
          <TabsTrigger value="reviews" className="text-xs"><Star className="h-3 w-3 ms-1" />تقييمات</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs"><SettingsIcon className="h-3 w-3 ms-1" />إعدادات</TabsTrigger>
        </TabsList>

        {/* PRODUCTS */}
        <TabsContent value="products">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-lg font-bold flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> منتجاتك ({products.length})</h2>
              <div className="flex gap-2">
                <Button variant="gold" size="sm" onClick={() => setAiOpen(true)}><Wand2 className="h-4 w-4 ms-1" /> AI</Button>
                <Button variant="outline" size="sm" onClick={() => { setEditProd(null); setProdDlg(true); }}><Plus className="h-4 w-4 ms-1" /> يدوي</Button>
              </div>
            </div>
            {products.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm mb-3">لا توجد منتجات بعد — ابدأ بإضافة أول منتج</p>
                <Button variant="gold" size="sm" onClick={() => { setEditProd(null); setProdDlg(true); }}><Plus className="h-4 w-4 ms-1" /> أضف منتج</Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {products.map((p) => (
                  <motion.div key={p.id} layout className={`relative rounded-xl border overflow-hidden ${p.visibility_status === "hidden_oos" ? "border-destructive/40 bg-destructive/5" : "border-border/50 bg-secondary/30"}`}>
                    <div className="aspect-video bg-muted overflow-hidden">
                      {p.images?.[0]
                        ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Package className="h-8 w-8" /></div>}
                    </div>
                    <div className="p-3">
                      <div className="font-medium text-sm truncate">{p.name}</div>
                      <div className="flex items-center justify-between mt-1 text-xs">
                        <span className="text-primary font-bold">{formatYER(p.price)}</span>
                        <span className={p.stock < 5 ? "text-destructive font-bold" : "text-muted-foreground"}>المخزون: {p.stock}</span>
                      </div>
                      {p.visibility_status === "hidden_oos" && <Badge variant="destructive" className="mt-2 text-[9px]">مخفي - نفذ</Badge>}
                      {p.is_featured && <Badge className="mt-2 text-[9px] bg-accent text-accent-foreground">⭐ مميز</Badge>}
                      <div className="flex gap-1 mt-2">
                        <Button variant="ghost" size="icon" onClick={() => { setEditProd(p); setProdDlg(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => toggleVisibility(p)}>
                          {p.is_active ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteProduct(p.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ORDERS */}
        <TabsContent value="orders">
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-accent" /> الطلبات الأخيرة</h2>
            {orders.length === 0 ? <div className="text-center py-12 text-sm text-muted-foreground">لا توجد طلبات</div> : (
              <div className="space-y-2">
                {orders.map((o) => (
                  <Link key={o.id} to={`/orders/${o.id}`} className="block p-3 rounded-lg bg-secondary/30 border border-border/50 hover:border-primary transition">
                    <div className="flex justify-between items-center">
                      <div><div className="font-cyber text-sm text-accent">{o.order_number}</div><div className="text-xs text-muted-foreground">{o.status}</div></div>
                      <span className="text-sm font-bold text-primary">{formatYER(o.total)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* PROMOTIONS */}
        <TabsContent value="promos">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2"><Tag className="h-5 w-5 text-accent" /> العروض ({promos.length})</h2>
              <Button variant="gold" size="sm" onClick={() => { setEditPromo(null); setPromoDlg(true); }}><Plus className="h-4 w-4 ms-1" /> عرض جديد</Button>
            </div>
            {promos.length === 0 ? <div className="text-center py-12 text-sm text-muted-foreground">لا توجد عروض بعد</div> : (
              <div className="grid sm:grid-cols-2 gap-3">
                {promos.map((p) => (
                  <div key={p.id} className="rounded-xl border border-border/50 overflow-hidden">
                    {p.image_url && <img src={p.image_url} className="w-full h-32 object-cover" />}
                    <div className="p-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1"><div className="font-bold">{p.title}</div><div className="text-xs text-muted-foreground line-clamp-2">{p.description}</div></div>
                        <Badge className="bg-accent text-accent-foreground">-{p.discount_pct}%</Badge>
                      </div>
                      <div className="flex gap-1 mt-2">
                        <Button variant="ghost" size="icon" onClick={() => { setEditPromo(p); setPromoDlg(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" onClick={async () => { await supabase.from("store_promotions").delete().eq("id", p.id); refresh(); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                        {p.is_active ? <Badge variant="outline" className="ms-auto text-[10px]">نشط</Badge> : <Badge variant="secondary" className="ms-auto text-[10px]">متوقف</Badge>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* REWARDS */}
        <TabsContent value="rewards">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2"><Gift className="h-5 w-5 text-accent" /> الجوائز والكوبونات ({rewards.length})</h2>
              <Button variant="gold" size="sm" onClick={() => { setEditRew(null); setRewDlg(true); }}><Plus className="h-4 w-4 ms-1" /> كوبون جديد</Button>
            </div>
            {rewards.length === 0 ? <div className="text-center py-12 text-sm text-muted-foreground">لا توجد كوبونات</div> : (
              <div className="space-y-2">
                {rewards.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="font-cyber text-accent text-base">{r.code}</div>
                      <div className="text-xs text-muted-foreground">{r.reward_type === "percent" ? `${r.value}%` : r.reward_type === "fixed" ? formatYER(r.value) : "🎁 هدية"}</div>
                      <Badge variant="outline" className="text-[10px]">{r.used_count}/{r.max_uses}</Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditRew(r); setRewDlg(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={async () => { await supabase.from("store_rewards").delete().eq("id", r.id); refresh(); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ANNOUNCEMENTS */}
        <TabsContent value="anns">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2"><Megaphone className="h-5 w-5 text-primary" /> الإعلانات ({anns.length})</h2>
              <Button variant="gold" size="sm" onClick={() => { setEditAnn(null); setAnnDlg(true); }}><Plus className="h-4 w-4 ms-1" /> إعلان جديد</Button>
            </div>
            {anns.length === 0 ? <div className="text-center py-12 text-sm text-muted-foreground">لا إعلانات</div> : (
              <div className="space-y-2">
                {anns.map((a) => (
                  <div key={a.id} className="p-3 rounded-lg bg-secondary/30 border border-border/50 flex gap-3">
                    {a.image_url && <img src={a.image_url} className="h-16 w-16 rounded object-cover" />}
                    <div className="flex-1"><div className="font-bold">{a.title}</div><div className="text-xs text-muted-foreground">{a.content}</div></div>
                    <div className="flex flex-col gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditAnn(a); setAnnDlg(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={async () => { await supabase.from("store_announcements").delete().eq("id", a.id); refresh(); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* SUPPORT */}
        <TabsContent value="support">
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" /> تذاكر الدعم ({tickets.length})</h2>
            {tickets.length === 0 ? <div className="text-center py-12 text-sm text-muted-foreground">لا تذاكر</div> : (
              <div className="space-y-2">
                {tickets.map((t) => (
                  <div key={t.id} className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <div className="font-bold text-sm">{t.subject}</div>
                        <div className="text-xs text-muted-foreground mt-1">{t.message}</div>
                        {t.reply && <div className="text-xs mt-2 p-2 rounded bg-primary/10 text-primary">ردك: {t.reply}</div>}
                      </div>
                      <Badge variant={t.status === "answered" ? "default" : "outline"}>{t.status}</Badge>
                    </div>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => replyTicket(t)}><Send className="h-3 w-3 ms-1" /> رد</Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass rounded-2xl p-6 mt-4">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Mail className="h-5 w-5 text-accent" /> رسائل التواصل ({contacts.length})</h2>
            {contacts.length === 0 ? <div className="text-center py-8 text-sm text-muted-foreground">لا رسائل</div> : (
              <div className="space-y-2">
                {contacts.map((c) => (
                  <div key={c.id} className={`p-3 rounded-lg border ${c.is_read ? "bg-secondary/30 border-border/50" : "bg-primary/5 border-primary/30"}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-sm">{c.name} {!c.is_read && <span className="text-[10px] text-primary">• جديد</span>}</div>
                        <div className="text-xs text-muted-foreground">{c.email} {c.phone && `• ${c.phone}`}</div>
                        <div className="text-xs mt-2">{c.message}</div>
                      </div>
                      {!c.is_read && <Button variant="ghost" size="sm" onClick={() => markContactRead(c.id)}>قرأت</Button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* REPORTS */}
        <TabsContent value="reports">
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Flag className="h-5 w-5 text-destructive" /> البلاغات ({reports.length})</h2>
            {reports.length === 0 ? <div className="text-center py-12 text-sm text-muted-foreground">لا بلاغات — متجرك بسمعة ممتازة! ✨</div> : (
              <div className="space-y-2">
                {reports.map((r) => (
                  <div key={r.id} className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                    <div className="flex justify-between items-start">
                      <div><div className="font-bold text-sm">{r.reason}</div><div className="text-xs text-muted-foreground mt-1">{r.details}</div></div>
                      <Badge variant={r.status === "resolved" ? "default" : "outline"}>{r.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* REVIEWS */}
        <TabsContent value="reviews">
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Star className="h-5 w-5 text-accent" /> تقييمات العملاء ({reviews.length})</h2>
            {reviews.length === 0 ? <div className="text-center py-12 text-sm text-muted-foreground">لا تقييمات بعد</div> : (
              <div className="space-y-2">
                {reviews.map((r) => (
                  <div key={r.id} className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground">{r.products?.name}</div>
                        <div className="flex items-center gap-1 my-1">
                          {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3 w-3 ${i < r.rating ? "fill-accent text-accent" : "text-muted"}`} />)}
                        </div>
                        <div className="text-sm">{r.comment}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* SETTINGS */}
        <TabsContent value="settings">
          <StoreSettingsPanel storeId={store.id} />
        </TabsContent>
      </Tabs>

      {/* DIALOGS */}
      <StoreSetupDialog open={storeDlg} onClose={() => setStoreDlg(false)} store={store} onSaved={() => refresh()} />
      <AIListingDialog open={aiOpen} onClose={() => setAiOpen(false)} onGenerated={handleAIGenerated} />
      <ProductDialog open={prodDlg} onClose={() => setProdDlg(false)} storeId={store.id} product={editProd} onSaved={() => { fireHero(editProd ? "✨ تم تحديث المنتج" : "🎉 منتج جديد منشور"); refresh(); }} />
      <PromotionDialog open={promoDlg} onClose={() => setPromoDlg(false)} storeId={store.id} promo={editPromo} onSaved={() => refresh()} />
      <AnnouncementDialog open={annDlg} onClose={() => setAnnDlg(false)} storeId={store.id} ann={editAnn} onSaved={() => refresh()} />
      <RewardDialog open={rewDlg} onClose={() => setRewDlg(false)} storeId={store.id} reward={editRew} onSaved={() => refresh()} />
    </>
  ));

};

export default SellerDashboard;
