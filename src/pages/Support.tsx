import PageHeader from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MessageSquare, MapPin } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Support = () => (
  <div>
    <PageHeader badge="SUPPORT" title="الدعم والمساعدة" subtitle="فريقنا متاح 24/7 لمساعدتك في أي وقت" />
    <div className="container py-10 grid md:grid-cols-2 gap-6 max-w-5xl">
      <div className="space-y-4">
        {[
          { icon: Phone, title: "الهاتف", value: "+967 1 234 567" },
          { icon: Mail, title: "البريد الإلكتروني", value: "support@mared-altafawoq.ye" },
          { icon: MessageSquare, title: "الدردشة المباشرة", value: "متاحة 24/7" },
          { icon: MapPin, title: "العنوان", value: "ب€ن — شارع حدة" },
        ].map((c) => (
          <Card key={c.title} className="p-5 flex items-center gap-4 hover:border-primary/40 transition">
            <c.icon className="h-8 w-8 text-primary shrink-0" />
            <div>
              <div className="text-xs text-muted-foreground">{c.title}</div>
              <div className="font-bold">{c.value}</div>
            </div>
          </Card>
        ))}
      </div>
      <Card className="p-6">
        <h3 className="font-bold mb-4">أرسل لنا رسالة</h3>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); toast({ title: "تم الإرسال", description: "سنعود إليك قريباً" }); }}>
          <Input placeholder="الاسم" required />
          <Input type="email" placeholder="البريد الإلكتروني" required />
          <Input placeholder="الموضوع" />
          <Textarea placeholder="رسالتك..." rows={5} required />
          <Button variant="hero" type="submit" className="w-full">إرسال</Button>
        </form>
      </Card>
    </div>
  </div>
);
export default Support;
