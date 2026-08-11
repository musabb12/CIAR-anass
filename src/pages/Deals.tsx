import { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import ProductCard from "@/components/shop/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame } from "lucide-react";

const Deals = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("products").select("*").gt("discount_price", 0).limit(24)
      .then(({ data }) => { setProducts(data ?? []); setLoading(false); });
  }, []);

  return (
    <div>
      <PageHeader badge="MEGA DEALS" title="العروض الحصرية" subtitle="خصومات نارية وعروض محدودة من شركاء مارد التفوق — لا تفوّتها">
        <div className="mt-4 inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-sm">
          <Flame className="h-4 w-4 text-accent animate-pulse" />
          <span className="text-muted-foreground">عروض جديدة كل يوم</span>
        </div>
      </PageHeader>
      <div className="container py-10">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-72" />)}
          </div>
        ) : products.length ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">لا توجد عروض حالياً — تابعنا قريباً</div>
        )}
      </div>
    </div>
  );
};
export default Deals;
