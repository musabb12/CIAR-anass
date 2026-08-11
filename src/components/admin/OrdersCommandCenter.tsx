import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { formatYER } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Package, Search, RefreshCw, Loader2, TrendingUp, Truck, CheckCircle2, XCircle,
  Clock, Undo2, Bike, CreditCard, MapPin, Hash, Wallet, ChevronDown, ChevronUp,
} from "lucide-react";

const STATUS_META: Record<string, { label: string; cls: string; icon: any }> = {
  pending: { label: "بانتظار التأكيد", cls: "bg-muted text-muted-foreground", icon: Clock },
  confirmed: { label: "مؤكد", cls: "bg-primary/15 text-primary", icon: CheckCircle2 },
  preparing: { label: "قيد التجهيز", cls: "bg-accent/15 text-accent", icon: Package },
  shipping: { label: "في الطريق", cls: "bg-blue-500/15 text-blue-400", icon: Truck },
  delivered: { label: "تم التسليم", cls: "bg-green-500/15 text-green-400", icon: CheckCircle2 },
  cancelled: { label: "ملغي", cls: "bg-destructive/15 text-destructive", icon: XCircle },
  returned: { label: "مُرجع", cls: "bg-orange-500/15 text-orange-400", icon: Undo2 },
};

const PAY_META: Record<string, { label: string; cls: string }> = {
  pending: { label: "بانتظار الدفع", cls: "bg-muted text-muted-foreground" },
  paid: { label: "مدفوع", cls: "bg-green-500/15 text-green-400" },
  failed: { label: "فشل الدفع", cls: "bg-destructive/15 text-destructive" },
  refunded: { label: "مسترجع", cls: "bg-orange-500/15 text-orange-400" },
};

const METHOD_LABEL: Record<string, string> = { wallet: "محفظة", cod: "عند الاستلام", bank_transfer: "تحويل بنكي" };

const STATUS_ORDER = ["pending", "confirmed", "preparing", "shipping", "delivered", "cancelled", "returned"];

