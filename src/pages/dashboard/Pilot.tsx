import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import DashboardShell from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bike, MapPin, Wallet, Fuel, Star, Navigation, KeyRound, CheckCircle2, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatYER } from "@/lib/format";
import { toast } from "sonner";
import ActionHero from "@/components/common/ActionHero";

const PilotDashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [codeInputs, setCodeInputs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [hero, setHero] = useState(false);

  const refresh = async () => {
    if (!user) return;
    const [o, w] = await Promise.all([
      supabase.from("orders").select("*").eq("pilot_id", user.id).in("status", ["confirmed", "preparing", "shipping"]).order("created_at", { ascending: false }),
      supabase.from("wallets").select("*").eq("user_id", user.id).maybeSingle(),
    ]);
    setOrders(o.data ?? []);
    setWallet(w.data);
  };
  useEffect(() => { refresh(); }, [user]);

  const handover = async (orderId: string) => {
    const code = codeInputs[orderId];
    if (!code || code.length < 4) return toast.error("أدخل كود التسليم الذهبي");
    setBusy(orderId);
    const { error } = await supabase.rpc("confirm_delivery" as any, { _order_id: orderId, _code: code });
    setBusy(null);
    if (error) {
      toast.error(error.message.includes("INVALID_CODE") ? "❌ كود خاطئ" : "تعذّر التأكيد");
      return;
    }
    toast.success("✅ تم تأكيد التسليم! تم إيداع أجرتك");
    setHero(true);
    setTimeout(() => setHero(false), 2400);
    refresh();
  };

  return (
    <DashboardShell role="pilot" title="🏍️ قيادة المهمات الذهبية" subtitle="مهامك النشطة وكود التسليم وأرباحك المباشرة.">
      <ActionHero show={hero} title="🏆 تم التسليم بنجاح!" subtitle="تم إيداع أجرتك + الإكرامية في محفظتك" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Bike, label: "مهام نشطة", value: orders.length.toString(), c: "primary" },
          { icon: Wallet, label: "€د المحفظة", value: formatYER(wallet?.balance ?? 0), c: "accent" },
          { icon: Fuel, label: "إكراميات الفوّالة", value: "محسوبة تلقائياً", c: "primary" },
          { icon: Star, label: "تقييمك", value: "4.9 / 5", c: "accent" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-xl p-5">
            <s.icon className={`mb-3 h-5 w-5 ${s.c === "accent" ? "text-accent" : "text-primary"}`} />
            <div className="font-cyber text-lg font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2"><Navigation className="h-5 w-5 text-primary" /> المهمات النشطة</h2>
            <span className="text-xs font-cyber text-accent animate-pulse">● LIVE</span>
          </div>

          {orders.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <div className="text-sm">لا توجد مهمات نشطة حالياً</div>
            </div>
          ) : (
            orders.map((o) => (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass rounded-2xl p-5 border border-primary/30"
              >
                <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                  <div>
                    <div className="font-cyber text-accent font-bold">{o.order_number}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">المسافة: {o.distance_km ?? "—"} كم • أجرة: {formatYER(o.shipping_fee)}</div>
                  </div>
                  <Link to={`/orders/${o.id}`}>
                    <Button variant="outline" size="sm"><MapPin className="h-3.5 w-3.5 ms-1" /> الخريطة</Button>
                  </Link>
                </div>

                <div className="bg-gradient-mystic/10 border border-accent/30 rounded-xl p-4 mt-3">
                  <div className="flex items-center gap-2 mb-2 text-accent text-sm font-bold">
                    <KeyRound className="h-4 w-4" /> 🔐 بروتوكول التسليم الذهبي
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">اطلب من الزبون كود التسليم المكوّن من 6 أرقام عند الاستلام، ثم أدخله هنا لإفراج الأموال فوراً.</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="كود التسليم الذهبي"
                      value={codeInputs[o.id] ?? ""}
                      onChange={(e) => setCodeInputs({ ...codeInputs, [o.id]: e.target.value })}
                      className="text-center font-cyber text-lg tracking-widest"
                      maxLength={8}
                    />
                    <Button
                      variant="gold"
                      onClick={() => handover(o.id)}
                      disabled={busy === o.id}
                    >
                      <CheckCircle2 className="h-4 w-4 ms-1" />
                      {busy === o.id ? "..." : "تأكيد"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <div className="glass rounded-2xl p-6 h-fit">
          <h2 className="text-xl font-bold mb-4">المحفظة</h2>
          <div className="rounded-xl bg-gradient-mystic p-5 text-primary-foreground mb-4">
            <div className="text-xs opacity-70 font-cyber tracking-widest mb-1">PILOT BALANCE</div>
            <div className="font-cyber text-2xl font-black shimmer-gold">{formatYER(wallet?.balance ?? 0)}</div>
          </div>
          <Link to="/wallet"><Button variant="gold" className="w-full">إدارة المحفظة</Button></Link>
        </div>
      </div>
    </DashboardShell>
  );
};

export default PilotDashboard;
