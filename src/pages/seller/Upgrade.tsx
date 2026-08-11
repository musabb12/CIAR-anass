import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crown, Check, Sparkles, Zap, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";

interface Plan {
  id: string;
  code: string;
  name_ar: string;
  tagline: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  premium_badge: boolean;
  verified_badge: boolean;
  display_order: number;
}

const ICONS: Record<string, any> = {
  free: Star,
  silver: Sparkles,
  gold: Crown,
  platinum: Zap,
};

const SellerUpgrade = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: s }] = await Promise.all([
        supabase.from("subscription_plans").select("*").eq("is_active", true).order("display_order"),
        user ? supabase.from("stores").select("id").eq("owner_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      setPlans((p || []) as any);
      if (s?.id) {
        setStoreId(s.id);
        const { data: sub } = await supabase
          .from("store_subscriptions")
          .select("plan_id")
          .eq("store_id", s.id)
          .eq("status", "active")
          .maybeSingle();
        if (sub) setCurrentPlanId(sub.plan_id);
      }
    })();
  }, [user]);

  const subscribe = async (planId: string) => {
    if (!user) return toast.error("سجّل دخولك أولاً");
    if (!storeId) return toast.error("أنشئ متجرك أولاً قبل الت€ة");
    setLoadingId(planId);
    const { data, error } = await supabase.rpc("subscribe_to_plan", {
      _store_id: storeId,
      _plan_id: planId,
      _cycle: cycle,
    });
    setLoadingId(null);
    if (error) return toast.error(error.message);
    toast.success("🎉 تم تفعيل الباقة بنجاح!");
    setCurrentPlanId(planId);
  };

  return (
    <div className="container py-8 space-y-8">
      <PageHeader title="ت€ة متجرك 👑" subtitle="استثمر في نمو متجرك وضاعف مبيعاتك" />

      <div className="flex justify-center">
        <Tabs value={cycle} onValueChange={(v) => setCycle(v as any)}>
          <TabsList>
            <TabsTrigger value="monthly">شهري</TabsTrigger>
            <TabsTrigger value="yearly">
              سنوي <Badge variant="secondary" className="ms-2">وفّر 17%</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {plans.map((plan, i) => {
          const Icon = ICONS[plan.code] || Star;
          const isCurrent = currentPlanId === plan.id;
          const isHighlighted = plan.code === "gold";
          const price = cycle === "yearly" ? plan.price_yearly : plan.price_monthly;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card
                className={`relative p-6 h-full flex flex-col ${
                  isHighlighted
                    ? "border-accent border-2 bg-gradient-to-br from-accent/10 to-primary/5 shadow-elevated"
                    : "border-border/50"
                }`}
              >
                {isHighlighted && (
                  <Badge className="absolute -top-3 right-6 bg-accent text-accent-foreground">
                    ⭐ الأكثر شيوعاً
                  </Badge>
                )}

                <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 ${
                  isHighlighted ? "bg-accent/20 text-accent" : "bg-primary/10 text-primary"
                }`}>
                  <Icon className="h-6 w-6" />
                </div>

                <h3 className="text-xl font-bold mb-1">{plan.name_ar}</h3>
                <p className="text-xs text-muted-foreground mb-4">{plan.tagline}</p>

                <div className="mb-5">
                  <span className="text-3xl font-black">{price.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground"> €</span>
                  <span className="text-xs text-muted-foreground block mt-0.5">
                    /{cycle === "yearly" ? "سنوياً" : "شهرياً"}
                  </span>
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features?.map((f, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => subscribe(plan.id)}
                  disabled={isCurrent || loadingId === plan.id || plan.code === "free"}
                  variant={isHighlighted ? "default" : "outline"}
                  className="w-full"
                >
                  {loadingId === plan.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isCurrent ? (
                    "✓ باقتك الحالية"
                  ) : plan.code === "free" ? (
                    "الباقة المجانية"
                  ) : (
                    "اشترك الآن"
                  )}
                </Button>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="text-center text-xs text-muted-foreground max-w-2xl mx-auto pt-6 border-t border-border/50">
        💳 الدفع يتم خصمه من محفظتك مباشرة. يمكنك الإلغاء في أي وقت من لوحة التحكم.
        جميع الباقات تشمل دعماً فنياً ولوحة تحكم متطورة.
      </div>
    </div>
  );
};

export default SellerUpgrade;
