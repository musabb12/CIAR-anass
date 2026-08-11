import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, KeyRound, Loader2, ExternalLink, Zap, ShieldCheck } from "lucide-react";
import { refreshAllIntegrations } from "@/hooks/useIntegration";

/**
 * One-click Stripe connect for the admin.
 * Admin pastes secret key → we validate it against Stripe → save it → activate.
 * No manual code changes required.
 */
const StripeConnectCard = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [secretKey, setSecretKey] = useState("");
  const [publishableKey, setPublishableKey] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [account, setAccount] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("app_integrations")
      .select("*")
      .eq("provider", "stripe")
      .maybeSingle();
    setStatus(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("stripe_integration")
      .on("postgres_changes", { event: "*", schema: "public", table: "app_integrations", filter: "provider=eq.stripe" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const connect = async () => {
    if (!secretKey.trim()) return toast.error("ضع مفتاح Stripe السري أولاً");
    setConnecting(true);
    setAccount(null);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-connect", {
        body: {
          secret_key: secretKey.trim(),
          publishable_key: publishableKey.trim() || undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAccount(data.account);
      toast.success(`✅ تم ربط Stripe بنجاح (${data.account.mode === "test" ? "وضع الاختبار" : "الوضع الحي"})`);
      setSecretKey("");
      setPublishableKey("");
      refreshAllIntegrations();
      await load();
      setTimeout(() => setOpen(false), 1500);
    } catch (e: any) {
      toast.error(e?.message ?? "فشل الربط");
    } finally {
      setConnecting(false);
    }
  };

  const disable = async () => {
    if (!confirm("تعطيل بوابة Stripe؟")) return;
    await (supabase as any)
      .from("app_integrations")
      .update({ enabled: false, status: "inactive" })
      .eq("provider", "stripe");
    toast.success("تم تعطيل Stripe");
    refreshAllIntegrations();
    load();
  };

  const isActive = status?.enabled && status?.status === "active";
  const mode = status?.config?.mode;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-4 border-2 border-primary/30 hover:border-primary/60 transition"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#635BFF] to-[#4C3FE4] flex items-center justify-center text-2xl shrink-0">
              💳
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm">Stripe — الربط الفوري الذكي</span>
                {loading ? (
                  <Badge variant="outline" className="text-[10px]"><Loader2 className="h-3 w-3 animate-spin" /></Badge>
                ) : isActive ? (
                  <Badge className="bg-green-500/20 text-green-500 text-[10px] gap-1">
                    <CheckCircle2 className="h-3 w-3" /> مفعّل {mode === "test" ? "(اختبار)" : "(حي)"}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <XCircle className="h-3 w-3" /> غير مربوط
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ضع مفتاح Stripe السري واضغط زر واحد — يتم التحقق منه ومزامنته تلقائياً بدون تعديل أي كود.
              </p>
              {isActive && status?.config?.account_id && (
                <p className="text-[10px] text-muted-foreground mt-1 font-mono truncate">
                  Account: {status.config.account_id}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="flex-1 gap-1.5 h-9 bg-[#635BFF] hover:bg-[#4C3FE4] text-white"
            onClick={() => setOpen(true)}
          >
            <Zap className="h-3.5 w-3.5" />
            {isActive ? "تحديث المفتاح" : "ربط بوابة الدفع الحقيقي"}
          </Button>
          {isActive && (
            <Button size="sm" variant="outline" className="h-9 text-xs" onClick={disable}>
              تعطيل
            </Button>
          )}
        </div>
      </motion.div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              ربط Stripe الفوري
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="glass rounded-lg p-3 flex items-start gap-2 text-xs">
              <ShieldCheck className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              <div className="text-muted-foreground leading-relaxed">
                المفتاح السري يُحفظ مشفّراً في خادم آمن ولا يُكشف أبداً للواجهة الأمامية.
                نتحقق منه بالاتصال بـ Stripe مباشرة قبل الحفظ.
              </div>
            </div>

            <div>
              <Label className="text-xs mb-1 block">
                Stripe Restricted / Secret Key <span className="text-destructive">*</span>
              </Label>
              <Input
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="sk_test_... أو rk_live_..."
                className="font-mono text-xs"
                disabled={connecting}
              />
              <a
                href="https://dashboard.stripe.com/apikeys"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-primary flex items-center gap-1 mt-1 hover:underline"
              >
                <ExternalLink className="h-3 w-3" /> احصل على مفتاحك من Stripe Dashboard
              </a>
            </div>

            <div>
              <Label className="text-xs mb-1 block">
                Publishable Key <span className="text-muted-foreground">(اختياري)</span>
              </Label>
              <Input
                value={publishableKey}
                onChange={(e) => setPublishableKey(e.target.value)}
                placeholder="pk_test_... أو pk_live_..."
                className="font-mono text-xs"
                disabled={connecting}
              />
            </div>

            {account && (
              <div className="glass rounded-lg p-3 border border-green-500/40 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-green-500">
                  <CheckCircle2 className="h-4 w-4" /> تم الربط بنجاح
                </div>
                <div className="text-muted-foreground">
                  <div>الحساب: <span className="font-mono">{account.id}</span></div>
                  {account.business_name && <div>الاسم: {account.business_name}</div>}
                  <div>الدولة: {account.country} • الوضع: {account.mode === "test" ? "اختبار" : "حي"}</div>
                </div>
              </div>
            )}

            <Button onClick={connect} disabled={connecting || !secretKey.trim()} className="w-full gap-2">
              {connecting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> جارٍ التحقق من Stripe...</>
              ) : (
                <><Zap className="h-4 w-4" /> تحقّق واحفظ وفعّل الآن</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StripeConnectCard;
