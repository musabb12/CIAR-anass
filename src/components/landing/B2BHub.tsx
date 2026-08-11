import { motion } from "framer-motion";
import { Factory, Globe, Truck, BarChart3, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const B2BHub = () => {
  return (
    <section id="b2b" className="relative py-24">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="container relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="relative aspect-square max-w-md mx-auto">
              {/* Central hexagon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative h-48 w-48 rounded-3xl bg-gradient-card border border-primary/40 glow-blue flex items-center justify-center">
                  <Factory className="h-20 w-20 text-primary" strokeWidth={1.2} />
                  <div className="absolute inset-0 rounded-3xl border border-primary/20 animate-pulse-glow" />
                </div>
              </div>

              {/* Orbiting nodes */}
              {[
                { Icon: Globe,     pos: "top-0 left-1/2 -translate-x-1/2",        accent: "accent" },
                { Icon: Truck,     pos: "right-0 top-1/2 -translate-y-1/2",       accent: "primary" },
                { Icon: BarChart3, pos: "bottom-0 left-1/2 -translate-x-1/2",     accent: "accent" },
                { Icon: Factory,   pos: "left-0 top-1/2 -translate-y-1/2",        accent: "primary" },
              ].map((node, i) => (
                <div key={i} className={`absolute ${node.pos} h-16 w-16 rounded-2xl glass flex items-center justify-center animate-float`} style={{ animationDelay: `${i * 0.5}s` }}>
                  <node.Icon className={`h-7 w-7 ${node.accent === "accent" ? "text-accent" : "text-primary"}`} />
                </div>
              ))}

              {/* Connecting lines (decorative) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 400" fill="none">
                <circle cx="200" cy="200" r="160" stroke="hsl(var(--primary) / 0.2)" strokeDasharray="4 6" />
                <circle cx="200" cy="200" r="120" stroke="hsl(var(--accent) / 0.15)" strokeDasharray="2 8" />
              </svg>
            </div>
          </motion.div>

          {/* Right content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-block text-xs font-cyber tracking-[0.3em] text-primary mb-3">// B2B HUB</div>
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              مركز قيادة <span className="text-gradient-primary">المصانع</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              قسم احترافي مخصص لأصحاب المصانع لإدارة عمليات الاستيراد والتصدير،
              التعامل مع الطلبيات بالجملة، وربط سلسلة التوريد بكفاءة احترافية متطورة.
            </p>

            <ul className="space-y-4 mb-8">
              {[
                { title: "إدارة الجملة", desc: "أنشئ كاتالوج بأسعار متدرجة حسب الكمية" },
                { title: "استيراد/تصدير", desc: "تتبع الشحنات الدولية ووثائق الجمارك" },
                { title: "تحليلات متقدمة", desc: "لوحات بيانات لحظية للإنتاج والمبيعات" },
              ].map((item, i) => (
                <li key={i} className="flex gap-4">
                  <div className="flex-shrink-0 mt-1 h-6 w-6 rounded-md bg-primary/15 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-sm bg-primary" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">{item.title}</div>
                    <div className="text-sm text-muted-foreground">{item.desc}</div>
                  </div>
                </li>
              ))}
            </ul>

            <Button variant="hero" size="lg" className="h-12">
              سجّل مصنعك <ArrowLeft className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default B2BHub;
