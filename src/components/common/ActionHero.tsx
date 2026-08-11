import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Sparkles } from "lucide-react";

interface Props {
  show: boolean;
  title?: string;
  subtitle?: string;
  onClose?: () => void;
}

/**
 * ✨ Action-Hero Animation
 * انفجار سينمائي ذهبي/بنفسجي يظهر عند نجاح المعاملات الكبرى
 * (تأكيد طلب، تحرير محفظة الإسكرو، ت€ة حساب)
 */
const ActionHero = ({ show, title = "تم بنجاح!", subtitle = "بإذن المارد", onClose }: Props) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md"
        >
          {/* Burst rays */}
          <motion.div
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: 1.4, rotate: 360 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute h-[600px] w-[600px] rounded-full bg-gradient-conic from-accent/30 via-primary/40 to-accent/30 blur-2xl opacity-70"
            style={{ background: "conic-gradient(from 0deg, hsl(var(--accent)/0.3), hsl(var(--primary)/0.4), hsl(var(--accent)/0.3))" }}
          />

          {/* Particles */}
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i / 24) * Math.PI * 2;
            const dx = Math.cos(angle) * 280;
            const dy = Math.sin(angle) * 280;
            return (
              <motion.div
                key={i}
                initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                animate={{ x: dx, y: dy, scale: [0, 1.2, 0.8], opacity: [0, 1, 0] }}
                transition={{ duration: 1.4, delay: i * 0.02, ease: "easeOut" }}
                className="absolute h-2 w-2 rounded-full"
                style={{
                  background: i % 2 ? "hsl(var(--accent))" : "hsl(var(--primary))",
                  boxShadow: `0 0 12px ${i % 2 ? "hsl(var(--accent))" : "hsl(var(--primary))"}`,
                }}
              />
            );
          })}

          {/* Core badge */}
          <motion.div
            initial={{ scale: 0, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: -30 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="relative z-10 flex flex-col items-center gap-4 px-8 py-10 rounded-3xl glass border border-accent/40 shadow-[0_0_60px_-10px_hsl(var(--accent)/0.6)]"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
            >
              <div className="absolute inset-0 rounded-full bg-accent/30 blur-xl animate-pulse" />
              <CheckCircle2 className="relative h-20 w-20 text-accent" strokeWidth={1.5} />
              <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-primary animate-pulse" />
            </motion.div>
            <div className="text-center">
              <div className="font-cyber text-2xl font-black text-gradient-primary">{title}</div>
              <div className="text-sm text-muted-foreground mt-1">{subtitle}</div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ActionHero;
