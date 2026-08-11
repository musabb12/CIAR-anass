import { motion } from "framer-motion";
import { useState } from "react";
import { Package, MapPin, Receipt, Sparkles } from "lucide-react";
import { Slider } from "@/components/ui/slider";

const PricingEngine = () => {
  const [productPrice, setProductPrice] = useState(15000);
  const [distanceKm, setDistanceKm] = useState(8);

  const baseDelivery = 500;
  const perKm = 250;
  const deliveryFee = baseDelivery + distanceKm * perKm;
  const serviceFee = Math.round(productPrice * 0.04);
  const total = productPrice + deliveryFee + serviceFee;

  const fmt = (n: number) => n.toLocaleString("ar-YE") + " €";

  return (
    <section id="pricing" className="relative py-24">
      <div className="container">
        <div className="text-center mb-16">
          <div className="inline-block text-xs font-cyber tracking-[0.3em] text-primary mb-3">// DYNAMIC PRICING ENGINE</div>
          <h2 className="text-4xl md:text-6xl font-black mb-4">
            احسب التكلفة <span className="text-gradient-primary">لحظياً</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            محرك تسعير شفاف يحسب كل بند بدقة احترافية متطورة. جرّبه الآن.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Inputs */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass rounded-2xl p-8"
          >
            <h3 className="font-cyber text-sm tracking-widest text-primary mb-6">// INPUT PARAMETERS</h3>

            <div className="space-y-8">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Package className="h-4 w-4 text-primary" />
                    سعر المنتج
                  </label>
                  <span className="font-cyber text-primary">{fmt(productPrice)}</span>
                </div>
                <Slider value={[productPrice]} onValueChange={(v) => setProductPrice(v[0])} min={1000} max={200000} step={1000} />
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="h-4 w-4 text-accent" />
                    مسافة التوصيل
                  </label>
                  <span className="font-cyber text-accent">{distanceKm} كم</span>
                </div>
                <Slider value={[distanceKm]} onValueChange={(v) => setDistanceKm(v[0])} min={1} max={50} step={1} />
              </div>
            </div>
          </motion.div>

          {/* Output */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-2xl p-8 bg-gradient-card border border-primary/30 overflow-hidden"
          >
            <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />

            <h3 className="font-cyber text-sm tracking-widest text-accent mb-6 relative">// LIVE COMPUTATION</h3>

            <div className="relative space-y-3 mb-6">
              {[
                { label: "سعر المنتج",   value: productPrice, icon: Package },
                { label: "رسوم التوصيل (ذكية)", value: deliveryFee, icon: MapPin, hint: `${distanceKm} كم × 250` },
                { label: "رسوم الخدمة (4٪)", value: serviceFee, icon: Receipt },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <row.icon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm">{row.label}</div>
                      {row.hint && <div className="text-[10px] font-cyber text-muted-foreground">{row.hint}</div>}
                    </div>
                  </div>
                  <span className="font-cyber text-foreground">{fmt(row.value)}</span>
                </div>
              ))}
            </div>

            <div className="relative rounded-xl bg-gradient-primary p-5 flex items-center justify-between">
              <div>
                <div className="text-xs font-cyber text-primary-foreground/70 tracking-widest mb-1">TOTAL</div>
                <div className="font-cyber text-2xl md:text-3xl font-black text-primary-foreground">{fmt(total)}</div>
              </div>
              <Sparkles className="h-10 w-10 text-primary-foreground/80" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PricingEngine;
