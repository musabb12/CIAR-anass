import { useEffect, useState } from "react";
import { Briefcase, MapPin, DollarSign, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { formatYER, formatDate } from "@/lib/format";
import { toast } from "sonner";

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: "دوام كامل", part_time: "دوام جزئي", contract: "عقد", remote: "عن بعد", internship: "تدريب",
};

const Jobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [active, setActive] = useState<any>(null);
  const [coverLetter, setCoverLetter] = useState("");

  const refresh = () => {
    let q = supabase.from("jobs").select("*").eq("is_active", true).order("created_at", { ascending: false });
    if (search) q = q.ilike("title", `%${search}%`);
    if (city) q = q.eq("city", city);
    q.then(({ data }) => setJobs(data ?? []));
  };
  useEffect(() => { refresh(); }, [search, city]);

  const apply = async () => {
    if (!user || !active) return toast.error("سجّل الدخول للتقديم");
    const { error } = await supabase.from("job_applications").insert({
      job_id: active.id, applicant_id: user.id, cover_letter: coverLetter,
    });
    if (error?.code === "23505") toast.error("تقدمت لهذه الوظيفة سابقاً");
    else if (error) toast.error("تعذر التقديم");
    else { toast.success("أُرسل طلبك"); setActive(null); setCoverLetter(""); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        <h1 className="text-3xl font-black mb-2">الوظائف</h1>
        <p className="text-sm text-muted-foreground mb-6">آلاف الفرص الوظيفية في ألمانيا</p>

        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث عن وظيفة..." className="ps-10" />
          </div>
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="المدينة" className="max-w-[180px]" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {jobs.map(j => (
            <div key={j.id} className="glass rounded-2xl p-5 hover:border-primary/50 border border-border/50 transition">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold">{j.title}</h3>
                  <div className="text-sm text-muted-foreground">{j.company_name}</div>
                </div>
                <span className="text-xs font-cyber bg-primary/10 text-primary px-2 py-1 rounded">{JOB_TYPE_LABELS[j.job_type]}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                {j.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {j.city}</span>}
                {j.salary_min && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> {formatYER(j.salary_min)} - {formatYER(j.salary_max)}</span>}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{j.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{j.applications_count} متقدم</span>
                <Button variant="cyber" size="sm" onClick={() => setActive(j)}>قدّم الآن</Button>
              </div>
            </div>
          ))}
        </div>

        {active && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur flex items-center justify-center p-4" onClick={() => setActive(null)}>
            <div onClick={(e) => e.stopPropagation()} className="glass rounded-2xl p-6 max-w-lg w-full">
              <h2 className="font-bold text-xl mb-1">{active.title}</h2>
              <div className="text-sm text-muted-foreground mb-4">{active.company_name}</div>
              <p className="text-sm mb-4">{active.description}</p>
              {active.requirements && <div className="text-sm mb-4"><strong>المتطلبات:</strong> {active.requirements}</div>}
              <textarea
                value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="رسالة تعريفية قصيرة..." rows={4}
                className="w-full bg-background border border-border rounded-md p-3 text-sm mb-4"
              />
              <div className="flex gap-2">
                <Button variant="hero" className="flex-1" onClick={apply}>إرسال الطلب</Button>
                <Button variant="outline" onClick={() => setActive(null)}>إلغاء</Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Jobs;
