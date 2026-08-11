import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Settings, ExternalLink, Plug, KeyRound, RefreshCw, Zap, Loader2, ShieldCheck } from "lucide-react";
import { refreshAllIntegrations } from "@/hooks/useIntegration";
import StripeConnectCard from "./StripeConnectCard";

// Providers that require additional fields beyond the primary secret.
const EXTRA_FIELDS: Record<string, { key: string; label: string; placeholder?: string }[]> = {
  twilio: [{ key: "account_sid", label: "Account SID", placeholder: "AC..." }],
  onesignal: [{ key: "app_id", label: "App ID" }],
  cloudinary: [
    { key: "cloud_name", label: "Cloud Name" },
    { key: "api_key", label: "API Key" },
  ],
  agora: [{ key: "app_id", label: "App ID" }],
};

const SECRET_PLACEHOLDER: Record<string, string> = {
  stripe: "sk_test_... / sk_live_...",
  openai: "sk-...",
  google_maps: "AIzaSy...",
  mapbox: "pk.ey... / sk.ey...",
  resend: "re_...",
  twilio: "Auth Token",
  whatsapp: "Meta Access Token",
  onesignal: "REST API Key",
  cloudinary: "API Secret",
  sentry: "Auth Token",
  firebase: "Server Key",
  agora: "App Certificate",
};

interface Integration {
  id: string;
  provider: string;
  category: string;
  display_name: string;
  description: string | null;
  icon: string | null;
  docs_url: string | null;
  public_key: string | null;
  config: Record<string, any>;
  has_secret: boolean;
  secret_name: string | null;
  enabled: boolean;
  status: string;
  last_error: string | null;
  last_tested_at: string | null;
}

const CATEGORY_LABEL: Record<string, string> = {
  maps: "🗺️ الخرائط والملاحة",
  ai: "🤖 الذكاء الاصطناعي",
  payments: "💳 الدفع الإلكتروني",
  messaging: "💬 الرسائل والـ SMS",
  notifications: "🔔 الإشعارات",
  video: "🎥 الفيديو والمكالمات",
  storage: "🖼️ التخزين والوسائط",
  email: "📧 البريد الإلكتروني",
  monitoring: "🐛 المراقبة",
};

