import PageHeader from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Truck, Wallet, Shield, Headphones, Zap, Package, MapPin, CreditCard } from "lucide-react";
import { motion } from "framer-motion";

const services = [
  { icon: Truck, title: "توصيل سريع", desc: "توصيل خلال 24-48 ساعة لجميع محافظات ألمانيا", color: "text-primary" },
  { icon: Wallet, title: "محفظة رقمية", desc: "ادفع، اشحن وحوّل بكل أمان عبر محفظتك", color: "text-accent" },
  { icon: Shield, title: "حماية المشتري", desc: "ضمان استرداد كامل عند أي مشكلة", color: "text-primary" },
  { icon: Headphones, title: "دعم 24/7", desc: "فريق دعم متاح طوال الوقت لمساعدتك", color: "text-accent" },
  { icon: CreditCard, title: "دفع عند الاستلام", desc: "ادفع نقداً عند وصول طلبك إلى بابك", color: "text-primary" },
  { icon: Package, title: "تغليف احترافي", desc: "كل طلب يصل بأفضل تغليف وعناية", color: "text-accent" },
  { icon: MapPin, title: "تتبع مباشر", desc: "تابع شحنتك لحظة بلحظة على الخريطة", color: "text-primary" },
  { icon: Zap, title: "خدمات للأعمال", desc: "حلول B2B متكاملة للمصانع والشركات", color: "text-accent" },
];

const Services = () => (
  <div>
    <PageHeader badge="OUR SERVICES" title="خدماتنا" subtitle="منظومة متكاملة من الخدمات لتجربة تسوق لا مثيل لها" />
    <div className="container py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {services.map((s, i) => (
          <motion.div key={s.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
            <Card className="p-6 hover:border-primary/40 transition h-full group">
              <s.icon className={`h-10 w-10 ${s.color} mb-4 group-hover:scale-110 transition-transform`} />
              <h3 className="font-bold mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);
export default Services;
