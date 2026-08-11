import { motion } from "framer-motion";
import { useEffect } from "react";

interface Props {
  title: string;
  subtitle?: string;
  badge?: string;
  children?: React.ReactNode;
}

const PageHeader = ({ title, subtitle, badge, children }: Props) => {
  useEffect(() => { document.title = `${title} — مارد التفوق`; }, [title]);
  return (
    <section className="relative py-16 border-b border-border/50 overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute top-0 -right-32 h-64 w-64 rounded-full bg-primary/15 blur-[100px]" />
      <div className="absolute bottom-0 -left-32 h-64 w-64 rounded-full bg-accent/15 blur-[100px]" />
      <div className="container relative">
        {badge && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="inline-block text-xs font-cyber tracking-[0.3em] text-primary mb-3">// {badge}</motion.div>
        )}
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="text-4xl md:text-6xl font-black mb-3">
          <span className="text-gradient-primary">{title}</span>
        </motion.h1>
        {subtitle && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
            className="text-muted-foreground max-w-2xl text-lg">{subtitle}</motion.p>
        )}
        {children}
      </div>
    </section>
  );
};

export default PageHeader;