const IntegrationsManager = () => {
  const [items, setItems] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Integration | null>(null);
  const [form, setForm] = useState<{
    secret_key: string;
    public_key: string;
    extras: Record<string, string>;
  }>({ secret_key: "", public_key: "", extras: {} });
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("app_integrations")
      .select("*")
      .order("category", { ascending: true })
      .order("display_name", { ascending: true });
    if (error) toast.error("فشل تحميل التكاملات: " + error.message);
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // Realtime: auto-refresh cards the moment a verify saves new config
    const ch = supabase
      .channel("app_integrations_admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "app_integrations" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const openEditor = (it: Integration) => {
    setEditing(it);
    setVerifyResult(null);
    const cfg = it.config ?? {};
    const extras: Record<string, string> = {};
    (EXTRA_FIELDS[it.provider] ?? []).forEach((f) => { extras[f.key] = String(cfg[f.key] ?? ""); });
    setForm({ secret_key: "", public_key: it.public_key ?? "", extras });
  };

  const verifyAndActivate = async () => {
    if (!editing) return;
    if (!form.secret_key.trim()) return toast.error("ضع المفتاح السري الحقيقي أولاً");
    setVerifying(true);
    setVerifyResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("integration-verify", {
        body: {
          provider: editing.provider,
          secret_key: form.secret_key.trim(),
          publishable_key: form.public_key.trim() || undefined,
          config_extras: form.extras,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setVerifyResult(data.account);
      toast.success(`✅ ${editing.display_name} — تم التحقق وتفعيله فوراً`);
      refreshAllIntegrations();
      await load();
    } catch (e: any) {
      toast.error("فشل التحقق: " + (e?.message ?? "المفتاح مرفوض"));
      await (supabase as any).from("app_integrations")
        .update({ last_error: String(e?.message ?? "verify failed") })
        .eq("id", editing.id);
    } finally {
      setVerifying(false);
    }
  };

  const quickToggle = async (it: Integration, enabled: boolean) => {
    if (enabled && !it.has_secret) {
      toast.error("اربط المفتاح الحقيقي أولاً بالضغط على زر التحقق");
      openEditor(it);
      return;
    }
    const { error } = await (supabase as any)
      .from("app_integrations")
      .update({ enabled, status: enabled ? "active" : "inactive" })
      .eq("id", it.id);
    if (error) return toast.error(error.message);
    toast.success(enabled ? "✅ تم التفعيل" : "تم الإيقاف");
    refreshAllIntegrations();
    load();
  };


  const grouped = items.reduce<Record<string, Integration[]>>((acc, it) => {
    (acc[it.category] ??= []).push(it);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Plug className="h-5 w-5 text-primary" /> تكاملات API الذكية
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            أضف مفاتيح أي خدمة وفعّلها — ستعمل في التطبيق فوراً وتلقائياً دون إعادة تشغيل.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={load} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" /> تحديث
        </Button>
      </div>

      {loading && <div className="text-center py-10 text-sm text-muted-foreground">جارٍ التحميل...</div>}

      {/* Priority: One-click Stripe payment gateway connect */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-muted-foreground">💳 بوابة الدفع الرئيسية</h3>
        <StripeConnectCard />
      </div>


      {Object.entries(grouped).map(([cat, list]) => (
        <div key={cat} className="space-y-2">
          <h3 className="text-sm font-bold text-muted-foreground">{CATEGORY_LABEL[cat] ?? cat}</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {list.map((it) => (
              <motion.div
                key={it.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl p-4 border border-border/40 hover:border-primary/40 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl">
                      {it.icon ?? "🔌"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm">{it.display_name}</span>
                        {it.enabled ? (
                          <Badge className="bg-green-500/20 text-green-400 text-[10px] gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            مفعّل {it.config?.mode ? `(${it.config.mode === "test" ? "اختبار" : "حي"})` : ""}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] gap-1">
                            <XCircle className="h-3 w-3" /> غير مفعّل
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{it.description}</p>
                      {it.enabled && (it.config?.account_label || it.config?.account_id) && (
                        <p className="text-[10px] text-green-500/90 mt-1 truncate">
                          🔗 {it.config.account_label ?? it.config.account_id}
                        </p>
                      )}
                      {it.last_tested_at && (
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                          آخر تحقق: {new Date(it.last_tested_at).toLocaleString("ar")}
                        </p>
                      )}
                      {it.last_error && (
                        <p className="text-[10px] text-destructive mt-1 truncate">⚠️ {it.last_error}</p>
                      )}
                    </div>

                  </div>
                  <Switch checked={it.enabled} onCheckedChange={(v) => quickToggle(it, v)} />
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Button size="sm" variant="outline" className="flex-1 gap-1.5 h-8 text-xs" onClick={() => openEditor(it)}>
                    <Settings className="h-3.5 w-3.5" /> الإعدادات والمفاتيح
                  </Button>
                  {it.docs_url && (
                    <a href={it.docs_url} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              إعداد {editing?.display_name}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="glass rounded-lg p-3 flex items-start gap-2 text-xs">
                <ShieldCheck className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                <div className="text-muted-foreground leading-relaxed">
                  المفتاح يُختبر بالاتصال المباشر بمزوّد الخدمة الحقيقي — لا يُحفظ ولا يُفعّل إلا إذا نجح التحقق.
                </div>
              </div>

              <div>
                <Label className="text-xs mb-1 block">
                  المفتاح السري الحقيقي <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="password"
                  value={form.secret_key}
                  onChange={(e) => setForm({ ...form, secret_key: e.target.value })}
                  placeholder={SECRET_PLACEHOLDER[editing.provider] ?? "المفتاح الحقيقي"}
                  className="font-mono text-xs"
                  disabled={verifying}
                />
              </div>

              {(EXTRA_FIELDS[editing.provider] ?? []).map((f) => (
                <div key={f.key}>
                  <Label className="text-xs mb-1 block">{f.label} <span className="text-destructive">*</span></Label>
                  <Input
                    value={form.extras[f.key] ?? ""}
                    onChange={(e) => setForm({ ...form, extras: { ...form.extras, [f.key]: e.target.value } })}
                    placeholder={f.placeholder}
                    className="font-mono text-xs"
                    disabled={verifying}
                  />
                </div>
              ))}

              <div>
                <Label className="text-xs mb-1 block">
                  Publishable / Public Key <span className="text-muted-foreground">(اختياري)</span>
                </Label>
                <Input
                  value={form.public_key}
                  onChange={(e) => setForm({ ...form, public_key: e.target.value })}
                  placeholder="pk_..."
                  className="font-mono text-xs"
                  disabled={verifying}
                />
              </div>

              {verifyResult && (
                <div className="glass rounded-lg p-3 border border-green-500/40 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-green-500">
                    <CheckCircle2 className="h-4 w-4" /> تم التحقق وتفعيله في التطبيق
                  </div>
                  <div className="text-muted-foreground space-y-0.5">
                    {verifyResult.account_label && <div>الحساب: {verifyResult.account_label}</div>}
                    {verifyResult.account_id && <div className="font-mono truncate">ID: {verifyResult.account_id}</div>}
                    <div>الوضع: {verifyResult.mode === "test" ? "اختبار" : "حي"}</div>
                  </div>
                </div>
              )}

              {editing.docs_url && (
                <a href={editing.docs_url} target="_blank" rel="noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline">
                  <ExternalLink className="h-3 w-3" /> كيف أحصل على المفتاح؟
                </a>
              )}

              <div className="flex gap-2">
                <Button onClick={verifyAndActivate} disabled={verifying || !form.secret_key.trim()} className="flex-1 gap-2">
                  {verifying ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> جارٍ التحقق مع المزوّد...</>
                  ) : (
                    <><Zap className="h-4 w-4" /> تحقّق وفعّل الآن</>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setEditing(null)} disabled={verifying}>إغلاق</Button>
              </div>
            </div>
          )}

        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IntegrationsManager;
