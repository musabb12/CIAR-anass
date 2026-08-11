import { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import ProductCard from "@/components/shop/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const NewArrivals = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from("products").select("*").order("created_at", { ascending: false }).limit(24)
      .then(({ data }) => { setProducts(data ?? []); setLoading(false); });
  }, []);
  return (
    <div>
      <PageHeader badge="JUST IN" title="الجديد والمميز" subtitle="أحدث المنتجات التي وصلت لمنصة مارد التفوق" />
      <div className="container py-10">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-72" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
};
export default NewArrivals;
