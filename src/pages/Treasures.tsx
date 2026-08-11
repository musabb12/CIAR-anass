import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Clock, Lock, Flame } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatYER } from "@/lib/format";

const Treasures = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    if (!user) return;
    supabase.from("products")
      .select("*")
      .not("discount_price", "is", null)
      .order("discount_price", { ascending: true })
      .limit(8)
      .then(({ data }) => setProducts(data ?? []));
  }, [user]);

  // Countdown to midnight
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(); end.setHours(23, 59, 59, 999);
      const diff = +end - +now;
      setTimeLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container py-20 max-w-2xl mx-auto text-center">
          <div className="glass-gold rounded-3xl p-12">
            <Lock className="h-20 w-20 text-accent mx-auto mb-6 animate-genie-glow" />
            <h1 className="font-display text-4xl font-black mb-4">
              <span className="shimmer-gold">كنوز المارد</span>
            </h1>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              قسم س€ لأعضاء النادي فقط ✨<br />
              عروض حصرية تظهر وتختفي بسرعة. سجّل دخولك لتفتح الخزينة.
            </p>
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-mystic animate-mystic-pulse">
                ادخل عالم المارد
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PageHeader
        title="🧞 كنوز المارد"
        subtitle="عروض حصرية تختفي بانتهاء الوقت — لا تفوّتها يا سيدي"
      />
      <main className="container py-8">
        {/* Countdown */}
        <div className="glass-gold rounded-2xl p-6 mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3 text-accent">
            <Flame className="h-5 w-5 animate-pulse" />
            <span className="font-display font-bold">العرض ينتهي خلال</span>
            <Flame className="h-5 w-5 animate-pulse" />
          </div>
          <div className="flex justify-center gap-3 font-cyber">
            {[
              { v: timeLeft.h, l: "ساعة" },
              { v: timeLeft.m, l: "دقيقة" },
              { v: timeLeft.s, l: "ثانية" },
            ].map((t, i) => (
              <div key={i} className="bg-background/60 backdrop-blur rounded-xl px-4 py-2 min-w-[64px]">
                <div className="text-2xl font-black text-accent">{String(t.v).padStart(2, "0")}</div>
                <div className="text-[10px] text-muted-foreground">{t.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Treasures Grid */}
        {products.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            لا كنوز متاحة الآن. عُد قريباً ✨
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p, i) => {
              const discount = Math.round((1 - Number(p.discount_price) / Number(p.price)) * 100);
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link to={`/product/${p.id}`} className="group block">
                    <div className="glass rounded-2xl overflow-hidden hover:border-accent/60 transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_hsl(51_100%_50%/0.3)]">
                      <div className="relative aspect-square bg-secondary/30 overflow-hidden">
                        <img src={p.images?.[0] ?? "/placeholder.svg"} alt={p.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute top-2 start-2 bg-gradient-mystic text-accent text-xs font-cyber font-bold px-2 py-1 rounded-full flex items-center gap-1">
                          <Sparkles className="h-3 w-3" /> كنز
                        </div>
                        <div className="absolute top-2 end-2 bg-destructive text-destructive-foreground text-xs font-cyber font-bold px-2 py-1 rounded-full">
                          -{discount}%
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="text-sm font-medium line-clamp-2 mb-2 h-10">{p.name}</div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-cyber text-accent font-bold">{formatYER(p.discount_price)}</span>
                          <span className="text-[11px] line-through text-muted-foreground">{formatYER(p.price)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Treasures;
