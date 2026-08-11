import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import SellerDashboard from "@/pages/dashboard/Seller";
import { Store, Search, ChevronLeft, Loader2, ShieldCheck, RefreshCw } from "lucide-react";

interface StoreRow {
  id: string;
  name: string;
  city?: string | null;
  logo_url?: string | null;
  approval_status?: string | null;
  suspended?: boolean | null;
}

/**
 * مركز التحكم بلوحات المتاجر — يفتح لوحة تحكم أي متجر داخل لوحة المسؤول
 * دون الحاجة للخروج منها أو تسجيل الدخول بحساب البائع.
 */
const StoreControlCenter = () => {
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [active, setActive] = useState<StoreRow | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("stores")
      .select("id, name, city, logo_url, approval_status, suspended")
      .order("created_at", { ascending: false })
      .limit(500);
    setStores((data as StoreRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return stores;
    return stores.filter((st) =>
      (st.name ?? "").toLowerCase().includes(s) || (st.city ?? "").toLowerCase().includes(s)
    );
  }, [stores, q]);

  if (active) {
    return (
      <div className="space-y-4">
        <div className="glass rounded-xl p-3 flex flex-wrap items-center gap-2 border border-primary/30">
          <Button variant="outline" size="sm" onClick={() => setActive(null)}>
            <ChevronLeft className="h-4 w-4 ms-1" /> رجوع لقائمة المتاجر
          </Button>
          <Badge className="bg-primary/15 text-primary border-0">
            <ShieldCheck className="h-3 w-3 ms-1" /> وضع التحكم الإداري
          </Badge>
          <span className="text-xs text-muted-foreground truncate">
            أنت تدير الآن لوحة «{active.name}» كأنك صاحب المتجر
          </span>
        </div>

        {/* لوحة تحكم البائع مضمّنة بالكامل داخل لوحة المسؤول */}
        <SellerDashboard embedded storeId={active.id} key={active.id} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="glass rounded-xl p-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث باسم المتجر أو المدينة…" className="ps-9" />
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ms-1 ${loading ? "animate-spin" : ""}`} /> تحديث
        </Button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-xl p-10 text-center text-sm text-muted-foreground">لا توجد متاجر مطابقة</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((st) => (
            <button
              key={st.id}
              onClick={() => setActive(st)}
              className="text-start glass rounded-xl p-4 border border-border/50 hover:border-primary transition flex items-center gap-3"
            >
              <div className="h-11 w-11 rounded-lg bg-secondary/50 overflow-hidden flex items-center justify-center shrink-0">
                {st.logo_url ? <img src={st.logo_url} alt={st.name} className="h-full w-full object-cover" /> : <Store className="h-5 w-5 text-primary" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm truncate">{st.name}</div>
                <div className="text-[11px] text-muted-foreground truncate">{st.city ?? "—"}</div>
              </div>
              {st.suspended ? (
                <Badge variant="destructive" className="text-[9px]">معلّق</Badge>
              ) : st.approval_status === "pending" ? (
                <Badge variant="outline" className="text-[9px]">قيد المراجعة</Badge>
              ) : (
                <Badge className="text-[9px]">نشط</Badge>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default StoreControlCenter;
