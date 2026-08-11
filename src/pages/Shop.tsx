import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import ProductCard from "@/components/shop/ProductCard";

const Shop = () => {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [sort, setSort] = useState<string>(params.get("sort") ?? "featured");
  const activeCat = params.get("cat") ?? "";

  useEffect(() => {
    supabase.from("categories").select("*").order("display_order").then(({ data }) => setCategories(data ?? []));
  }, []);

  useEffect(() => {
    setLoading(true);
    let q = supabase.from("products").select("*").eq("is_active", true);
    if (activeCat) q = q.eq("category_id", activeCat);
    if (search) q = q.ilike("name", `%${search}%`);
    if (sort === "price_asc") q = q.order("price", { ascending: true });
    else if (sort === "price_desc") q = q.order("price", { ascending: false });
    else if (sort === "newest") q = q.order("created_at", { ascending: false });
    else if (sort === "rating") q = q.order("rating", { ascending: false });
    else q = q.order("is_featured", { ascending: false }).order("sales_count", { ascending: false });
    q.limit(60).then(({ data }) => { setProducts(data ?? []); setLoading(false); });
  }, [activeCat, search, sort]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-black mb-2">المتجر</h1>
          <p className="text-sm text-muted-foreground">اكتشف آلاف المنتجات من متاجر ألمانية موثوقة</p>
        </div>

        {/* Search + Sort */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setParams(p => { p.set("q", search); return p; })}
              placeholder="ابحث عن منتج..."
              className="ps-10"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setParams(p => { p.set("sort", e.target.value); return p; }); }}
            className="bg-background border border-border rounded-md px-3 h-10 text-sm"
          >
            <option value="featured">الأكثر تميزاً</option>
            <option value="newest">الأحدث</option>
            <option value="price_asc">السعر: الأقل</option>
            <option value="price_desc">السعر: الأعلى</option>
            <option value="rating">الأعلى تقييماً</option>
          </select>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 -mx-4 px-4">
          <button
            onClick={() => setParams(p => { p.delete("cat"); return p; })}
            className={`shrink-0 px-4 h-9 rounded-full text-sm font-cyber border transition ${!activeCat ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}
          >
            الكل
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setParams(p => { p.set("cat", c.id); return p; })}
              className={`shrink-0 px-4 h-9 rounded-full text-sm border transition ${activeCat === c.id ? "bg-accent text-accent-foreground border-accent" : "border-border hover:border-accent/50"}`}
            >
              {c.name_ar}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center py-20 text-muted-foreground font-cyber">// جاري التحميل...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">لا توجد منتجات مطابقة</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </main>
    </div>
  );
};

export default Shop;
