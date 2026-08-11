import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight, Plus,
  ShieldCheck, Sparkles, Upload, Lock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { formatYER, formatDate } from "@/lib/format";
import { GATEWAYS, getGateway, GatewayKind } from "@/lib/payment-gateways";
import { useGateways } from "@/hooks/useGateways";
import WalletGuard from "@/components/wallet/WalletGuard";
import { toast } from "sonner";

const Wallet = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [txs, setTxs] = useState<any[]>([]);
  const [intents, setIntents] = useState<any[]>([]);
  const [topUp, setTopUp] = useState("");
  const [gateway, setGateway] = useState<GatewayKind>("kuraimi");
  const [reference, setReference] = useState("");
  const gateways = useGateways();

  const refresh = async () => {
    if (!user) return;
    const [w, t, i] = await Promise.all([
      supabase.from("wallets").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("payment_intents").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);
    setWallet(w.data);
    setTxs(t.data ?? []);
    setIntents(i.data ?? []);
  };
  useEffect(() => { refresh(); }, [user]);

  const requestTopUp = async () => {
    const amount = parseFloat(topUp);
    if (!amount || amount <= 0 || !user) return toast.error("أدخل مبلغاً صحيحاً");
    const g = getGateway(gateway);
    const { error } = await supabase.from("payment_intents").insert({
      user_id: user.id,
      amount,
      gateway,
      reference: reference || null,
    });
    if (error) return toast.error("تعذّر إرسال الطلب");
    toast.success(`✨ تم إرسال طلب الشحن عبر ${g?.name}. سيُراجع خلال 24 ساعة`);
    setTopUp(""); setReference("");
    refresh();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        <WalletGuard>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-display font-black text-gradient-primary">المحفظة فائقة الأمان</h1>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                محمية بـ PIN + بصمة الجهاز
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2 relative rounded-3xl bg-gradient-mystic p-8 text-primary-foreground overflow-hidden border border-accent/30"
            >
              <WalletIcon className="absolute -top-6 -end-6 h-44 w-44 opacity-10" />
              <Sparkles className="absolute bottom-4 end-4 h-8 w-8 text-accent/30 animate-pulse" />
              <div className="font-cyber text-xs tracking-widest mb-2 opacity-80">// MARED INFINITY WALLET</div>
              <div className="text-sm opacity-80 mb-1">ال€د المتاح</div>
              <motion.div
                key={wallet?.balance}
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="font-cyber text-5xl font-black shimmer-gold"
              >
                {formatYER(wallet?.balance ?? 0)}
              </motion.div>
              <div className="text-xs mt-2 opacity-70">{wallet?.currency ?? "YER"} • مشفّر AES-256</div>
            </motion.div>

            <div className="glass rounded-3xl p-6 border-2 border-accent/30">
              <h3 className="font-bold mb-4 flex items-center gap-2"><Plus className="h-5 w-5 text-accent" /> شحن سريع</h3>
              <Input
                type="number"
                value={topUp}
                onChange={(e) => setTopUp(e.target.value)}
                placeholder="المبلغ بالريال"
                className="mb-3 text-lg font-cyber"
              />
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="مرجع التحويل (اختياري)"
                className="mb-3 text-sm"
              />
              <Button variant="gold" className="w-full" onClick={requestTopUp}>
                <Upload className="h-4 w-4 ms-2" /> إرسال طلب الشحن
              </Button>
            </div>
          </div>

          {/* بوابات الدفع */}
          <div className="glass rounded-2xl p-6 mb-6">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" /> اختر بوابة الدفع
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {gateways.filter((g) => g.id !== "wallet" && g.id !== "cod").map((g) => (
                <motion.button
                  key={g.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setGateway(g.id)}
                  className={`text-start p-4 rounded-xl border-2 transition ${
                    gateway === g.id
                      ? "border-accent bg-accent/5 glow-gold"
                      : "border-border/50 hover:border-primary/50"
                  }`}
                >
                  <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${g.color} flex items-center justify-center text-xl mb-2`}>
                    {g.icon}
                  </div>
                  <div className="font-bold text-sm">{g.name}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{g.description}</div>
                  {g.fee ? <div className="text-[10px] text-accent font-cyber mt-1">رسوم {g.fee}%</div> : null}
                </motion.button>
              ))}
            </div>

            <AnimatePresence>
              {gateway && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/30"
                >
                  <div className="text-xs text-muted-foreground mb-1">تعليمات</div>
                  <div className="text-sm">{getGateway(gateway)?.instructions ?? "ادفع باستخدام البوابة المختارة"}</div>
                  {getGateway(gateway)?.account && (
                    <div className="mt-2 font-cyber text-accent text-lg shimmer-gold">
                      {getGateway(gateway)?.account}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* طلبات الشحن المعلّقة */}
          {intents.length > 0 && (
            <div className="glass rounded-2xl p-6 mb-6">
              <h2 className="font-bold mb-4">طلبات الشحن</h2>
              <div className="space-y-2">
                {intents.map((it) => {
                  const g = getGateway(it.gateway);
                  const color =
                    it.status === "approved" ? "text-green-400 bg-green-400/10" :
                    it.status === "rejected" ? "text-red-400 bg-red-400/10" :
                    "text-accent bg-accent/10";
                  return (
                    <div key={it.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                      <div className="text-2xl">{g?.icon ?? "💳"}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{g?.name ?? it.gateway}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(it.created_at)}{it.reference && ` • ${it.reference}`}</div>
                      </div>
                      <div className="text-end">
                        <div className="font-cyber font-bold">{formatYER(it.amount)}</div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${color}`}>
                          {it.status === "approved" ? "معتمد" : it.status === "rejected" ? "مرفوض" : "قيد المراجعة"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* المعاملات */}
          <div className="glass rounded-2xl p-6">
            <h2 className="font-bold mb-4">سجل المعاملات</h2>
            {txs.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">لا توجد معاملات بعد</div>
            ) : (
              <div className="space-y-2">
                {txs.map((t) => {
                  const isIn = ["credit", "escrow_release", "tip"].includes(t.type);
                  return (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30"
                    >
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isIn ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>
                        {isIn ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{t.description ?? t.type}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(t.created_at)} • {t.status}</div>
                      </div>
                      <div className={`font-cyber font-bold ${isIn ? "text-green-400" : "text-red-400"}`}>
                        {isIn ? "+" : "-"}{formatYER(t.amount)}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </WalletGuard>
      </main>
    </div>
  );
};

export default Wallet;
