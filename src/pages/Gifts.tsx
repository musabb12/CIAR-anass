import PageHeader from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Sparkles } from "lucide-react";

const denominations = [5000, 10000, 25000, 50000, 100000];

const Gifts = () => (
  <div>
    <PageHeader badge="GIFTS" title="بطاقات الهدايا" subtitle="هدية رقمية مميزة لمن تحب — تُستخدم على كامل المنصة" />
    <div className="container py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {denominations.map((amount) => (
          <Card key={amount} className="relative p-8 overflow-hidden group hover:border-accent/50 transition">
            <Sparkles className="absolute -top-4 -right-4 h-24 w-24 text-accent/10 group-hover:rotate-45 transition-transform duration-700" />
            <Gift className="h-10 w-10 text-accent mb-4" />
            <div className="text-3xl font-cyber font-black text-gradient-gold mb-1">{amount.toLocaleString()} €</div>
            <p className="text-sm text-muted-foreground mb-5">بطاقة هدية رقمية صالحة على كامل منصة مارد التفوق</p>
            <Button variant="hero" className="w-full">اشترِ الآن</Button>
          </Card>
        ))}
      </div>
    </div>
  </div>
);
export default Gifts;
