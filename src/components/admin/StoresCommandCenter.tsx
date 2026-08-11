import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  ShoppingBag, Search, Plus, Edit2, Trash2, Pause, Play, Star, StarOff,
  Percent, ShieldCheck, Eye, ExternalLink, RefreshCw, Loader2, Users2,
  Package, Flag, Heart, CheckCircle2, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import StoreSetupDialog from "@/components/seller/StoreSetupDialog";
import ImageUploader from "@/components/common/ImageUploader";

type Store = any;
type Stats = { products_count: number; active_products: number; orders_count: number; reports_count: number; followers_count: number };

const STATUS_FILTERS = [
  { key: "all", label: "الكل" },
  { key: "pending", label: "بانتظار المراجعة" },
  { key: "approved", label: "معتمد" },
  { key: "rejected", label: "مرفوض" },
  { key: "suspended", label: "معلّق" },
  { key: "featured", label: "مميّز ⭐" },
];

const emptyForm = {
  name: "", slug: "", description: "", logo_url: "", cover_url: "",
  city: "", phone: "", theme_color: "", category_id: "",
  is_verified: false, is_active: true, commission_pct_override: "",
  admin_notes: "",
};

export default function StoresCommandCenter() {
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [stats, setStats] = useState<Record<string, Stats>>({});
  const [busy, setBusy] = useState<string | null>(null);

  // dialogs
  const [editDlg, setEditDlg] = useState<{ open: boolean; store?: Store }>({ open: false });
  const [form, setForm] = useState<any>(emptyForm);
  const [createDlg, setCreateDlg] = useState<{ open: boolean; owner_id: string }>({ open: false, owner_id: "" });
  const [ownerSearch, setOwnerSearch] = useState("");
  const [suspendDlg, setSuspendDlg] = useState<{ open: boolean; store?: Store; reason: string }>({ open: false, reason: "" });
  const [featureDlg, setFeatureDlg] = useState<{ open: boolean; store?: Store; days: number }>({ open: false, days: 7 });
  const [deleteDlg, setDeleteDlg] = useState<{ open: boolean; store?: Store; confirm: string }>({ open: false, confirm: "" });
  const [detailStore, setDetailStore] = useState<Store | null>(null);
  const [selfCreateOpen, setSelfCreateOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: s }, { data: c }, { data: u }] = await Promise.all([
      supabase.from("stores").select("*, categories(name_ar)").order("created_at", { ascending: false }).limit(500),
      supabase.from("categories").select("id, name_ar").order("display_order"),
      supabase.from("profiles").select("id, full_name, phone").order("created_at", { ascending: false }).limit(200),
    ]);
    setStores(s || []);
    setCategories(c || []);
    setUsers(u || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("admin-stores-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "stores" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const cities = useMemo(() => {
    const set = new Set<string>();
    stores.forEach((s) => s.city && set.add(s.city));
    return Array.from(set).sort();
  }, [stores]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return stores.filter((s) => {
      if (statusFilter === "suspended" && !s.suspended) return false;
      if (statusFilter === "featured" && !s.is_featured) return false;
      if (!["all", "suspended", "featured"].includes(statusFilter) && s.approval_status !== statusFilter) return false;
      if (cityFilter !== "all" && s.city !== cityFilter) return false;
      if (query && !(s.name?.toLowerCase().includes(query) || s.slug?.toLowerCase().includes(query) || s.phone?.includes(query) || s.city?.toLowerCase().includes(query))) return false;
      return true;
    });
  }, [stores, q, statusFilter, cityFilter]);

  const loadStats = async (id: string) => {
    if (stats[id]) return;
    const { data } = await supabase.rpc("admin_store_stats", { _store_id: id });
    if (data) setStats((p) => ({ ...p, [id]: data as any }));
  };

  const call = async (fn: string, args: any, okMsg: string, id: string) => {
    setBusy(id);
    const { error } = await supabase.rpc(fn as any, args);
    setBusy(null);
    if (error) { toast.error(error.message); return false; }
    toast.success(okMsg);
    return true;
  };

  const approve = async (s: Store, approve: boolean, reason?: string) => {
    const ok = await call("admin_approve_store", { _store_id: s.id, _approve: approve, _reason: reason || null }, approve ? "تم الاعتماد" : "تم الرفض", s.id);
    if (ok) load();
  };

  const openEdit = (s: Store) => {
    setForm({
      name: s.name || "", slug: s.slug || "", description: s.description || "",
      logo_url: s.logo_url || "", cover_url: s.cover_url || "", city: s.city || "",
      phone: s.phone || "", theme_color: s.theme_color || "",
      category_id: s.category_id || "", is_verified: !!s.is_verified,
      is_active: !!s.is_active, commission_pct_override: s.commission_pct_override ?? "",
      admin_notes: s.admin_notes || "",
    });
    setEditDlg({ open: true, store: s });
  };

  const saveEdit = async () => {
    if (!editDlg.store) return;
    const patch: any = { ...form };
    if (patch.commission_pct_override === "") delete patch.commission_pct_override;
    if (patch.category_id === "") delete patch.category_id;
    const ok = await call("admin_update_store", { _store_id: editDlg.store.id, _patch: patch }, "تم حفظ التعديلات", editDlg.store.id);
    if (ok) { setEditDlg({ open: false }); load(); }
  };

  const createStore = async () => {
    if (!createDlg.owner_id) { toast.error("اختر البائع"); return; }
    if (!form.name) { toast.error("اسم المتجر مطلوب"); return; }
    const payload: any = { ...form };
    if (!payload.slug) delete payload.slug;
    if (!payload.category_id) delete payload.category_id;
    const ok = await call("admin_create_store_for_user", { _owner_id: createDlg.owner_id, _payload: payload }, "تم إنشاء المتجر", "new");
    if (ok) { setCreateDlg({ open: false, owner_id: "" }); setForm(emptyForm); load(); }
  };

  const doSuspend = async () => {
    if (!suspendDlg.store) return;
    const s = suspendDlg.store;
    const ok = await call("admin_suspend_store", { _store_id: s.id, _suspend: !s.suspended, _reason: suspendDlg.reason || null }, s.suspended ? "تم إعادة التفعيل" : "تم التعليق", s.id);
    if (ok) { setSuspendDlg({ open: false, reason: "" }); load(); }
  };

  const doFeature = async () => {
    if (!featureDlg.store) return;
    const s = featureDlg.store;
    const ok = await call("admin_feature_store", { _store_id: s.id, _featured: !s.is_featured, _days: featureDlg.days }, s.is_featured ? "تم إلغاء الإبراز" : "تم الإبراز", s.id);
    if (ok) { setFeatureDlg({ open: false, days: 7 }); load(); }
  };

  const doDelete = async () => {
    if (!deleteDlg.store) return;
    if (deleteDlg.confirm !== deleteDlg.store.name) { toast.error("اكتب اسم المتجر للتأكيد"); return; }
    const ok = await call("admin_delete_store", { _store_id: deleteDlg.store.id }, "تم الحذف نهائياً", deleteDlg.store.id);
    if (ok) { setDeleteDlg({ open: false, confirm: "" }); load(); }
  };

  return (
    <div className="glass rounded-2xl p-4 sm:p-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-bold flex items-center gap-2 text-lg">
          <ShoppingBag className="h-5 w-5 text-accent" /> مركز قيادة المتاجر
          <Badge variant="outline" className="text-[10px]">{filtered.length}/{stores.length}</Badge>
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={load}><RefreshCw className="h-3.5 w-3.5 ms-1" /> تحديث</Button>
          <Button
            size="lg"
            onClick={() => setSelfCreateOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/30 rounded-xl px-5"
          >
            <Plus className="h-4 w-4 ms-1" /> إنشاء متجري الآن
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setForm(emptyForm); setCreateDlg({ open: true, owner_id: "" }); }}>
            <Plus className="h-3.5 w-3.5 ms-1" /> إنشاء متجر لبائع آخر
          </Button>
        </div>
      </div>

      {/* Seller-identical creation dialog (admin creates under own account) */}
      <StoreSetupDialog
        open={selfCreateOpen}
        onClose={() => setSelfCreateOpen(false)}
        onSaved={() => { setSelfCreateOpen(false); load(); }}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute top-1/2 -translate-y-1/2 start-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالاسم، الرابط، الهاتف، المدينة..." className="ps-8 h-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>{STATUS_FILTERS.map(f => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={cityFilter} onValueChange={setCityFilter}>
          <SelectTrigger className="h-9 w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل المدن</SelectItem>
            {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-14"><Loader2 className="inline h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-14 text-sm text-muted-foreground">لا توجد متاجر بهذه المعايير</div>
      ) : (
        <div className="space-y-2 max-h-[70vh] overflow-y-auto pe-1">
          {filtered.map((s) => {
            const st = stats[s.id];
            return (
              <motion.div key={s.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="border border-border/50 rounded-xl p-3 bg-secondary/20 hover:bg-secondary/40 transition">
                <div className="flex items-start gap-3">
                  <div className="h-14 w-14 rounded-lg bg-secondary/60 overflow-hidden flex items-center justify-center shrink-0">
                    {s.logo_url ? <img src={s.logo_url} className="h-full w-full object-cover" alt={s.name} /> : <ShoppingBag className="h-6 w-6 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm truncate">{s.name}</span>
                      {s.is_verified && <ShieldCheck className="h-3.5 w-3.5 text-primary" />}
                      {s.is_featured && <Badge className="h-4 px-1 text-[9px] bg-accent text-accent-foreground">مميّز ⭐</Badge>}
                      <Badge variant="outline" className="h-4 px-1 text-[9px]">{s.approval_status}</Badge>
                      {s.suspended && <Badge className="h-4 px-1 text-[9px] bg-destructive/20 text-destructive">معلّق</Badge>}
                      {!s.is_active && !s.suspended && <Badge variant="outline" className="h-4 px-1 text-[9px]">مخفي</Badge>}
                      {s.commission_pct_override != null && <Badge className="h-4 px-1 text-[9px] bg-primary/20 text-primary"><Percent className="h-2.5 w-2.5 ms-0.5" />{s.commission_pct_override}%</Badge>}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1 flex gap-2 flex-wrap">
                      <span>📍 {s.city || "—"}</span>
                      <span>📞 {s.phone || "—"}</span>
                      <span>🕐 {new Date(s.created_at).toLocaleDateString("ar")}</span>
                      {s.categories?.name_ar && <span>🏷️ {s.categories.name_ar}</span>}
                    </div>
                    {st && (
                      <div className="flex gap-3 mt-1.5 text-[10px] text-muted-foreground">
                        <span><Package className="inline h-3 w-3 ms-0.5" />{st.active_products}/{st.products_count}</span>
                        <span>🛒 {st.orders_count}</span>
                        <span><Users2 className="inline h-3 w-3 ms-0.5" />{st.followers_count}</span>
                        {st.reports_count > 0 && <span className="text-destructive"><Flag className="inline h-3 w-3 ms-0.5" />{st.reports_count}</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end shrink-0">
                    {s.approval_status === "pending" && (
                      <>
                        <Button size="sm" variant="hero" onClick={() => approve(s, true)} disabled={busy === s.id}><CheckCircle2 className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="outline" onClick={() => approve(s, false, prompt("سبب الرفض؟") || undefined)}><XCircle className="h-3.5 w-3.5" /></Button>
                      </>
                    )}
                    <Button size="sm" variant="outline" title="عرض" onClick={() => { setDetailStore(s); loadStats(s.id); }}><Eye className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="outline" title="تعديل" onClick={() => openEdit(s)}><Edit2 className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="outline" title={s.suspended ? "إعادة تفعيل" : "تعليق"} onClick={() => setSuspendDlg({ open: true, store: s, reason: "" })}>
                      {s.suspended ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                    </Button>
                    <Button size="sm" variant="outline" title={s.is_featured ? "إلغاء الإبراز" : "إبراز"} onClick={() => setFeatureDlg({ open: true, store: s, days: 7 })}>
                      {s.is_featured ? <StarOff className="h-3.5 w-3.5" /> : <Star className="h-3.5 w-3.5 text-accent" />}
                    </Button>
                    <Button size="sm" variant="hero" title="افتح لوحة كتاجر (Impersonate)" onClick={() => window.open(`/dashboard/seller?impersonate_store_id=${s.id}`, "_blank")}><ExternalLink className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="outline" title="عرض الواجهة العامة" onClick={() => window.open(`/store/${s.id}`, "_blank")}><Eye className="h-3.5 w-3.5 opacity-70" /></Button>
                    <Button size="sm" className="bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30" title="حذف نهائي" onClick={() => setDeleteDlg({ open: true, store: s, confirm: "" })}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDlg.open} onOpenChange={(o) => setEditDlg({ open: o, store: o ? editDlg.store : undefined })}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>تعديل المتجر: {editDlg.store?.name}</DialogTitle></DialogHeader>
          <StoreForm form={form} setForm={setForm} categories={categories} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDlg({ open: false })}>إلغاء</Button>
            <Button variant="hero" onClick={saveEdit} disabled={busy === editDlg.store?.id}>حفظ التعديلات</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createDlg.open} onOpenChange={(o) => setCreateDlg({ open: o, owner_id: o ? createDlg.owner_id : "" })}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>إنشاء متجر لبائع</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs mb-1 block">اختر البائع (سيُمنح دور بائع تلقائياً)</Label>
              <Input value={ownerSearch} onChange={(e) => setOwnerSearch(e.target.value)} placeholder="ابحث بالاسم أو الهاتف..." className="h-9 mb-2" />
              <div className="max-h-40 overflow-y-auto border border-border/50 rounded-lg">
                {users.filter(u => !ownerSearch || u.full_name?.toLowerCase().includes(ownerSearch.toLowerCase()) || u.phone?.includes(ownerSearch)).slice(0, 30).map(u => (
                  <button key={u.id} onClick={() => setCreateDlg({ ...createDlg, owner_id: u.id })}
                    className={`w-full text-start p-2 text-xs hover:bg-secondary/50 flex justify-between border-b border-border/30 ${createDlg.owner_id === u.id ? "bg-primary/15" : ""}`}>
                    <span>{u.full_name || "—"}</span>
                    <span className="text-muted-foreground">{u.phone || "—"}</span>
                  </button>
                ))}
              </div>
            </div>
            <StoreForm form={form} setForm={setForm} categories={categories} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDlg({ open: false, owner_id: "" })}>إلغاء</Button>
            <Button variant="hero" onClick={createStore} disabled={busy === "new"}>إنشاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog open={suspendDlg.open} onOpenChange={(o) => setSuspendDlg({ open: o, reason: "" })}>
        <DialogContent>
          <DialogHeader><DialogTitle>{suspendDlg.store?.suspended ? "إعادة تفعيل" : "تعليق"} — {suspendDlg.store?.name}</DialogTitle></DialogHeader>
          {!suspendDlg.store?.suspended && (
            <Textarea value={suspendDlg.reason} onChange={(e) => setSuspendDlg({ ...suspendDlg, reason: e.target.value })} placeholder="سبب التعليق (سيصل إشعار للمالك)" rows={3} />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDlg({ open: false, reason: "" })}>إلغاء</Button>
            <Button variant="hero" onClick={doSuspend}>تأكيد</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feature Dialog */}
      <Dialog open={featureDlg.open} onOpenChange={(o) => setFeatureDlg({ open: o, days: 7 })}>
        <DialogContent>
          <DialogHeader><DialogTitle>{featureDlg.store?.is_featured ? "إلغاء إبراز" : "إبراز"} — {featureDlg.store?.name}</DialogTitle></DialogHeader>
          {!featureDlg.store?.is_featured && (
            <div>
              <Label className="text-xs">مدة الإبراز (بالأيام)</Label>
              <Input type="number" min={1} value={featureDlg.days} onChange={(e) => setFeatureDlg({ ...featureDlg, days: Number(e.target.value) })} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeatureDlg({ open: false, days: 7 })}>إلغاء</Button>
            <Button variant="hero" onClick={doFeature}>تأكيد</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDlg.open} onOpenChange={(o) => setDeleteDlg({ open: o, confirm: "" })}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-destructive">حذف نهائي — {deleteDlg.store?.name}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">هذا الإجراء لا يمكن التراجع عنه. اكتب اسم المتجر <b>{deleteDlg.store?.name}</b> للتأكيد.</p>
          <Input value={deleteDlg.confirm} onChange={(e) => setDeleteDlg({ ...deleteDlg, confirm: e.target.value })} placeholder="اسم المتجر" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDlg({ open: false, confirm: "" })}>إلغاء</Button>
            <Button className="bg-destructive text-destructive-foreground" onClick={doDelete}>حذف نهائي</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail viewer */}
      <Dialog open={!!detailStore} onOpenChange={(o) => !o && setDetailStore(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{detailStore?.name}</DialogTitle></DialogHeader>
          {detailStore && (
            <div className="space-y-2 text-sm">
              {detailStore.cover_url && <img src={detailStore.cover_url} className="w-full h-32 object-cover rounded-lg" alt="" />}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><b>المعرف:</b> {detailStore.slug}</div>
                <div><b>المدينة:</b> {detailStore.city || "—"}</div>
                <div><b>الهاتف:</b> {detailStore.phone || "—"}</div>
                <div><b>التقييم:</b> {detailStore.rating || 0} ⭐</div>
                <div><b>مبيعات:</b> {detailStore.total_sales || 0}</div>
                <div><b>عمولة خاصة:</b> {detailStore.commission_pct_override ?? "افتراضية"}%</div>
              </div>
              {detailStore.description && <p className="text-xs text-muted-foreground">{detailStore.description}</p>}
              {detailStore.admin_notes && <div className="bg-primary/10 border border-primary/30 rounded-lg p-2 text-xs"><b>ملاحظات المسؤول:</b><br/>{detailStore.admin_notes}</div>}
              {stats[detailStore.id] && (
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/40 text-center">
                  <div><div className="font-bold">{stats[detailStore.id].products_count}</div><div className="text-[10px] text-muted-foreground">منتجات</div></div>
                  <div><div className="font-bold">{stats[detailStore.id].orders_count}</div><div className="text-[10px] text-muted-foreground">طلبات</div></div>
                  <div><div className="font-bold">{stats[detailStore.id].followers_count}</div><div className="text-[10px] text-muted-foreground">متابعون</div></div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StoreForm({ form, setForm, categories }: { form: any; setForm: (v: any) => void; categories: any[] }) {
  const set = (k: string, v: any) => setForm({ ...form, [k]: v });
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="sm:col-span-2">
        <Label className="text-xs">صورة الغلاف</Label>
        <ImageUploader value={form.cover_url ? [form.cover_url] : []} onChange={(u) => set("cover_url", u[0] ?? "")} max={1} folder="store/cover" />
      </div>
      <div className="sm:col-span-2">
        <Label className="text-xs">الشعار (Logo)</Label>
        <ImageUploader value={form.logo_url ? [form.logo_url] : []} onChange={(u) => set("logo_url", u[0] ?? "")} max={1} folder="store/logo" />
      </div>
      <div><Label className="text-xs">اسم المتجر *</Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
      <div><Label className="text-xs">المعرف (slug)</Label><Input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="اتركه فارغاً للتوليد التلقائي" /></div>
      <div className="sm:col-span-2"><Label className="text-xs">الوصف</Label><Textarea rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
      <div><Label className="text-xs">المدينة</Label><Input value={form.city} onChange={(e) => set("city", e.target.value)} /></div>
      <div><Label className="text-xs">الهاتف</Label><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
      <div>
        <Label className="text-xs">الفئة</Label>
        <Select value={form.category_id || "none"} onValueChange={(v) => set("category_id", v === "none" ? "" : v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— بدون —</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name_ar}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div><Label className="text-xs">لون الهوية</Label><Input type="color" value={form.theme_color || "#3b82f6"} onChange={(e) => set("theme_color", e.target.value)} /></div>
      <div><Label className="text-xs">عمولة خاصة % (اتركها فارغة للافتراضية)</Label><Input type="number" step="0.1" value={form.commission_pct_override} onChange={(e) => set("commission_pct_override", e.target.value)} /></div>
      <div className="flex items-center gap-3 pt-4">
        <div className="flex items-center gap-2"><Switch checked={form.is_verified} onCheckedChange={(v) => set("is_verified", v)} /><Label className="text-xs">موثّق</Label></div>
        <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => set("is_active", v)} /><Label className="text-xs">مفعّل</Label></div>
      </div>
      <div className="sm:col-span-2"><Label className="text-xs">ملاحظات داخلية للمسؤول</Label><Textarea rows={2} value={form.admin_notes} onChange={(e) => set("admin_notes", e.target.value)} /></div>
    </div>
  );
}
