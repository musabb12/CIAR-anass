import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/layout/PageHeader";
import ProductCard from "@/components/shop/ProductCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import * as Icons from "lucide-react";
import { Layers, Store as StoreIcon, ShoppingBag, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";

type Category = {
  id: string;
  name: string;
  name_ar: string | null;
  slug: string | null;
  icon: string | null;
  parent_id: string | null;
  description?: string | null;
};

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category | null>(null);
  const [parent, setParent] = useState<Category | null>(null);
  const [children, setChildren] = useState<Category[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!slug) return;
      setLoading(true);

      // Resolve category by slug (or fallback by id)
      const { data: cat } = await supabase
        .from("categories")
        .select("*")
        .or(`slug.eq.${slug},id.eq.${slug}`)
        .maybeSingle();

      if (!alive) return;
      if (!cat) {
        setCategory(null);
        setLoading(false);
        return;
      }
      setCategory(cat as Category);

      // Parent breadcrumb
      if (cat.parent_id) {
        const { data: p } = await supabase
          .from("categories")
          .select("*")
          .eq("id", cat.parent_id)
          .maybeSingle();
        if (alive) setParent((p as Category) ?? null);
      } else {
        setParent(null);
      }

      // Children (if root) → expand product/store search to include them
      const { data: kids } = await supabase
        .from("categories")
        .select("*")
        .eq("parent_id", cat.id)
        .order("display_order");
      if (!alive) return;
      setChildren((kids as Category[]) ?? []);

      const ids = [cat.id, ...((kids as any[]) ?? []).map((k) => k.id)];

      // Products in this category (and its sub-categories)
      const { data: prods } = await supabase
        .from("products")
        .select("id, name, price, discount_price, images, rating, reviews_count, stock, store_id, category_id, is_active")
        .in("category_id", ids)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(60);
      if (!alive) return;
      setProducts(prods ?? []);

      // Stores: union of (a) stores tagged with this category, (b) stores having products in this category
      const productStoreIds = Array.from(new Set((prods ?? []).map((p: any) => p.store_id).filter(Boolean)));

      const { data: directStores } = await supabase
        .from("stores")
        .select("id, name, slug, logo_url, cover_url, description, rating, city, theme_color, category_id")
        .in("category_id", ids)
        .eq("approval_status", "approved")
        .eq("suspended", false)
        .limit(60);

      let extraStores: any[] = [];
      const missingIds = productStoreIds.filter((sid) => !(directStores ?? []).some((s: any) => s.id === sid));
      if (missingIds.length > 0) {
        const { data: viaProducts } = await supabase
          .from("stores")
          .select("id, name, slug, logo_url, cover_url, description, rating, city, theme_color, category_id")
          .in("id", missingIds)
          .eq("approval_status", "approved")
          .eq("suspended", false);
        extraStores = viaProducts ?? [];
      }
      if (!alive) return;
      setStores([...(directStores ?? []), ...extraStores]);

      setLoading(false);
    };
    load();
    return () => {
      alive = false;
    };
  }, [slug]);

  const Icon = useMemo(() => {
    const name = category?.icon;
    return (name && (Icons as any)[name]) || Layers;
  }, [category]);

  if (!loading && !category) {
    return (
      <div className="container py-20 text-center">
        <Layers className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">الفئة غير موجودة</h1>
        <Link to="/categories">
          <Button variant="hero" className="mt-4">العودة إلى الفئات</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        badge={parent ? (parent.name_ar ?? parent.name) : "CATEGORY"}
        title={category ? (category.name_ar ?? category.name) : "..."}
        subtitle={category?.description ?? "اكتشف كل المنتجات والمتاجر التابعة لهذه الفئة"}
      />

      <div className="container py-6 space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">ال€سية</Link>
          <ChevronLeft className="h-3 w-3 rotate-180" />
          <Link to="/categories" className="hover:text-primary">الفئات</Link>
          {parent && (
            <>
              <ChevronLeft className="h-3 w-3 rotate-180" />
              <Link to={`/category/${parent.slug ?? parent.id}`} className="hover:text-primary">
                {parent.name_ar ?? parent.name}
              </Link>
            </>
          )}
          <ChevronLeft className="h-3 w-3 rotate-180" />
          <span className="text-foreground font-bold">{category?.name_ar ?? category?.name}</span>
        </nav>

        {/* Sub-categories grid (only for root categories) */}
        {children.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Icon className="h-5 w-5 text-primary" />
              الفروع ({children.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {children.map((c, i) => {
                const Sub = ((c.icon && (Icons as any)[c.icon]) || Layers) as any;
                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                  >
                    <Link to={`/category/${c.slug ?? c.id}`}>
                      <Card className="p-4 text-center hover:border-primary/50 transition group cursor-pointer h-full">
                        <Sub className="mx-auto h-7 w-7 text-primary mb-2 group-hover:scale-110 transition-transform" />
                        <div className="text-xs font-bold line-clamp-1">{c.name_ar ?? c.name}</div>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* Tabs: Products / Stores */}
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid grid-cols-2 max-w-sm">
            <TabsTrigger value="products" className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              المنتجات
              <Badge variant="secondary" className="ms-1 h-5">{products.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="stores" className="gap-2">
              <StoreIcon className="h-4 w-4" />
              المتاجر
              <Badge variant="secondary" className="ms-1 h-5">{stores.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-4">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <Card className="p-10 text-center">
                <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <div className="text-muted-foreground">لا توجد منتجات في هذه الفئة بعد</div>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="stores" className="mt-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 rounded-2xl" />
                ))}
              </div>
            ) : stores.length === 0 ? (
              <Card className="p-10 text-center">
                <StoreIcon className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <div className="text-muted-foreground">لا توجد متاجر تعرض منتجات في هذه الفئة بعد</div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {stores.map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Link to={`/store/${s.slug ?? s.id}`}>
                      <Card className="overflow-hidden hover:border-primary/50 transition group">
                        <div
                          className="h-20 bg-gradient-to-r from-primary/20 to-accent/20 relative"
                          style={s.cover_url ? { backgroundImage: `url(${s.cover_url})`, backgroundSize: "cover" } : undefined}
                        />
                        <div className="p-4 flex gap-3 -mt-8">
                          <div className="h-14 w-14 rounded-xl border-2 border-background bg-card flex items-center justify-center overflow-hidden shrink-0">
                            {s.logo_url ? (
                              <img src={s.logo_url} alt={s.name} className="h-full w-full object-cover" />
                            ) : (
                              <StoreIcon className="h-6 w-6 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 mt-6">
                            <div className="font-bold line-clamp-1">{s.name}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {s.city ? `${s.city} · ` : ""}{Number(s.rating ?? 0).toFixed(1)} ★
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CategoryPage;
