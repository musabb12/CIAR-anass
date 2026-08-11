import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, FileText, Eye, CheckCircle2, Upload, MapPin, Sparkles, Send } from "lucide-react";

const JobseekerDashboard = () => {
  const stats = [
    { icon: FileText,     label: "طلبات تقديم",     value: "8",   c: "primary" },
    { icon: Eye,          label: "مشاهدات سيرتك",   value: "342", c: "accent" },
    { icon: CheckCircle2, label: "مقابلات مجدولة",  value: "2",   c: "primary" },
    { icon: Briefcase,    label: "وظائف محفوظة",    value: "15",  c: "accent" },
  ];

  const applications = [
    { job: "مهندس برمجيات Senior",  company: "سبأ التقنية",  status: "review",   date: "منذ يومين", city: "ب€ن" },
    { job: "مدير تسويق رقمي",        company: "مارد التفوق",  status: "interview", date: "منذ 5 أيام", city: "ميونخ" },
    { job: "محاسب أول",              company: "مجموعة هائل",  status: "rejected",  date: "منذ أسبوع", city: "هامبورغ" },
    { job: "مصمم UX/UI",            company: "Yemen Net",    status: "review",   date: "منذ 3 أيام", city: "ب€ن" },
  ];

  const recommendations = [
    { title: "Full-Stack Developer", company: "Sky Tech", salary: "350K €", match: 94 },
    { title: "Product Manager",      company: "مارد للتقنية", salary: "2.500 €", match: 87 },
    { title: "Data Analyst",         company: "InsightYE", salary: "280K €", match: 82 },
  ];

  const statusBadge = (s: string) => {
    const map: Record<string, { l: string; v: any }> = {
      review:    { l: "قيد المراجعة",  v: "secondary" },
      interview: { l: "🎯 مقابلة مقررة", v: "default" },
      rejected:  { l: "تم الرفض",      v: "destructive" },
    };
    const c = map[s] ?? { l: s, v: "secondary" };
    return <Badge variant={c.v as any} className="text-[10px]">{c.l}</Badge>;
  };

  return (
    <DashboardShell role="jobseeker" title="💼 مسارك المهني" subtitle="تقدّم لأفضل الوظائف، تابع طلباتك، واكتشف فرصاً ذكية مخصصة لك.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-xl p-5">
            <s.icon className={`mb-3 h-5 w-5 ${s.c === "accent" ? "text-accent" : "text-primary"}`} />
            <div className="font-cyber text-xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Applications */}
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-5 flex items-center gap-2"><Send className="h-5 w-5 text-primary" /> الطلبات الأخيرة</h2>
          <div className="space-y-3">
            {applications.map((row, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50 hover:border-primary/40 transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{row.job}</div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                    <span>{row.company}</span><span>•</span>
                    <span><MapPin className="h-3 w-3 inline" /> {row.city}</span><span>•</span>
                    <span>{row.date}</span>
                  </div>
                </div>
                {statusBadge(row.status)}
              </motion.div>
            ))}
          </div>
        </div>

        {/* CV + AI matches */}
        <div className="space-y-6">
          <div className="glass rounded-2xl p-6">
            <h2 className="text-base font-bold mb-1">سيرتك الذاتية</h2>
            <p className="text-xs text-muted-foreground mb-4">حافظ على سيرتك محدّثة ليجدك أصحاب العمل.</p>
            <Button variant="outline" className="w-full mb-2"><Upload className="h-4 w-4 ms-2" /> رفع PDF</Button>
            <Button variant="hero" className="w-full">معاينة الملف العام</Button>
          </div>

          <div className="glass rounded-2xl p-6 border border-accent/30">
            <h2 className="text-base font-bold mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent animate-pulse" /> توصيات المارد
            </h2>
            <div className="space-y-2">
              {recommendations.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.07 }}
                  className="p-3 rounded-lg bg-gradient-mystic/10 border border-accent/20"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{r.title}</div>
                      <div className="text-[10px] text-muted-foreground">{r.company} • {r.salary}</div>
                    </div>
                    <span className="text-[10px] font-cyber font-bold text-accent">{r.match}%</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
};

export default JobseekerDashboard;