const OrdersCommandCenter = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [pilots, setPilots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [payFilter, setPayFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [refundDlg, setRefundDlg] = useState<{ open: boolean; order?: any; reason: string }>({ open: false, reason: "" });

  const load = async () => {
    setLoading(true);
    const [{ data: ords }, { data: pl }] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(300),
      supabase.rpc("admin_pilots_overview"),
    ]);
    const list = (ords as any[]) ?? [];
    const ids = Array.from(new Set(list.map((o) => o.customer_id).filter(Boolean)));
    let profMap: Record<string, any> = {};
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, phone, city").in("id", ids);
      profMap = Object.fromEntries(((profs as any[]) ?? []).map((p) => [p.id, p]));
    }
    setOrders(list.map((o) => ({ ...o, customer: profMap[o.customer_id] })));
    setPilots(Array.isArray(pl) ? (pl as any[]) : []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("admin-orders-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const total = orders.reduce((a, o) => a + Number(o.total || 0), 0);
    const today = orders.filter((o) => new Date(o.created_at).toDateString() === new Date().toDateString());
    return {
      count: orders.length,
      revenue: total,
      today: today.length,
      todayRevenue: today.reduce((a, o) => a + Number(o.total || 0), 0),
      active: orders.filter((o) => ["confirmed", "preparing", "shipping"].includes(o.status)).length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      avg: orders.length ? total / orders.length : 0,
      fees: orders.reduce((a, o) => a + Number(o.service_fee || 0) + Number(o.shipping_fee || 0), 0),
    };
  }, [orders]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (payFilter !== "all" && o.payment_status !== payFilter) return false;
      if (!s) return true;
      return (
        (o.order_number ?? "").toLowerCase().includes(s) ||
        (o.customer?.full_name ?? "").toLowerCase().includes(s) ||
        (o.customer?.phone ?? "").toLowerCase().includes(s)
      );
    });
  }, [orders, q, statusFilter, payFilter]);

  const run = async (key: string, fn: () => PromiseLike<{ error: any }>, okMsg: string) => {
    setBusy(key);
    try {
      const { error } = await fn();
      if (error) throw error;
      toast.success(okMsg);
      await load();
    } catch (e: any) {
      toast.error(e?.message === "ALREADY_REFUNDED" ? "تم الاسترجاع مسبقاً" : e?.message || "فشل تنفيذ العملية");
    } finally {
      setBusy(null);
    }
  };

  const changeStatus = (o: any, status: string) =>
    run(`st-${o.id}`, () => supabase.rpc("admin_update_order_status", { _order_id: o.id, _status: status as any }), "تم تحديث حالة الطلب");

  const assignPilot = (o: any, pilotId: string) =>
    run(`pl-${o.id}`, () => supabase.rpc("admin_assign_order_pilot", { _order_id: o.id, _pilot_id: pilotId === "none" ? null : pilotId }), "تم تحديث السائق");

  const doRefund = async () => {
    const o = refundDlg.order;
    if (!o) return;
    await run(`rf-${o.id}`, () => supabase.rpc("admin_refund_order", { _order_id: o.id, _reason: refundDlg.reason || "استرجاع إداري" }), "تم استرجاع المبلغ للعميل");
    setRefundDlg({ open: false, reason: "" });
  };

  const KPI = ({ icon: Icon, label, value, tone }: any) => (
    <div className="glass rounded-xl p-3 border border-border/40 flex items-center gap-3">
      <div className={`h-9 w-9 rounded-lg grid place-items-center shrink-0 bg-${tone}/15`}>
        <Icon className={`h-4 w-4 text-${tone}`} />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] text-muted-foreground truncate">{label}</div>
        <div className="font-bold text-sm truncate">{value}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI icon={Package} label="إجمالي الطلبات" value={stats.count.toLocaleString()} tone="primary" />
        <KPI icon={TrendingUp} label="إجمالي المبيعات" value={formatYER(stats.revenue)} tone="accent" />
        <KPI icon={Truck} label="طلبات جارية الآن" value={stats.active.toLocaleString()} tone="primary" />
        <KPI icon={Wallet} label="رسوم وشحن محصّلة" value={formatYER(stats.fees)} tone="accent" />
        <KPI icon={Clock} label="طلبات اليوم" value={`${stats.today} • ${formatYER(stats.todayRevenue)}`} tone="primary" />
        <KPI icon={CheckCircle2} label="مكتملة" value={stats.delivered.toLocaleString()} tone="accent" />
        <KPI icon={CreditCard} label="متوسط قيمة الطلب" value={formatYER(stats.avg)} tone="primary" />
        <KPI icon={Bike} label="سائقون متاحون" value={pilots.length.toLocaleString()} tone="accent" />
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث برقم الطلب أو اسم/هاتف العميل…" className="ps-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] text-xs"><SelectValue placeholder="الحالة" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            {STATUS_ORDER.map((s) => <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={payFilter} onValueChange={setPayFilter}>
          <SelectTrigger className="w-[140px] text-xs"><SelectValue placeholder="الدفع" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل حالات الدفع</SelectItem>
            {Object.keys(PAY_META).map((s) => <SelectItem key={s} value={s}>{PAY_META[s].label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ms-1 ${loading ? "animate-spin" : ""}`} /> تحديث
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-14 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-xl p-10 text-center text-sm text-muted-foreground">لا توجد طلبات مطابقة</div>
      ) : (
        <div className="space-y-2 max-h-[640px] overflow-y-auto pe-1">
          {filtered.map((o) => {
            const meta = STATUS_META[o.status] ?? STATUS_META.pending;
            const Icon = meta.icon;
            const open = expanded === o.id;
            const pilot = pilots.find((p) => p.user_id === o.pilot_id);
            return (
              <motion.div key={o.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl border border-border/40 overflow-hidden">
                <button onClick={() => setExpanded(open ? null : o.id)} className="w-full text-start p-3 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg grid place-items-center shrink-0 ${meta.cls}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-cyber text-xs text-accent truncate">{o.order_number}</span>
                      <Badge className={`text-[9px] border-0 ${meta.cls}`}>{meta.label}</Badge>
                      <Badge className={`text-[9px] border-0 ${(PAY_META[o.payment_status] ?? PAY_META.pending).cls}`}>
                        {(PAY_META[o.payment_status] ?? PAY_META.pending).label}
                      </Badge>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      {o.customer?.full_name || "عميل"} • {METHOD_LABEL[o.payment_method] ?? o.payment_method} • {new Date(o.created_at).toLocaleString("ar")}
                    </div>
                  </div>
                  <div className="text-end shrink-0">
                    <div className="font-bold text-primary text-sm">{formatYER(o.total)}</div>
                    <div className="text-[9px] text-muted-foreground">{pilot ? pilot.full_name : "بدون سائق"}</div>
                  </div>
                  {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>

                {open && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    className="border-t border-border/40 p-3 space-y-3 bg-secondary/20">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div><div className="text-muted-foreground">المنتجات</div><div className="font-bold">{formatYER(o.subtotal)}</div></div>
                      <div><div className="text-muted-foreground">الشحن</div><div className="font-bold">{formatYER(o.shipping_fee)}</div></div>
                      <div><div className="text-muted-foreground">رسوم الخدمة</div><div className="font-bold">{formatYER(o.service_fee)}</div></div>
                      <div><div className="text-muted-foreground">إكرامية السائق</div><div className="font-bold">{formatYER(o.pilot_tip)}</div></div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Hash className="h-3 w-3" /> {o.id.slice(0, 8)}</span>
                      {o.distance_km != null && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {Number(o.distance_km).toFixed(1)} كم</span>}
                      <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" /> الضمان: {o.escrow_status}</span>
                      {o.customer?.phone && <span className="flex items-center gap-1">📞 {o.customer.phone}</span>}
                    </div>
                    {o.notes && <div className="text-[11px] p-2 rounded-lg bg-background/40 border border-border/30">📝 {o.notes}</div>}

                    <div className="flex flex-wrap items-center gap-2">
                      <Select value={o.status} onValueChange={(v) => changeStatus(o, v)}>
                        <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUS_ORDER.map((s) => <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>)}
                        </SelectContent>
                      </Select>

                      <Select value={o.pilot_id ?? "none"} onValueChange={(v) => assignPilot(o, v)}>
                        <SelectTrigger className="w-[190px] h-8 text-xs"><SelectValue placeholder="تعيين سائق" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">بدون سائق</SelectItem>
                          {pilots.map((p) => (
                            <SelectItem key={p.user_id} value={p.user_id}>
                              {p.full_name || "سائق"} • {p.active_tasks} مهمة جارية
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button size="sm" variant="outline" className="h-8 text-xs"
                        disabled={busy === `st-${o.id}` || o.status === "shipping"}
                        onClick={() => changeStatus(o, "shipping")}>
                        <Truck className="h-3.5 w-3.5 ms-1" /> إرسال للتوصيل
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 text-xs text-green-400"
                        disabled={busy === `st-${o.id}` || o.status === "delivered"}
                        onClick={() => changeStatus(o, "delivered")}>
                        <CheckCircle2 className="h-3.5 w-3.5 ms-1" /> تأكيد التسليم
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 text-xs text-destructive"
                        disabled={busy === `rf-${o.id}` || o.payment_status === "refunded"}
                        onClick={() => setRefundDlg({ open: true, order: o, reason: "" })}>
                        <Undo2 className="h-3.5 w-3.5 ms-1" /> استرجاع المبلغ
                      </Button>
                      {busy?.endsWith(o.id) && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog open={refundDlg.open} onOpenChange={(v) => setRefundDlg((p) => ({ ...p, open: v }))}>
        <DialogContent className="glass">
          <DialogHeader><DialogTitle>استرجاع مبلغ الطلب</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="text-xs text-muted-foreground">
              سيُعاد <b className="text-accent">{formatYER(refundDlg.order?.total ?? 0)}</b> إلى محفظة العميل، ويُلغى الطلب <b>{refundDlg.order?.order_number}</b>.
            </div>
            <Input value={refundDlg.reason} onChange={(e) => setRefundDlg((p) => ({ ...p, reason: e.target.value }))} placeholder="سبب الاسترجاع…" />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setRefundDlg({ open: false, reason: "" })}>إلغاء</Button>
            <Button variant="hero" size="sm" onClick={doRefund}>تأكيد الاسترجاع</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersCommandCenter;
