import { motion } from "framer-motion";
import { MapPin, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import NearbyStoresMap from "@/components/maps/NearbyStoresMap";

const NearbySection = () => {
  return (
    <section className="relative py-16 overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="absolute -top-32 right-0 h-80 w-80 rounded-full bg-primary/15 blur-[120px]" />
      <div className="absolute -bottom-32 left-0 h-80 w-80 rounded-full bg-accent/15 blur-[120px]" />

      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-end justify-between gap-4 mb-6"
        >
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-cyber tracking-[0.3em] text-accent mb-2">
              <MapPin className="h-3.5 w-3.5" />
              // LIVE MAP
            </div>
            <h2 className="text-3xl md:text-5xl font-black">
              <span className="text-gradient-primary">المتاجر القريبة</span>{" "}
              <span className="shimmer-gold">منك</span>
            </h2>
            <p className="text-muted-foreground mt-2 max-w-xl">
              نكتشف موقعك تلقائياً ونعرض لك كل المتاجر والخدمات حولك على خريطة حية ودقيقة.
            </p>
          </div>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/nearby">
              عرض الخريطة الكاملة
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <NearbyStoresMap radiusKm={25} limit={40} height={420} />
        </motion.div>
      </div>
    </section>
  );
};

export default NearbySection;
