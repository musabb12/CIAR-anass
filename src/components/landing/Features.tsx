import { motion } from "framer-motion";
import { Wallet, MapPin, Building2, Briefcase, Palette, Banknote } from "lucide-react";

const FEATURES = [
  {
    icon: Palette,
    title: "صفحات هبوط ذكية",
    desc: "بانٍ تلقائي يسمح للبائعين بتخصيص متاجرهم: شعار، خلفيات، ألوان، وقوالب بنقرة واحدة.",
    badge: "Smart Builder",
    accent: "blue",
  },
  {
    icon: MapPin,
    title: "محرك التسعير الديناميكي",
    desc: "السعر النهائي = سعر المنتج + رسوم توصيل ذكية حسب المسافة + رسوم الخدمة. شفّاف ولحظي.",
    badge: "Dynamic Pricing",
    accent: "gold",
  },
  {
    icon: Wallet,
    title: "المحفظة الموحّدة",
    desc: "نظام مالي متكامل لإدارة الأرباح، إكراميات الوقود/الغاز، ورواتب الموظفين من مكان واحد.",
    badge: "Unified Wallet",
    accent: "blue",
  },
  {
    icon: Briefcase,
    title: "لوحة الوظائف المتقدمة",
    desc: "للشركات: انشر وظائف وفلتر المتقدمين. للباحثين: تقدّم وارفع سيرتك دون مغادرة التطبيق.",
    badge: "Job Board",
    accent: "gold",
  },
  {
    icon: Building2,
    title: "مركز B2B للمصانع",
    desc: "قسم مخصص لأصحاب المصانع لإدارة الاستيراد والتصدير والطلبيات بالجملة بأدوات احترافية.",
    badge: "B2B Hub",
    accent: "blue",
  },
  {
    icon: Banknote,
    title: "إكراميات وقود ذكية",
    desc: "حاسبة إكراميات تلقائية للموصلين لتغطية الوقود والغاز، عادلة وم€ة للجميع.",
    badge: "Fuel Tips",
    accent: "gold",
  },
];

const Features = () => {
  return (
    <section id="features" className="relative py-24 bg-surface-elevated/30">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="container relative">
        <div className="text-center mb-16">
          <div className="inline-block text-xs font-cyber tracking-[0.3em] text-accent mb-3">// CORE MODULES</div>
          <h2 className="text-4xl md:text-6xl font-black mb-4">
            منظومة <span className="text-gradient-gold">احترافية متطورة الدقة</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            ست وحدات أساسية تعمل معاً كآلة واحدة لتشغيل كامل اقتصادك الرقمي.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => {
            const isGold = f.accent === "gold";
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="group relative rounded-2xl p-6 bg-gradient-card border border-border/50 hover:border-primary/40 transition-all duration-500 overflow-hidden"
              >
                {/* Corner cut */}
                <div className="absolute top-0 right-0 h-px w-16 bg-gradient-to-l from-primary/0 via-primary to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 h-px w-16 bg-gradient-to-r from-accent/0 via-accent to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-start justify-between mb-5">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${isGold ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"}`}>
                    <f.icon className="h-6 w-6" />
                  </div>
                  <span className={`text-[10px] font-cyber tracking-wider px-2 py-1 rounded ${isGold ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"}`}>
                    {f.badge}
                  </span>
                </div>

                <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
