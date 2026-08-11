import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import ciarLogo from "@/assets/ciar-logo.png";

const SplashScreen = () => {
  const [show, setShow] = useState(() => !sessionStorage.getItem("mared_splash_shown"));

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => {
      sessionStorage.setItem("mared_splash_shown", "1");
      setShow(false);
    }, 3600);
    return () => clearTimeout(t);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05, filter: "blur(20px)" }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background overflow-hidden"
        >
          {/* mystical orbs */}
          <div className="absolute h-[70vmin] max-h-[500px] w-[70vmin] max-w-[500px] rounded-full bg-primary/30 blur-[90px] sm:blur-[140px] animate-mystic-pulse" />
          <div className="absolute h-[62vmin] max-h-[400px] w-[62vmin] max-w-[400px] rounded-full bg-accent/20 blur-[80px] sm:blur-[120px]" />
          <div className="absolute inset-0 grid-bg opacity-40" />

          {/* genie smoke ribbons rising */}
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className="absolute bottom-0 h-3 w-3 rounded-full bg-gradient-mystic animate-genie-smoke"
              style={{
                left: `${15 + i * 10}%`,
                animationDelay: `${i * 0.25}s`,
                animationDuration: `${2.5 + (i % 3) * 0.5}s`,
              }}
            />
          ))}

           <div className="relative z-10 w-full max-w-full text-center px-5">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 1.2, type: "spring" }}
               className="mb-6 sm:mb-8 inline-flex"
            >
              <div className="relative h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-gradient-mystic flex items-center justify-center animate-genie-glow overflow-hidden">
                <img src={ciarLogo} alt="شعار CiAR" className="h-[78%] w-[78%] object-contain drop-shadow-[0_4px_18px_rgba(0,0,0,0.35)]" />
                <div className="absolute inset-0 rounded-full border-2 border-accent/40 animate-ping" />
              </div>

            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
               className="font-display text-4xl sm:text-5xl md:text-7xl font-black mb-3 leading-tight"
            >
              <span className="text-gradient-primary">مارد </span>
              <span className="shimmer-gold">التفوق</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="text-base md:text-lg text-foreground/90 max-w-xl mx-auto leading-relaxed font-display"
            >
              لسنا مجرد متجر، نحن نظامك البيئي الجديد..
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8, duration: 0.8 }}
              className="text-sm md:text-base text-accent/90 mt-2 font-display"
            >
              تسوّق، وظِّف، وابنِ مستقبلك من مكانك.
            </motion.p>

            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.4, duration: 3 }}
               className="mt-8 sm:mt-10 mx-auto h-0.5 w-40 max-w-[70vw] bg-gradient-gold rounded-full"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
