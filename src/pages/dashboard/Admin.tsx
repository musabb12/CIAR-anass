import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import {
  Users, ShoppingBag, Wallet, Activity, AlertCircle, Shield, TrendingUp, Bike,
  CheckCircle2, XCircle, Pause, Search, Inbox, Ticket, Flag, MessageCircle,
  Ban, BadgeDollarSign, FileSearch, MessageSquare, LifeBuoy, HelpCircle,
  Mail, PhoneCall, MapPin, Smartphone, UserCircle, Clock, Hash, Plug,
  Plus, Trash2, Edit2, Eye, EyeOff, Briefcase, FileText
} from "lucide-react";
import IntegrationsManager from "@/components/admin/IntegrationsManager";
import HeroMediaManager from "@/components/admin/HeroMediaManager";
import AdminUsersPanel from "@/components/admin/AdminUsersPanel";
import StoresCommandCenter from "@/components/admin/StoresCommandCenter";
import OrdersCommandCenter from "@/components/admin/OrdersCommandCenter";
import WalletsCommandCenter from "@/components/admin/WalletsCommandCenter";
import StoreControlCenter from "@/components/admin/StoreControlCenter";
import { supabase } from "@/integrations/supabase/client";
import { formatYER } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminChatThread from "@/components/admin-chat/AdminChatThread";
import { toast } from "sonner";

const STATUS_BADGE: Record<string, string> = {
  open: "bg-primary/20 text-primary",
  in_progress: "bg-accent/20 text-accent",
  resolved: "bg-green-500/20 text-green-400",
  closed: "bg-muted text-muted-foreground",
};

const KIND_LABEL: Record<string, string> = {
  contact: "تواصل", support: "دعم", ticket: "تذكرة", complaint: "شكوى", report: "بلاغ", help: "مساعدة",
};

const KIND_ICON: Record<string, any> = {
  contact: MessageCircle,
  support: LifeBuoy,
  ticket: Ticket,
  complaint: AlertCircle,
  report: Flag,
  help: HelpCircle,
};

const KIND_FILTERS = [
  { key: "all", label: "الكل" },
  { key: "contact", label: "تواصل" },
  { key: "support", label: "دعم" },
  { key: "ticket", label: "تذاكر" },
  { key: "complaint", label: "شكاوى" },
  { key: "report", label: "بلاغات" },
  { key: "help", label: "مساعدة" },
];

const getDeviceInfo = (channel: any) => {
  const meta = channel?.metadata || {};
  const ua = meta.userAgent || meta.user_agent || "غير معروف";
  const platform = meta.platform || meta.device || (ua.includes("Mobile") ? "هاتف" : "متصفح");
  return { ua, platform, location: meta.location || meta.city || channel?.profiles?.city || "غير محدد" };
};

