import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Factory, Globe, Truck, BarChart3, FileText, Package, Users, TrendingUp } from "lucide-react";

const FactoryDashboard = () => {
  const stats = [
    { icon: Factory,    label: "أوامر إنتاج",       value: "23",      c: "primary" },
    { icon: Truck,      label: "شحنات قيد التسليم", value: "8",       c: "accent" },
    { icon: Globe,      label: "عقود تصدير نشطة",   value: "5",       c: "primary" },
    { icon: BarChart3,  label: "إيرادات الشهر",     value: "47M €", c: "accent" },
  ];

  const wholesaleOrders = [
    { client: "مجموعة هائل سعيد",  qty: "5,000 وحدة",  value: "12.5M €", status: "negotiation", country: "🇾🇪 ب€ن" },
    { client: "مؤسسة الكميم",      qty: "1,200 كرتون", value: "3.8M €",  status: "pending",     country: "🇾🇪 ميونخ" },
    { client: "العالمية للتجارة",   qty: "800 وحدة",    value: "2.1M €",  status: "approved",    country: "🇸🇦 جدة" },
    { client: "Gulf Imports LLC",   qty: "10,000 وحدة", value: "$45,000",   status: "production",  country: "🇦🇪 دبي" },
  ];

  const productionLines = [
    { name: "خط التعبئة A", utilization: 87, output: "1,240/يوم" },
    { name: "خط التعبئة B", utilization: 64, output: "920/يوم" },
    { name: "خط التغليف",  utilization: 92, output: "2,100/يوم" },
  ];

  const statusBadge = (s: string) => {
    const map: Record<string, { l: string; v: any }> = {
      negotiation: { l: "قيد التفاوض", v: "secondary" },
      pending:     { l: "تأكيد مطلوب", v: "outline" },
      approved:    { l: "موافق عليه",  v: "default" },
      production:  { l: "قيد الإنتاج", v: "default" },
    };
    const c = map[s] ?? { l: s, v: "secondary" };
    return <Badge variant={c.v as any} className="text-[10px]">{c.l}</Badge>;
  };

  return (
    <DashboardShell role="factory" title="🏭 مركز قيادة المصنع" subtitle="إدارة B2B، الجملة، الاستيراد والتصدير، خطوط الإنتاج المباشرة.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-xl p-5">
            <s.icon className={`mb-3 h-5 w-5 ${s.c === "accent" ? "text-accent" : "text-primary"}`} />
            <div className="font-cyber text-xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* B2B orders */}
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> طلبيات الجملة B2B</h2>
            <Button variant="gold" size="sm">+ عرض جديد</Button>
          </div>
          <div className="space-y-3">
            {wholesaleOrders.map((row, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50 hover:border-primary/40 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{row.client}</span>
                    <span className="text-xs">{row.country}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                    <span><Package className="h-3 w-3 inline ms-1" /> {row.qty}</span>
                  </div>
                </div>
                <div className="text-left">
                  <div className="font-cyber text-primary text-sm font-bold">{row.value}</div>
                  <div className="mt-1">{statusBadge(row.status)}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Production lines */}
        <div className="space-y-6">
          <div className="glass rounded-2xl p-6">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-accent" /> خطوط الإنتاج</h2>
            <div className="space-y-4">
              {productionLines.map((l, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">{l.name}</span>
                    <span className="text-muted-foreground">{l.output}</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${l.utilization}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className={`h-full ${l.utilization > 80 ? "bg-accent" : "bg-primary"}`}
                    />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">{l.utilization}% استغلال</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h2 className="text-base font-bold mb-3 flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> العملاء النشطون</h2>
            <div className="font-cyber text-3xl font-black text-gradient-primary">142</div>
            <div className="text-xs text-muted-foreground mt-1">+12 هذا الأسبوع</div>
            <Button variant="outline" size="sm" className="w-full mt-4">إدارة العملاء</Button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
};

export default FactoryDashboard;
