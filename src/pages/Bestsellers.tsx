import { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import ProductCard from "@/components/shop/ProductCard";
import { supabase } from "@/integrations/supabase/client";

const Bestsellers = () => {
  const [products, setProducts] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("products").select("*").order("rating", { ascending: false }).limit(24)
      .then(({ data }) => setProducts(data ?? []));
  }, []);
  return (
    <div>
      <PageHeader badge="TOP CHARTS" title="الأكثر مبيعاً" subtitle="ما يحبه عملاؤنا — منتجات أثبتت جدارتها" />
      <div className="container py-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </div>
  );
};
export default Bestsellers;
