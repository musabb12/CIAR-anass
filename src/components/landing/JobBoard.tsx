import { motion } from "framer-motion";
import { Briefcase, MapPin, Building2, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const SAMPLE_JOBS = [
  { title: "مهندس تطوير برمجيات", company: "شركة سبأ التقنية", city: "ب€ن", type: "دوام كامل", salary: "650,000 €" },
  { title: "مدير عمليات لوجستية",  company: "مارد للخدمات اللوجستية",  city: "ميونخ",   type: "دوام كامل", salary: "4.200 €" },
  { title: "مصمم جرافيك",         company: "ستوديو نِكسس",      city: "هامبورغ",  type: "عن بعد",   salary: "400,000 €" },
  { title: "موصِّل دراجة نارية",    company: "مارد التفوق",        city: "ب€ن", type: "بالقطعة", salary: "حسب المهام" },
];

const JobBoard = () => {
  return (
    <section id="jobs" className="relative py-24 bg-surface-elevated/30">
      <div className="container">
        <div className="text-center mb-16">
          <div className="inline-block text-xs font-cyber tracking-[0.3em] text-accent mb-3">// CAREER NETWORK</div>
          <h2 className="text-4xl md:text-6xl font-black mb-4">
            وظائف ألمانيا <span className="text-gradient-gold">في جيبك</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            انشر فرصة عمل أو تقدّم لمئات الوظائف من شركات حقيقية، كل ذلك داخل المنصة.
          </p>
        </div>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto mb-10 glass rounded-2xl p-2 flex items-center gap-2"
        >
          <Search className="h-5 w-5 text-muted-foreground mr-3" />
          <input
            type="text"
            placeholder="ابحث عن وظيفة، مهارة، أو شركة..."
            className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground py-3"
          />
          <Button variant="hero" size="sm">بحث</Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
          {SAMPLE_JOBS.map((job, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="group glass rounded-xl p-5 hover:border-accent/40 transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Briefcase className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-cyber px-2 py-1 rounded bg-primary/10 text-primary">{job.type}</span>
              </div>

              <h3 className="text-lg font-bold mb-1">{job.title}</h3>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                <Building2 className="h-3.5 w-3.5" />
                <span>{job.company}</span>
                <span className="mx-1">•</span>
                <MapPin className="h-3.5 w-3.5" />
                <span>{job.city}</span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <span className="font-cyber text-sm text-accent">{job.salary}</span>
                <Button variant="cyber" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  تقدّم <ArrowLeft className="h-3 w-3" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default JobBoard;
