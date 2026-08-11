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
  Wallet, Search, RefreshCw, Loader2, Crown, TrendingUp, TrendingDown, ArrowUpRight,
  ArrowDownRight, PlusCircle, MinusCircle, History, Coins, ShieldAlert, Users,
} from "lucide-react";

const TX_META: Record<string, { label: string; cls: string; up: boolean }> = {
  deposit: { label: "إيداع", cls: "text-green-400", up: true },
  withdraw: { label: "سحب", cls: "text-destructive", up: false },
  purchase: { label: "شراء", cls: "text-destructive", up: false },
  refund: { label: "استرجاع", cls: "text-green-400", up: true },
  commission: { label: "عمولة", cls: "text-accent", up: true },
  salary: { label: "مستحقات", cls: "text-primary", up: true },
};

const RANK_STYLE = [
  "bg-yellow-500/20 ring-yellow-500/40",
  "bg-slate-400/20 ring-slate-400/40",
  "bg-orange-600/20 ring-orange-600/40",
];

const WalletsCommandCenter = () => {
  const [wallets, setWallets] = useState<any[]>([]);
  const [txs, setTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("balance");
  const [selected, setSelected] = useState<any | null>(null);
  const [adjust, setAdjust] = useState<{ open: boolean; w?: any; amount: string; reason: string; dir: "credit" | "debit" }>(
    { open: false, amount: "", reason: "", dir: "credit" }
  );
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: wa }, { data: tx }] = await Promise.all([
      supabase.from("wallets").select("*").order("balance", { ascending: false }).limit(200),
      supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    const list = (wa as any[]) ?? [];
    const ids = Array.from(new Set(list.map((w) => w.user_id).filter(Boolean)));
    let profMap: Record<string, any> = {};
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, phone, city").in("id", ids);
      profMap = Object.fromEntries(((profs as any[]) ?? []).map((p) => [p.id, p]));
    }
    setWallets(list.map((w) => ({ ...w, profile: profMap[w.user_id] })));
    setTxs((tx as any[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("admin-wallets-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "wallets" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const total = wallets.reduce((a, w) => a + Number(w.balance || 0), 0);
    const inflow = txs.filter((t) => TX_META[t.type]?.up).reduce((a, t) => a + Number(t.amount || 0), 0);
    const outflow = txs.filter((t) => TX_META[t.type] && !TX_META[t.type].up).reduce((a, t) => a + Number(t.amount || 0), 0);
    return { total, holders: wallets.length, inflow, outflow };
  }, [wallets, txs]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let list = wallets.filter((w) =>
      !s || (w.profile?.full_name ?? "").toLowerCase().includes(s) || (w.profile?.phone ?? "").toLowerCase().includes(s)
    );
    if (sortBy === "balance") list = [...list].sort((a, b) => Number(b.balance) - Number(a.balance));
    if (sortBy === "lowest") list = [...list].sort((a, b) => Number(a.balance) - Number(b.balance));
    if (sortBy === "recent") list = [...list].sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at));
    return list;
  }, [wallets, q, sortBy]);

  const userTxs = useMemo(() => (selected ? txs.filter((t) => t.user_id === selected.user_id) : []), [txs, selected]);

  const submitAdjust = async () => {
    const amt = Number(adjust.amount);
    if (!amt || amt <= 0) return toast.error("أدخل مبلغاً صحيحاً");
    if (!adjust.reason.trim()) return toast.error("اكتب سبب التعديل");
    setSaving(true);
    const { error } = await supabase.rpc("admin_adjust_wallet", {
      _user_id: adjust.w.user_id,
      _amount: adjust.dir === "credit" ? amt : -amt,
      _reason: adjust.reason,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(adjust.dir === "credit" ? "تمت إضافة الرصيد" : "تم خصم الرصيد");
    setAdjust({ open: false, amount: "", reason: "", dir: "credit" });
    load();
  };

  const KPI = ({ icon: Icon, label, value, tone = "primary" }: any) => (
    <div className="glass rounded-xl p-3 border border-border/40 flex items-center gap-3">
      <div className={`h-9 w-9 rounded-lg grid place-items-center shrink-0 ${tone === "accent" ? "bg-accent/15" : "bg-primary/15"}`}>
        <Icon className={`h-4 w-4 ${tone === "accent" ? "text-accent" : "text-primary"}`} />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] text-muted-foreground truncate">{label}</div>
        <div className="font-bold text-sm truncate">{value}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI icon={Coins} label="السيولة الكلية في المنصة" value={formatYER(stats.total)} tone="accent" />
        <KPI icon={Users} label="عدد المحافظ" value={stats.holders.toLocaleString()} />
        <KPI icon={TrendingUp} label="تدفق داخل (آخر 200 حركة)" value={formatYER(stats.inflow)} tone="accent" />
        <KPI icon={TrendingDown} label="تدفق خارج" value={formatYER(stats.outflow)} />
      </div>

      {wallets.length > 0 && (
        <div className="glass rounded-2xl p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Crown className="h-4 w-4 text-yellow-400" /> أعلى ثلاث محافظ</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {wallets.slice(0, 3).map((w, i) => (
              <motion.div key={w.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className={`rounded-xl p-3 ring-1 flex items-center gap-3 ${RANK_STYLE[i]}`}>
                <div className="h-10 w-10 rounded-full bg-background/40 grid place-items-center font-bold text-sm">#{i + 1}</div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm truncate">{w.profile?.full_name || "—"}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{w.profile?.phone || "—"}</div>
                </div>
                <div className="font-cyber font-bold text-sm">{formatYER(w.balance)}</div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="glass rounded-xl p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث باسم المستخدم أو رقم الهاتف…" className="ps-9" />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[160px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="balance">الأعلى رصيداً</SelectItem>
            <SelectItem value="lowest">الأقل رصيداً</SelectItem>
            <SelectItem value="recent">آخر تحديث</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ms-1 ${loading ? "animate-spin" : ""}`} /> تحديث
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 glass rounded-2xl p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Wallet className="h-4 w-4 text-accent" /> كل المحافظ</h3>
          {loading ? (
            <div className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin inline text-primary" /></div>
          ) : (
            <div className="space-y-2 max-h-[520px] overflow-y-auto pe-1">
              {filtered.map((w, i) => (
                <div key={w.id}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition cursor-pointer ${selected?.id === w.id ? "border-primary bg-primary/5" : "border-border/40 bg-secondary/20 hover:border-primary/50"}`}
                  onClick={() => setSelected(w)}>
                  <div className="h-8 w-8 rounded-lg bg-secondary/60 grid place-items-center text-[10px] font-bold shrink-0">{i + 1}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs truncate">{w.profile?.full_name || "—"}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{w.profile?.phone || "—"} • {w.profile?.city || "—"}</div>
                  </div>
                  <div className="text-end shrink-0">
                    <div className="font-cyber font-bold text-accent text-sm">{formatYER(w.balance)}</div>
                    <div className="text-[9px] text-muted-foreground">{w.currency}</div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-green-400"
                      onClick={(e) => { e.stopPropagation(); setAdjust({ open: true, w, amount: "", reason: "", dir: "credit" }); }}>
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                      onClick={(e) => { e.stopPropagation(); setAdjust({ open: true, w, amount: "", reason: "", dir: "debit" }); }}>
                      <MinusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">لا نتائج</div>}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 glass rounded-2xl p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            {selected ? `حركات ${selected.profile?.full_name || "المستخدم"}` : "آخر الحركات المالية"}
          </h3>
          {selected && (
            <Button size="sm" variant="outline" className="mb-3 h-7 text-[11px]" onClick={() => setSelected(null)}>عرض كل الحركات</Button>
          )}
          <div className="space-y-2 max-h-[470px] overflow-y-auto pe-1">
            {(selected ? userTxs : txs).map((t) => {
              const m = TX_META[t.type] ?? { label: t.type, cls: "text-muted-foreground", up: true };
              return (
                <div key={t.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/20 border border-border/30">
                  <div className={`h-7 w-7 rounded-lg grid place-items-center shrink-0 bg-background/50 ${m.cls}`}>
                    {m.up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold truncate">{m.label}{t.description ? ` • ${t.description}` : ""}</div>
                    <div className="text-[9px] text-muted-foreground">{new Date(t.created_at).toLocaleString("ar")}</div>
                  </div>
                  <div className="text-end shrink-0">
                    <div className={`text-xs font-cyber font-bold ${m.cls}`}>{m.up ? "+" : "-"}{formatYER(t.amount)}</div>
                    <Badge variant="outline" className="text-[8px] h-3.5 px-1">{t.status}</Badge>
                  </div>
                </div>
              );
            })}
            {(selected ? userTxs : txs).length === 0 && (
              <div className="py-10 text-center text-sm text-muted-foreground">لا توجد حركات</div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={adjust.open} onOpenChange={(v) => setAdjust((p) => ({ ...p, open: v }))}>
        <DialogContent className="glass">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {adjust.dir === "credit" ? <PlusCircle className="h-5 w-5 text-green-400" /> : <MinusCircle className="h-5 w-5 text-destructive" />}
              {adjust.dir === "credit" ? "إضافة رصيد" : "خصم رصيد"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">
              المستخدم: <b className="text-foreground">{adjust.w?.profile?.full_name}</b> • الرصيد الحالي:{" "}
              <b className="text-accent">{formatYER(adjust.w?.balance ?? 0)}</b>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant={adjust.dir === "credit" ? "hero" : "outline"} className="flex-1"
                onClick={() => setAdjust((p) => ({ ...p, dir: "credit" }))}>إضافة</Button>
              <Button size="sm" variant={adjust.dir === "debit" ? "hero" : "outline"} className="flex-1"
                onClick={() => setAdjust((p) => ({ ...p, dir: "debit" }))}>خصم</Button>
            </div>
            <Input type="number" value={adjust.amount} onChange={(e) => setAdjust((p) => ({ ...p, amount: e.target.value }))} placeholder="المبلغ" />
            <Input value={adjust.reason} onChange={(e) => setAdjust((p) => ({ ...p, reason: e.target.value }))} placeholder="السبب الإداري للتعديل…" />
            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" /> كل تعديل يُسجَّل في سجل العمليات الإدارية.
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setAdjust({ open: false, amount: "", reason: "", dir: "credit" })}>إلغاء</Button>
            <Button variant="hero" size="sm" onClick={submitAdjust} disabled={saving}>
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin ms-1" />} تنفيذ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WalletsCommandCenter;
