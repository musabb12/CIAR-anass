import PageHeader from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Rocket, Target, Heart, Users } from "lucide-react";

const About = () => (
  <div>
    <PageHeader badge="ABOUT US" title="من نحن" subtitle="مارد التفوق — €قك الأول إلى عالم التسوق" />
    <div className="container py-10 max-w-4xl">
      <Card className="p-8 mb-6">
        <p className="text-lg leading-relaxed text-muted-foreground">
          <span className="text-gradient-primary font-bold">مارد التفوق</span> منصة يمنية متكاملة تجمع بين التجارة الإلكترونية،
          التوصيل الذكي، الوظائف، وخدمات B2B في مكان واحد. نؤمن بأن مستقبلك معنا أفضل — تسوّق من مكانك، وتمتع بتجربة سينمائية لا مثيل لها.
        </p>
      </Card>
      <div className="grid md:grid-cols-2 gap-4">
        {[
          { icon: Rocket, title: "€تنا", desc: "أن نكون المنظومة التجارية الرقمية الأولى في ألمانيا والمنطقة" },
          { icon: Target, title: "رسالتنا", desc: "تمكين كل يمني من الوصول لأفضل المنتجات والخدمات بسهولة وأمان" },
          { icon: Heart, title: "قيمنا", desc: "الجودة، الشفافية، الابتكار، وخدمة العميل قبل كل شيء" },
          { icon: Users, title: "فريقنا", desc: "نخبة من المهندسين والمصممين ألمانيايين الشغوفين بالتطوير" },
        ].map((v) => (
          <Card key={v.title} className="p-6 hover:border-primary/40 transition">
            <v.icon className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-bold mb-2">{v.title}</h3>
            <p className="text-sm text-muted-foreground">{v.desc}</p>
          </Card>
        ))}
      </div>
    </div>
  </div>
);
export default About;
