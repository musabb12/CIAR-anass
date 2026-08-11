import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Megaphone, TrendingUp, Eye, MousePointerClick, Plus, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";

const CAMPAIGN_TYPES = [
  { value: "search_boost", label: "🔍 هامبو€ز نتائج البحث", desc: "ظهور منتجك في أعلى نتائج البحث" },
  { value: "category_banner", label: "🎯 بانر فئة", desc: "بانر إعلاني داخل صفحة الفئة" },
  { value: "featured_product", label: "⭐ منتج مميز", desc: "ظهور في قسم المنتجات المميزة" },
  { value: "homepage_hero", label: "🏆 بطل الصفحة ال€سية", desc: "بانر كبير في الصفحة ال€سية" },
];

const SellerPromote = () => {
  const { user } = useAuth();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [credits, setCredits] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    campaign_type: "search_boost",
    bid_per_click: 50,
    daily_budget: 1000,
    total_budget: 5000,
    days: 7,
    target_city: "",
  });

  const load = async () => {
    if (!user) return;
    const { data: s } = await supabase.from("stores").select("id").eq("owner_id", user.id).maybeSingle();
    if (!s) return;
    setStoreId(s.id);
    const [{ data: c }, { data: sub }] = await Promise.all([
      supabase.from("ad_campaigns").select("*").eq("store_id", s.id).order("created_at", { ascending: false }),
      supabase.from("store_subscriptions").select("ad_credits_balance").eq("store_id", s.id).maybeSingle(),
    ]);
    setCampaigns(c || []);
    setCredits(Number(sub?.ad_credits_balance || 0));
  };

  useEffect(() => { load(); }, [user]);

  const launch = async () => {
    if (!storeId) return toast.error("أنشئ متجرك أولاً");
    if (!form.title.trim()) return toast.error("ضع عنواناً للحملة");
    if (form.total_budget < 500) return toast.error("الحد الأدنى للميزانية 500 €");

    setLoading(true);
    const { data, error } = await supabase.rpc("purchase_ad_campaign", {
      _store_id: storeId,
      _product_id: null,
      _campaign_type: form.campaign_type,
      _title: form.title,
      _image_url: null,
      _target_category: null,
      _target_city: form.target_city || null,
      _bid: form.bid_per_click,
      _daily_budget: form.daily_budget,
      _total_budget: form.total_budget,
      _days: form.days,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("🚀 تم إطلاق حملتك!");
    setOpen(false);
    load();
  };

  return (
    <div className="container py-8 space-y-6">
      <PageHeader title="حملاتي الإعلانية 📢" subtitle="عزّز ظهور متجرك ومنتجاتك بذكاء" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 bg-gradient-to-br from-accent/10 to-transparent border-accent/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">€د إعلاني</span>
            <Sparkles className="h-4 w-4 text-accent" />
          </div>
          <div className="text-2xl font-black text-accent">{credits.toLocaleString()} €</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">حملات نشطة</span>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-black">{campaigns.filter((c) => c.status === "active").length}</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">إجمالي النقرات</span>
            <MousePointerClick className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-black">
            {campaigns.reduce((a, c) => a + (c.clicks || 0), 0).toLocaleString()}
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="default">
              <Plus className="h-4 w-4 ms-1" /> حملة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>🚀 إطلاق حملة إعلانية</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>عنوان الحملة</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="عرض الجمعة الذهبية" />
              </div>
              <div>
                <Label>نوع الإعلان</Label>
                <Select value={form.campaign_type} onValueChange={(v) => setForm({ ...form, campaign_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CAMPAIGN_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <div>
                          <div className="font-medium">{t.label}</div>
                          <div className="text-xs text-muted-foreground">{t.desc}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>سعر النقرة (€)</Label>
                  <Input type="number" value={form.bid_per_click} onChange={(e) => setForm({ ...form, bid_per_click: +e.target.value })} />
                </div>
                <div>
                  <Label>المدة (أيام)</Label>
                  <Input type="number" value={form.days} onChange={(e) => setForm({ ...form, days: +e.target.value })} />
                </div>
                <div>
                  <Label>الميزانية اليومية</Label>
                  <Input type="number" value={form.daily_budget} onChange={(e) => setForm({ ...form, daily_budget: +e.target.value })} />
                </div>
                <div>
                  <Label>الميزانية الإجمالية</Label>
                  <Input type="number" value={form.total_budget} onChange={(e) => setForm({ ...form, total_budget: +e.target.value })} />
                </div>
              </div>
              <div>
                <Label>المدينة المستهدفة (اختياري)</Label>
                <Input value={form.target_city} onChange={(e) => setForm({ ...form, target_city: e.target.value })} placeholder="ب€ن، ميونخ..." />
              </div>
              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                💡 سيُخصم {form.total_budget.toLocaleString()} € — يُستخدم €دك الإعلاني أولاً ({credits.toLocaleString()} €) ثم محفظتك.
              </div>
              <Button onClick={launch} disabled={loading} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "🚀 إطلاق الحملة"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {campaigns.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">
            <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-30" />
            لا توجد حملات بعد. أطلق أول حملة لهامبو€ز متجرك!
          </Card>
        ) : (
          campaigns.map((c) => {
            const pct = c.total_budget > 0 ? Math.min(100, (c.spent / c.total_budget) * 100) : 0;
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="p-5">
                  <div className="flex items-start justify-between mb-3 gap-3">
                    <div>
                      <div className="font-bold mb-1">{c.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {CAMPAIGN_TYPES.find((t) => t.value === c.campaign_type)?.label}
                      </div>
                    </div>
                    <Badge variant={c.status === "active" ? "default" : "secondary"}>
                      {c.status === "active" ? "🟢 نشطة" : c.status === "finished" ? "✅ منتهية" : c.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center text-xs mb-3">
                    <div>
                      <Eye className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <div className="font-bold">{c.impressions}</div>
                      <div className="text-muted-foreground">ظهور</div>
                    </div>
                    <div>
                      <MousePointerClick className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <div className="font-bold">{c.clicks}</div>
                      <div className="text-muted-foreground">نقرة</div>
                    </div>
                    <div>
                      <TrendingUp className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <div className="font-bold">{Number(c.spent).toLocaleString()}</div>
                      <div className="text-muted-foreground">مصروف</div>
                    </div>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                  <div className="text-[10px] text-muted-foreground mt-1.5">
                    {Number(c.spent).toLocaleString()} / {Number(c.total_budget).toLocaleString()} €
                  </div>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SellerPromote;
