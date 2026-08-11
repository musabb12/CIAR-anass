import { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Truck, Search, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const Tracking = () => {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<any>(null);

  const onTrack = () => {
    if (!code) return;
    setResult({
      code,
      status: "في الطريق إليك",
      steps: [
        { label: "تم استلام الطلب", done: true },
        { label: "قيد التجهيز", done: true },
        { label: "خرج للتوصيل", done: true },
        { label: "في الطريق", done: true },
        { label: "تم التسليم", done: false },
      ],
    });
  };

  return (
    <div>
      <PageHeader badge="TRACK" title="تتبع الشحنة" subtitle="أدخل رقم الطلب لمعرفة موقع شحنتك لحظة بلحظة" />
      <div className="container py-10 max-w-2xl">
        <Card className="p-6">
          <div className="flex gap-2">
            <Input placeholder="رقم الطلب أو رقم التتبع" value={code} onChange={(e) => setCode(e.target.value)} />
            <Button variant="hero" onClick={onTrack}><Search className="ms-2 h-4 w-4" /> تتبع</Button>
          </div>
        </Card>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6 mt-6">
              <div className="flex items-center gap-3 mb-6">
                <Truck className="h-8 w-8 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">رقم الطلب</div>
                  <div className="font-cyber font-bold">{result.code}</div>
                </div>
              </div>
              <div className="space-y-3">
                {result.steps.map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className={`h-5 w-5 ${s.done ? "text-primary" : "text-muted-foreground/30"}`} />
                    <span className={s.done ? "text-foreground" : "text-muted-foreground"}>{s.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};
export default Tracking;