const AdminDashboard = () => {
  // ==== overview counts ====
  const [counts, setCounts] = useState({ users: 0, stores: 0, orders: 0, products: 0, pilots: 0, pending_stores: 0, open_channels: 0 });
  const [revenue, setRevenue] = useState(0);

  // ==== data ====
  const [pendingStores, setPendingStores] = useState<any[]>([]);
  const [allStores, setAllStores] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [activeChannel, setActiveChannel] = useState<any | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [channelKind, setChannelKind] = useState("all");
  const [channelQ, setChannelQ] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [delDlg, setDelDlg] = useState<{ open: boolean; mode: "one" | "bulk" | "kind"; channel?: any }>({ open: false, mode: "one" });
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("approvals");


  // search
  const [userQ, setUserQ] = useState("");
  const [storeQ, setStoreQ] = useState("");

  // dialogs
  const [rejectDlg, setRejectDlg] = useState<{ open: boolean; store?: any; reason: string }>({ open: false, reason: "" });
  const [adjustDlg, setAdjustDlg] = useState<{ open: boolean; user?: any; amount: string; reason: string }>({ open: false, amount: "", reason: "" });
  const [banDlg, setBanDlg] = useState<{ open: boolean; user?: any; reason: string; days: string }>({ open: false, reason: "", days: "" });

  // == New Dynamic Content Management Dialogs States ==
  const [productDlg, setProductDlg] = useState<{ open: boolean; mode: "add" | "edit"; data?: any }>({ open: false, mode: "add" });
  const [productForm, setProductForm] = useState({ name: "", price: "", stock: "", store_id: "", visibility_status: "visible" });

  const [jobDlg, setJobDlg] = useState<{ open: boolean; mode: "add" | "edit"; data?: any }>({ open: false, mode: "add" });
  const [jobForm, setJobForm] = useState({ title: "", company_name: "", city: "", description: "", requirements: "" });

  const [appsDlg, setAppsDlg] = useState<{ open: boolean; job?: any; list: any[] }>({ open: false, list: [] });

  const refresh = async () => {
    const [u, s, o, p, pi, sp, ch, ord, st, us, wa, prods, jb, acts] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("stores").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("total"),
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "pilot"),
      supabase.from("stores").select("id", { count: "exact", head: true }).eq("approval_status", "pending"),
      supabase.from("admin_channels").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("stores").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("profiles").select("*, user_roles(role)").order("created_at", { ascending: false }).limit(50),
      supabase.from("wallets").select("*, profiles!inner(full_name, phone)").order("balance", { ascending: false }).limit(30),
      supabase.from("products").select("*, stores(name)").order("created_at", { ascending: false }).limit(30),
      supabase.from("jobs").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("admin_actions").select("*").order("created_at", { ascending: false }).limit(30),
    ]);
    setCounts({
      users: u.count ?? 0, stores: s.count ?? 0, orders: o.data?.length ?? 0,
      products: p.count ?? 0, pilots: pi.count ?? 0,
      pending_stores: sp.count ?? 0, open_channels: ch.count ?? 0,
    });
    setRevenue((o.data ?? []).reduce((a: number, x: any) => a + Number(x.total || 0), 0));
    setOrders(ord.data ?? []);
    setAllStores(st.data ?? []);
    setPendingStores((st.data ?? []).filter((x: any) => x.approval_status === "pending"));
    setUsers(us.data ?? []);
    setWallets(wa.data ?? []);
    setProducts(prods.data ?? []);
    setJobs(jb.data ?? []);
    setActions(acts.data ?? []);
  };

  const loadChannels = async () => {
    const { data, error } = await supabase
      .from("admin_channels")
      .select("*")
      .order("last_message_at", { ascending: false })
      .limit(80);
    if (error) {
      console.error("[admin] loadChannels error:", error);
      toast.error("تعذّر تحميل المحادثات: " + error.message);
      setChannels([]);
      return;
    }
    const list = data ?? [];
    const userIds = Array.from(new Set(list.map((c: any) => c.user_id).filter(Boolean)));
    let profilesMap: Record<string, any> = {};
    if (userIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, phone, city, avatar_url")
        .in("id", userIds);
      profilesMap = Object.fromEntries((profs ?? []).map((p: any) => [p.id, p]));
    }
    const ids = list.map((c: any) => c.id);
    let lastMsgs: Record<string, any> = {};
    if (ids.length) {
      const { data: msgs } = await supabase
        .from("admin_messages")
        .select("channel_id, body, created_at, sender_role")
        .in("channel_id", ids)
        .order("created_at", { ascending: false })
        .limit(200);
      (msgs ?? []).forEach((m: any) => {
        if (!lastMsgs[m.channel_id]) lastMsgs[m.channel_id] = m;
      });
    }
    setChannels(list.map((c: any) => ({
      ...c,
      profiles: profilesMap[c.user_id] || null,
      last_message: lastMsgs[c.id] || null,
    })));
  };

  useEffect(() => { refresh(); loadChannels(); }, []);

  useEffect(() => {
    const ch = supabase.channel("admin_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_channels" }, loadChannels)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "stores" }, refresh)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // ==== actions ====
  const approveStore = async (storeId: string) => {
    const { error } = await supabase.rpc("admin_approve_store", { _store_id: storeId, _approve: true, _reason: null });
    if (error) return toast.error(error.message);
    toast.success("تم اعتماد المتجر ونشره");
    refresh();
  };

  const rejectStore = async () => {
    if (!rejectDlg.store || !rejectDlg.reason.trim()) return;
    const { error } = await supabase.rpc("admin_approve_store", { _store_id: rejectDlg.store.id, _approve: false, _reason: rejectDlg.reason });
    if (error) return toast.error(error.message);
    toast.success("تم رفض المتجر");
    setRejectDlg({ open: false, reason: "" });
    refresh();
  };

  const toggleSuspend = async (s: any) => {
    const { error } = await supabase.from("stores").update({ suspended: !s.suspended, suspended_reason: s.suspended ? null : "تعليق إداري" } as any).eq("id", s.id);
    if (error) return toast.error(error.message);
    toast.success(s.suspended ? "أُعيد تفعيل المتجر" : "تم تعليق المتجر");
    refresh();
  };

  const adjustWallet = async () => {
    if (!adjustDlg.user) return;
    const amt = Number(adjustDlg.amount);
    if (!amt || !adjustDlg.reason.trim()) return toast.error("أدخل المبلغ والسبب");
    const { error } = await supabase.rpc("admin_adjust_wallet", {
      _user_id: adjustDlg.user.user_id, _amount: amt, _reason: adjustDlg.reason,
    });
    if (error) return toast.error(error.message);
    toast.success("تم تعديل الرصيد");
    setAdjustDlg({ open: false, amount: "", reason: "" });
    refresh();
  };

  const banUser = async () => {
    if (!banDlg.user) return;
    const days = Number(banDlg.days) || 0;
    const until = days > 0 ? new Date(Date.now() + days * 86400000).toISOString() : null;
    const { error } = await supabase.rpc("admin_ban_user", {
      _user_id: banDlg.user.id, _reason: banDlg.reason, _until: until as any,
    });
    if (error) return toast.error(error.message);
    toast.success("تم حظر المستخدم");
    setBanDlg({ open: false, reason: "", days: "" });
  };

  const setChannelStatus = async (channelId: string, status: string) => {
    const { error } = await supabase.rpc("admin_close_channel", { _channel_id: channelId, _status: status as any });
    if (error) return toast.error(error.message);
    toast.success("تم تحديث الحالة");
    setActiveChannel((current: any) => current?.id === channelId ? { ...current, status } : current);
    loadChannels();
  };

  const toggleSelectChannel = (id: string) =>
    setSelectedChannels((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      if (delDlg.mode === "one" && delDlg.channel) {
        const { error } = await supabase.rpc("admin_delete_channel" as any, { _channel_id: delDlg.channel.id });
        if (error) throw error;
        setChannels((prev) => prev.filter((c) => c.id !== delDlg.channel.id));
        setActiveChannel((cur: any) => cur?.id === delDlg.channel.id ? null : cur);
        toast.success("تم حذف المحادثة نهائياً");
      } else {
        const ids = delDlg.mode === "bulk" ? selectedChannels : filteredChannels.map((c: any) => c.id);
        if (!ids.length) { toast.error("لا توجد عناصر للحذف"); return; }
        const { error } = await supabase.rpc("admin_delete_channels_bulk" as any, { _ids: ids });
        if (error) throw error;
        setChannels((prev) => prev.filter((c) => !ids.includes(c.id)));
        setActiveChannel((cur: any) => cur && ids.includes(cur.id) ? null : cur);
        setSelectedChannels([]);
        toast.success(`تم حذف ${ids.length} عنصراً نهائياً`);
      }
      setDelDlg({ open: false, mode: "one" });
      loadChannels();
    } catch (e: any) {
      toast.error(e?.message === "not_authorized" ? "غير مصرح" : (e?.message ?? "تعذّر الحذف"));
    } finally {
      setDeleting(false);
    }
  };

  // ==== New Dynamic Engine Actions ====


  // Products CRUD Handlers
  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.price) return toast.error("يرجى ملء الحقول الأساسية");
    const payload = {
      name: productForm.name,
      price: Number(productForm.price),
      stock: Number(productForm.stock || 0),
      store_id: productForm.store_id || null,
      visibility_status: productForm.visibility_status
    };

    let error;
    if (productDlg.mode === "add") {
      ({ error } = await supabase.from("products").insert([payload]));
    } else {
      ({ error } = await supabase.from("products").update(payload).eq("id", productDlg.data.id));
    }

    if (error) return toast.error(error.message);
    toast.success(productDlg.mode === "add" ? "تم إضافة المنتج بنجاح" : "تم تحديث المنتج بنجاح");
    setProductDlg({ open: false, mode: "add" });
    refresh();
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج نهائياً؟")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم حذف المنتج بنجاح");
    refresh();
  };

  const handleToggleProductVisibility = async (p: any) => {
    const nextStatus = p.visibility_status === "visible" ? "hidden" : "visible";
    const { error } = await supabase.from("products").update({ visibility_status: nextStatus }).eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success(`تم تغيير حالة العرض إلى: ${nextStatus === "visible" ? "مرئي" : "مخفي"}`);
    refresh();
  };

  // Jobs CRUD Handlers
  const handleSaveJob = async () => {
    if (!jobForm.title || !jobForm.company_name) return toast.error("يرجى ملء الحقول الأساسية للوظيفة");
    const payload = {
      title: jobForm.title,
      company_name: jobForm.company_name,
      city: jobForm.city || "صنعاء",
      description: jobForm.description,
      requirements: jobForm.requirements,
      posted_by: (await supabase.auth.getUser()).data.user?.id ?? "",
    };

    let error;
    if (jobDlg.mode === "add") {
      ({ error } = await supabase.from("jobs").insert([payload]));
    } else {
      ({ error } = await supabase.from("jobs").update(payload).eq("id", jobDlg.data.id));
    }

    if (error) return toast.error(error.message);
    toast.success(jobDlg.mode === "add" ? "تم نشر الفرصة الوظيفية" : "تم تحديث الوظيفة بنجاح");
    setJobDlg({ open: false, mode: "add" });
    refresh();
  };

  const handleDeleteJob = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الوظيفة نهائياً؟")) return;
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم إزالة الوظيفة بنجاح");
    refresh();
  };

  // Applications Handlers
  const handleViewApplications = async (job: any) => {
    const { data, error } = await supabase
      .from("job_applications")
      .select("*, profiles(full_name, phone)")
      .eq("job_id", job.id)
      .order("created_at", { ascending: false });

    if (error) return toast.error("تعذر جلب طلبات التوظيف: " + error.message);
    setAppsDlg({ open: true, job, list: data || [] });
  };

  const handleUpdateAppStatus = async (appId: string, status: string) => {
    const { error } = await supabase.from("job_applications").update({ status: status as any }).eq("id", appId);
    if (error) return toast.error(error.message);
    toast.success("تم تحديث حالة طلب التوظيف");
    setAppsDlg(prev => ({
      ...prev,
      list: prev.list.map(a => a.id === appId ? { ...a, status } : a)
    }));
    refresh();
  };

  const filteredUsers = users.filter(u => !userQ || u.full_name?.includes(userQ) || u.phone?.includes(userQ));
  const filteredStores = allStores.filter(s => !storeQ || s.name?.includes(storeQ));
  const filteredChannels = channels.filter((c) => {
    const matchesKind =
      channelKind === "all" ? true :
      channelKind === "contact" ? (c.kind === "contact" || c.kind === "support") :
      c.kind === channelKind;
    const q = channelQ.trim().toLowerCase();
    const profile = (c as any).profiles || {};
    const matchesQuery = !q || [c.subject, c.user_id, profile.full_name, profile.phone, profile.city].some((v) => String(v || "").toLowerCase().includes(q));
    return matchesKind && matchesQuery;
  });

  const stats = [
    { icon: Users,        label: "المستخدمون",   value: counts.users.toLocaleString(), c: "primary" },
    { icon: ShoppingBag,  label: "متاجر نشطة",   value: counts.stores.toLocaleString(), c: "accent" },
    { icon: Inbox,        label: "متاجر للمراجعة", value: counts.pending_stores.toLocaleString(), c: "primary", urgent: counts.pending_stores > 0 },
    { icon: MessageCircle,label: "محادثات مفتوحة", value: counts.open_channels.toLocaleString(), c: "accent", urgent: counts.open_channels > 0 },
    { icon: Bike,         label: "السائقون",      value: counts.pilots.toLocaleString(), c: "primary" },
    { icon: Wallet,       label: "حجم التداول",   value: formatYER(revenue), c: "accent" },
  ];

  return (
    <DashboardShell role="admin" title="🛡️ مركز التحكم المركزي" subtitle="تحكم كامل بالمنصة، الموافقات، المالية، والتواصل.">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {stats.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className={`glass rounded-xl p-4 ${s.urgent ? "border-accent/60 ring-1 ring-accent/30" : ""}`}>
            <s.icon className={`mb-2 h-5 w-5 ${s.c === "accent" ? "text-accent" : "text-primary"}`} />
            <div className="font-cyber text-base font-bold">{s.value}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 lg:grid-cols-12 mb-5">
          <TabsTrigger value="integrations" className="text-[11px] bg-primary/15 text-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground ring-1 ring-primary/40">
            <Plug className="h-3.5 w-3.5 ms-1" /> التكاملات
          </TabsTrigger>
          <TabsTrigger value="approvals" className="text-[11px]">
            <Inbox className="h-3.5 w-3.5 ms-1" /> الموافقات
            {counts.pending_stores > 0 && <Badge className="ms-1 h-4 px-1 bg-accent text-accent-foreground text-[9px]">{counts.pending_stores}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="channels" className="text-[11px]">
            <MessageSquare className="h-3.5 w-3.5 ms-1" /> التواصل
            {counts.open_channels > 0 && <Badge className="ms-1 h-4 px-1 bg-accent text-accent-foreground text-[9px]">{counts.open_channels}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="users" className="text-[11px]"><Users className="h-3.5 w-3.5 ms-1" /> المستخدمون</TabsTrigger>
          <TabsTrigger value="stores" className="text-[11px]"><ShoppingBag className="h-3.5 w-3.5 ms-1" /> المتاجر</TabsTrigger>
          <TabsTrigger value="store-control" className="text-[11px] bg-accent/15 text-accent data-[state=active]:bg-accent data-[state=active]:text-accent-foreground ring-1 ring-accent/40">
            <ShoppingBag className="h-3.5 w-3.5 ms-1" /> لوحات المتاجر
          </TabsTrigger>

          <TabsTrigger value="wallets" className="text-[11px]"><Wallet className="h-3.5 w-3.5 ms-1" /> المحافظ</TabsTrigger>
          <TabsTrigger value="orders" className="text-[11px]"><TrendingUp className="h-3.5 w-3.5 ms-1" /> الطلبات</TabsTrigger>
          <TabsTrigger value="content" className="text-[11px]"><FileSearch className="h-3.5 w-3.5 ms-1" /> المحتوى</TabsTrigger>
          <TabsTrigger value="hero" className="text-[11px]"><Activity className="h-3.5 w-3.5 ms-1" /> الواجهة</TabsTrigger>
          <TabsTrigger value="security" className="text-[11px]"><Shield className="h-3.5 w-3.5 ms-1" /> الأمان</TabsTrigger>
          <TabsTrigger value="logs" className="text-[11px]"><Activity className="h-3.5 w-3.5 ms-1" /> السجل</TabsTrigger>
        </TabsList>


        {/* === APPROVALS === */}
        <TabsContent value="approvals">
          <div className="glass rounded-2xl p-5">
            <h2 className="font-bold mb-4 flex items-center gap-2"><Inbox className="h-5 w-5 text-accent" /> متاجر بانتظار الموافقة</h2>
            {pendingStores.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground">✅ لا توجد متاجر بانتظار المراجعة</div>
            ) : (
              <div className="space-y-3">
                {pendingStores.map((s) => (
                  <motion.div key={s.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    className="border border-border/50 rounded-xl p-4 flex items-start gap-4">
                    {s.logo_url ? (
                      <img src={s.logo_url} className="h-16 w-16 rounded-xl object-cover" alt={s.name} />
                    ) : (
                      <div className="h-16 w-16 rounded-xl bg-secondary/40 flex items-center justify-center">
                        <ShoppingBag className="h-7 w-7 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold">{s.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{s.description || "بدون وصف"}</p>
                      <div className="flex gap-3 text-[11px] text-muted-foreground mt-1.5">
                        <span>📍 {s.city || "غير محدد"}</span>
                        <span>📞 {s.phone || "—"}</span>
                        <span>🕐 {new Date(s.created_at).toLocaleDateString("ar")}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button size="sm" variant="hero" onClick={() => approveStore(s.id)}>
                        <CheckCircle2 className="h-3.5 w-3.5 ms-1" /> اعتماد
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setRejectDlg({ open: true, store: s, reason: "" })}>
                        <XCircle className="h-3.5 w-3.5 ms-1" /> رفض
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* === CHANNELS === */}
        <TabsContent value="channels">
          <div className="grid grid-cols-1 xl:grid-cols-[420px_minmax(0,1fr)] gap-4">
            <div className={`${activeChannel ? "hidden xl:block" : "block"} glass rounded-2xl p-4 min-w-0`}>
              <div className="flex flex-col gap-3 mb-4">
                <h2 className="font-bold flex items-center gap-2"><MessageSquare className="h-5 w-5 text-accent" /> مركز الرد المباشر</h2>
                <div className="relative">
                  <Search className="absolute top-1/2 -translate-y-1/2 start-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input value={channelQ} onChange={(e) => setChannelQ(e.target.value)} placeholder="ابحث بالاسم، المعرف، الموقع أو الموضوع..." className="ps-8 h-9" />
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {KIND_FILTERS.map((f) => (
                    <Button key={f.key} size="sm" variant={channelKind === f.key ? "hero" : "outline"} onClick={() => setChannelKind(f.key)} className="h-8 px-1 text-[10px]">
                      {f.label}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap rounded-xl border border-destructive/25 bg-destructive/5 p-2">
                  <Shield className="h-3.5 w-3.5 text-destructive shrink-0" />
                  <span className="text-[10px] text-muted-foreground me-auto">أدوات الحذف النهائي</span>
                  <Button
                    size="sm" variant="outline"
                    className="h-7 px-2 text-[10px]"
                    onClick={() => setSelectedChannels(selectedChannels.length === filteredChannels.length ? [] : filteredChannels.map((c: any) => c.id))}
                  >
                    {selectedChannels.length === filteredChannels.length && filteredChannels.length > 0 ? "إلغاء التحديد" : "تحديد الكل"}
                  </Button>
                  <Button
                    size="sm" variant="destructive"
                    className="h-7 px-2 text-[10px]"
                    disabled={selectedChannels.length === 0}
                    onClick={() => setDelDlg({ open: true, mode: "bulk" })}
                  >
                    <Trash2 className="h-3 w-3 ms-1" /> حذف المحدد ({selectedChannels.length})
                  </Button>
                  <Button
                    size="sm" variant="destructive"
                    className="h-7 px-2 text-[10px]"
                    disabled={filteredChannels.length === 0}
                    onClick={() => setDelDlg({ open: true, mode: "kind" })}
                  >
                    <Trash2 className="h-3 w-3 ms-1" /> حذف كل «{KIND_FILTERS.find((f) => f.key === channelKind)?.label}»
                  </Button>
                </div>

              </div>
              <div className="space-y-2 max-h-[min(70vh,720px)] overflow-y-auto pe-1">
                {filteredChannels.length === 0 ? (
                  <div className="text-center py-10 text-sm text-muted-foreground">لا توجد محادثات بهذا التصنيف</div>
                ) : filteredChannels.map((c) => {
                  const Icon = KIND_ICON[c.kind] || Mail;
                  const profile = (c as any).profiles || {};
                  const device = getDeviceInfo(c);
                  return (
                    <div key={c.id} role="button" tabIndex={0} onClick={() => setActiveChannel(c)}
                      onKeyDown={(e) => { if (e.key === "Enter") setActiveChannel(c); }}
                      className={`w-full flex items-start gap-3 p-3 rounded-lg border transition text-start cursor-pointer ${activeChannel?.id === c.id ? "bg-primary/15 border-primary/50" : "bg-secondary/30 border-border/40 hover:bg-secondary/50"}`}>
                      <input
                        type="checkbox"
                        checked={selectedChannels.includes(c.id)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => toggleSelectChannel(c.id)}
                        className="mt-1 h-4 w-4 accent-destructive shrink-0 cursor-pointer"
                        aria-label="تحديد للحذف"
                      />
                      <div className="h-10 w-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm truncate">{c.subject}</span>
                          {c.unread_for_admin > 0 && <Badge className="bg-accent text-accent-foreground h-5 min-w-5 px-1.5 text-[10px]">{c.unread_for_admin}</Badge>}
                        </div>
                        <div className="grid grid-cols-1 gap-1 text-[10px] text-muted-foreground">
                          <span className="truncate"><UserCircle className="inline h-3 w-3 ms-1" />{profile.full_name || "مستخدم"} — {profile.phone || "لا يوجد هاتف"}</span>
                          <span className="truncate"><Smartphone className="inline h-3 w-3 ms-1" />{device.platform} • <MapPin className="inline h-3 w-3 mx-1" />{device.location}</span>
                        </div>
                        {(c as any).last_message?.body && (
                          <div className="text-[11px] text-foreground/80 truncate mt-1">
                            {(c as any).last_message.sender_role === "admin" ? "↩︎ " : "💬 "}
                            {(c as any).last_message.body}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <Badge variant="outline" className="h-4 px-1 text-[9px]">{KIND_LABEL[c.kind]}</Badge>
                          <Badge className={`h-4 px-1 text-[9px] ${STATUS_BADGE[c.status]}`}>{c.status}</Badge>
                          <span className="text-[10px] text-muted-foreground"><Clock className="inline h-3 w-3 ms-0.5" />{new Date(c.last_message_at).toLocaleString("ar")}</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDelDlg({ open: true, mode: "one", channel: c }); }}
                        title="حذف نهائي"
                        className="shrink-0 h-8 w-8 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition flex items-center justify-center"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );

                })}
              </div>
            </div>

            <div className={`${activeChannel ? "block" : "hidden xl:block"} glass rounded-2xl p-4 min-w-0`}>
              {activeChannel ? (
                <div className="space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Button variant="ghost" size="sm" onClick={() => setActiveChannel(null)} className="xl:hidden mb-2">← عودة للقائمة</Button>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="outline"><Hash className="h-3 w-3 ms-1" />{activeChannel.user_id}</Badge>
                        <Badge variant="outline">{KIND_LABEL[activeChannel.kind]}</Badge>
                        <Badge className={STATUS_BADGE[activeChannel.status]}>{activeChannel.status}</Badge>
                      </div>
                      <h2 className="font-bold text-xl truncate">{activeChannel.subject}</h2>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <span><UserCircle className="inline h-4 w-4 ms-1 text-primary" />{(activeChannel as any).profiles?.full_name || "مستخدم بدون اسم"}</span>
                        <span><Mail className="inline h-4 w-4 ms-1 text-primary" />{activeChannel.metadata?.email || "البريد غير متوفر"}</span>
                        <span><PhoneCall className="inline h-4 w-4 ms-1 text-accent" />{(activeChannel as any).profiles?.phone || "لا يوجد هاتف"}</span>
                        <span><MapPin className="inline h-4 w-4 ms-1 text-accent" />{getDeviceInfo(activeChannel).location}</span>
                        <span className="md:col-span-2 truncate"><Smartphone className="inline h-4 w-4 ms-1" />{getDeviceInfo(activeChannel).platform} — {getDeviceInfo(activeChannel).ua}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap lg:justify-end">
                      <Select value={activeChannel.status} onValueChange={(v) => setChannelStatus(activeChannel.id, v)}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">مفتوحة</SelectItem>
                          <SelectItem value="in_progress">قيد المعالجة</SelectItem>
                          <SelectItem value="resolved">تم الحل</SelectItem>
                          <SelectItem value="closed">مغلقة</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" onClick={() => setChannelStatus(activeChannel.id, "closed")}><XCircle className="h-4 w-4" /> رفض/إغلاق</Button>
                      <Button variant="destructive" onClick={() => setDelDlg({ open: true, mode: "one", channel: activeChannel })}>
                        <Trash2 className="h-4 w-4 ms-1" /> حذف نهائي
                      </Button>

                    </div>
                  </div>
                  <AdminChatThread channelId={activeChannel.id} isAdmin />
                </div>
              ) : (
                <div className="h-[520px] flex flex-col items-center justify-center text-center text-muted-foreground gap-3">
                  <MessageCircle className="h-12 w-12 text-primary" />
                  <div className="font-bold text-foreground">اختر محادثة للرد فوراً</div>
                  <p className="text-sm max-w-sm">كل تذكرة أو شكوى أو بلاغ تظهر هنا، وعند فتحها تظهر نافذة الدردشة والمكالمات والمرفقات.</p>
                </div>
              )}
            </div>
          </div>

          <Dialog open={delDlg.open} onOpenChange={(o) => !deleting && setDelDlg({ ...delDlg, open: o })}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <Trash2 className="h-5 w-5" /> تأكيد الحذف النهائي
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  {delDlg.mode === "one"
                    ? `سيتم حذف المحادثة «${delDlg.channel?.subject ?? ""}» وجميع رسائلها ومرفقاتها نهائياً.`
                    : delDlg.mode === "bulk"
                      ? `سيتم حذف ${selectedChannels.length} محادثة محددة وجميع رسائلها نهائياً.`
                      : `سيتم حذف كل عناصر تصنيف «${KIND_FILTERS.find((f) => f.key === channelKind)?.label}» الظاهرة (${filteredChannels.length}) نهائياً.`}
                </p>
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-[12px] text-destructive">
                  لا يمكن التراجع عن هذا الإجراء.
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" disabled={deleting} onClick={() => setDelDlg({ open: false, mode: "one" })}>إلغاء</Button>
                <Button variant="destructive" disabled={deleting} onClick={confirmDelete}>
                  {deleting ? "جارٍ الحذف..." : "حذف نهائياً"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>


        {/* === USERS === */}
        <TabsContent value="users">
          <div className="glass rounded-2xl p-5">
            <AdminUsersPanel />
          </div>
        </TabsContent>

        {/* === STORES === */}
        <TabsContent value="stores">
          <StoresCommandCenter />
        </TabsContent>

        {/* === STORE DASHBOARDS CONTROL === */}
        <TabsContent value="store-control">
          <StoreControlCenter />
        </TabsContent>


        {/* === WALLETS === */}
        <TabsContent value="wallets">
          <WalletsCommandCenter />
        </TabsContent>

        {/* === ORDERS === */}
        <TabsContent value="orders">
          <OrdersCommandCenter />
        </TabsContent>


        {/* === CONTENT (products + jobs Dynamic Engine) === */}
        <TabsContent value="content">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Products Control Panel */}
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold flex items-center gap-2"><FileSearch className="h-4 w-4 text-primary" /> إدارة المنتجات</h2>
                <Button size="sm" variant="hero" onClick={() => {
                  setProductForm({ name: "", price: "", stock: "", store_id: allStores[0]?.id || "", visibility_status: "visible" });
                  setProductDlg({ open: true, mode: "add" });
                }}>
                  <Plus className="h-3.5 w-3.5 ms-1" /> إضافة منتج
                </Button>
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pe-1">
                {products.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30 text-xs border border-border/20">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate text-foreground">{p.name}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {p.stores?.name || "بدون متجر"} • <span className="font-cyber text-accent">{formatYER(p.price)}</span> • مخزون ({p.stock})
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 ms-2">
                      <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-secondary" onClick={() => handleToggleProductVisibility(p)}>
                        {p.visibility_status === "visible" ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-destructive" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-secondary" onClick={() => {
                        setProductForm({ name: p.name, price: String(p.price), stock: String(p.stock), store_id: p.store_id || "", visibility_status: p.visibility_status || "visible" });
                        setProductDlg({ open: true, mode: "edit", data: p });
                      }}>
                        <Edit2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-destructive/10" onClick={() => handleDeleteProduct(p.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Jobs Control Panel */}
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold flex items-center gap-2"><Briefcase className="h-4 w-4 text-accent" /> إدارة الوظائف</h2>
                <Button size="sm" variant="hero" onClick={() => {
                  setJobForm({ title: "", company_name: "", city: "صنعاء", description: "", requirements: "" });
                  setJobDlg({ open: true, mode: "add" });
                }}>
                  <Plus className="h-3.5 w-3.5 ms-1" /> إضافة وظيفة
                </Button>
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pe-1">
                {jobs.map((j) => (
                  <div key={j.id} className="p-3 rounded-lg bg-secondary/30 text-xs border border-border/20">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-foreground text-sm">{j.title}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{j.company_name} • {j.city || "صنعاء"}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-secondary" onClick={() => {
                          setJobForm({ title: j.title, company_name: j.company_name, city: j.city || "صنعاء", description: j.description || "", requirements: j.requirements || "" });
                          setJobDlg({ open: true, mode: "edit", data: j });
                        }}>
                          <Edit2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-destructive/10" onClick={() => handleDeleteJob(j.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-border/30 pt-2 mt-2">
                      <Button variant="link" size="sm" className="h-auto p-0 text-accent text-[11px] font-medium" onClick={() => handleViewApplications(j)}>
                        <FileText className="h-3 w-3 ms-1 inline" /> المتقدمون ({j.applications_count || 0})
                      </Button>
                      <span className="text-[9px] text-muted-foreground">{new Date(j.created_at).toLocaleDateString("ar")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* === HERO MEDIA === */}
        <TabsContent value="hero">
          <div className="glass rounded-2xl p-5">
            <HeroMediaManager />
          </div>
        </TabsContent>

        {/* === INTEGRATIONS === */}
        <TabsContent value="integrations">
          <div className="glass rounded-2xl p-5">
            <IntegrationsManager />
          </div>
        </TabsContent>

        {/* === SECURITY === */}
        <TabsContent value="security">
          {/* Security controls code can remain here */}
        </TabsContent>

        {/* === LOGS === */}
        <TabsContent value="logs">
          <div className="glass rounded-2xl p-5">
            <h2 className="font-bold mb-4 flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> سجل العمليات الإدارية</h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {actions.map((a: any) => (
                <div key={a.id} className="text-xs p-2.5 rounded-lg bg-secondary/20 border border-border/30">
                  <div className="flex justify-between font-bold text-foreground">
                    <span>{a.action_type}</span>
                    <span className="font-cyber text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleString("ar")}</span>
                  </div>
                  <p className="text-muted-foreground mt-1 text-[11px]">{a.description}</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ==== STANDARD DIALOGS (Reject, Adjust, Ban) ==== */}
      <Dialog open={rejectDlg.open} onOpenChange={(o) => setRejectDlg(p => ({ ...p, open: o }))}>
        <DialogContent className="glass">
          <DialogHeader><DialogTitle>سبب رفض المتجر</DialogTitle></DialogHeader>
          <Textarea value={rejectDlg.reason} onChange={(e) => setRejectDlg(p => ({ ...p, reason: e.target.value }))} placeholder="اكتب سبب الرفض هنا ليتم إشعار صاحب المتجر..." rows={3} />
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setRejectDlg({ open: false, reason: "" })}>إلغاء</Button>
            <Button variant="hero" size="sm" onClick={rejectStore}>تأكيد الرفض</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={adjustDlg.open} onOpenChange={(o) => setAdjustDlg(p => ({ ...p, open: o }))}>
        <DialogContent className="glass">
          <DialogHeader><DialogTitle>تعديل رصيد المحفظة</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">تعديل رصيد الحساب المالي للمستخدم: <b className="text-foreground">{adjustDlg.user?.name}</b></div>
            <Input type="number" value={adjustDlg.amount} onChange={(e) => setAdjustDlg(p => ({ ...p, amount: e.target.value }))} placeholder="المبلغ (مثال: 5000 أو -3000 لخصم الرصيد)" />
            <Input value={adjustDlg.reason} onChange={(e) => setAdjustDlg(p => ({ ...p, reason: e.target.value }))} placeholder="السبب الإداري للتعديل..." />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setAdjustDlg({ open: false, amount: "", reason: "" })}>إلغاء</Button>
            <Button variant="hero" size="sm" onClick={adjustWallet}>تحديث الرصيد</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={banDlg.open} onOpenChange={(o) => setBanDlg(p => ({ ...p, open: o }))}>
        <DialogContent className="glass">
          <DialogHeader><DialogTitle>حظر مستخدم</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input type="number" value={banDlg.days} onChange={(e) => setBanDlg(p => ({ ...p, days: e.target.value }))} placeholder="عدد الأيام (0 للحظر الدائم)" />
            <Input value={banDlg.reason} onChange={(e) => setBanDlg(p => ({ ...p, reason: e.target.value }))} placeholder="سبب الحظر..." />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setBanDlg({ open: false, reason: "", days: "" })}>إلغاء</Button>
            <Button variant="hero" size="sm" onClick={banUser}>تأكيد الحظر</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =======================================================
          ==== NEW SYSTEMS DIALOGS (PRODUCTS / JOBS / APPS) ====
         ======================================================= */}

      {/* 1. Product Manager Dialog */}
      <Dialog open={productDlg.open} onOpenChange={(o) => setProductDlg(p => ({ ...p, open: o }))}>
        <DialogContent className="glass max-w-md">
          <DialogHeader>
            <DialogTitle>{productDlg.mode === "add" ? "إضافة منتج جديد للمنصة" : "تعديل بيانات المنتج"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 my-2">
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">اسم المنتج</label>
              <Input value={productForm.name} onChange={(e) => setProductForm(p => ({ ...p, name: e.target.value }))} placeholder="مثال: آيفون 15 برو ماكس" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">السعر بالريال اليمني</label>
                <Input type="number" value={productForm.price} onChange={(e) => setProductForm(p => ({ ...p, price: e.target.value }))} placeholder="6000" />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">الكمية بالمخزن</label>
                <Input type="number" value={productForm.stock} onChange={(e) => setProductForm(p => ({ ...p, stock: e.target.value }))} placeholder="10" />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">المتجر التابع له</label>
              <Select value={productForm.store_id} onValueChange={(v) => setProductForm(p => ({ ...p, store_id: v }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر المتجر المسؤول" />
                </SelectTrigger>
                <SelectContent>
                  {allStores.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.city || "صنعاء"})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">حالة الظهور الفوري</label>
              <Select value={productForm.visibility_status} onValueChange={(v) => setProductForm(p => ({ ...p, visibility_status: v }))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visible">مرئي ونشط للعملاء</SelectItem>
                  <SelectItem value="hidden">مخفي / مسودة مؤقتة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => setProductDlg({ open: false, mode: "add" })}>إلغاء</Button>
            <Button variant="hero" size="sm" onClick={handleSaveProduct}>حفظ البيانات</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Job Manager Dialog */}
      <Dialog open={jobDlg.open} onOpenChange={(o) => setJobDlg(p => ({ ...p, open: o }))}>
        <DialogContent className="glass max-w-lg">
          <DialogHeader>
            <DialogTitle>{jobDlg.mode === "add" ? "نشر فرصة وظيفية جديدة" : "تعديل تفاصيل الوظيفة"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 my-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">المسمى الوظيفي</label>
                <Input value={jobForm.title} onChange={(e) => setJobForm(p => ({ ...p, title: e.target.value }))} placeholder="مثال: مطور ويب React" />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">اسم الشركة أو الجهة</label>
                <Input value={jobForm.company_name} onChange={(e) => setJobForm(p => ({ ...p, company_name: e.target.value }))} placeholder="مثال: شركة النجم للتكنولوجيا" />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">المدينة / الموقع</label>
              <Input value={jobForm.city} onChange={(e) => setJobForm(p => ({ ...p, city: e.target.value }))} placeholder="صنعاء، اليمن" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">الوصف الوظيفي</label>
              <Textarea value={jobForm.description} onChange={(e) => setJobForm(p => ({ ...p, description: e.target.value }))} placeholder="اكتب مهام ومسؤوليات الوظيفة هنا..." rows={3} />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">الشروط والمتطلبات</label>
              <Textarea value={jobForm.requirements} onChange={(e) => setJobForm(p => ({ ...p, requirements: e.target.value }))} placeholder="الخبرات البرمجية أو اللغات المطلوبة..." rows={3} />
            </div>
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => setJobDlg({ open: false, mode: "add" })}>إلغاء</Button>
            <Button variant="hero" size="sm" onClick={handleSaveJob}>نشر الفرصة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Job Applications Management Tracking Dialog */}
      <Dialog open={appsDlg.open} onOpenChange={(o) => setAppsDlg(p => ({ ...p, open: o }))}>
        <DialogContent className="glass max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" /> طلبات التوظيف لـ: {appsDlg.job?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 my-3">
            {appsDlg.list.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">لا يوجد أي متقدمين لهذه الوظيفة حتى الآن.</div>
            ) : (
              appsDlg.list.map((app: any) => (
                <div key={app.id} className="p-3 rounded-xl border border-border/40 bg-secondary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-sm text-foreground">{app.profiles?.full_name || "متقدم مجهول"}</div>
                    <div className="text-muted-foreground mt-1 space-y-0.5">
                      <div>📞 هاتف: {app.profiles?.phone || "غير متوفر"}</div>
                      {app.resume_url && (
                        <div>
                          📄 السيرة الذاتية: <a href={app.resume_url} target="_blank" rel="noreferrer" className="text-accent underline hover:text-accent/80">عرض الملف</a>
                        </div>
                      )}
                      <div className="text-[10px] text-muted-foreground mt-1">تاريخ التقديم: {new Date(app.created_at).toLocaleString("ar")}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Select value={app.status || "pending"} onValueChange={(v) => handleUpdateAppStatus(app.id, v)}>
                      <SelectTrigger className="w-32 h-8 text-[11px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">قيد المراجعة</SelectItem>
                        <SelectItem value="accepted">مقبول مبدئياً</SelectItem>
                        <SelectItem value="rejected">مرفوض</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAppsDlg({ open: false, list: [] })}>إغلاق النافذة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
};

export default AdminDashboard;
