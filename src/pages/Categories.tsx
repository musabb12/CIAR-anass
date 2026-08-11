import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/layout/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import * as Icons from "lucide-react";
import { Layers, Search, Store as StoreIcon, ShoppingBag, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";

type Category = {
  id: string;
  name: string;
  name_ar: string | null;
  slug: string | null;
  icon: string | null;
  parent_id: string | null;
  display_order?: number | null;
};

const Categories = () => {
  const [cats, setCats] = useState<Category[]>([]);
  const [storeCounts, setStoreCounts] = useState<Record<string, number>>({});
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      const [{ data: catsData }, { data: storesData }, { data: prodData }] = await Promise.all([
        supabase.from("categories").select("*").order("display_order"),
        supabase
          .from("stores")
          .select("category_id")
          .eq("approval_status", "approved")
          .eq("suspended", false),
        supabase.from("products").select("category_id").eq("is_active", true),
      ]);
      if (!alive) return;

      const sCounts: Record<string, number> = {};
      (storesData ?? []).forEach((s: any) => {
        if (s.category_id) sCounts[s.category_id] = (sCounts[s.category_id] ?? 0) + 1;
      });
      const pCounts: Record<string, number> = {};
      (prodData ?? []).forEach((p: any) => {
        if (p.category_id) pCounts[p.category_id] = (pCounts[p.category_id] ?? 0) + 1;
      });

      setCats((catsData as Category[]) ?? []);
      setStoreCounts(sCounts);
      setProductCounts(pCounts);
      setLoading(false);
    };
    load();
    return () => {
      alive = false;
    };
  }, []);

  const { roots, childrenOf, rollup } = useMemo(() => {
    const roots = cats.filter((c) => !c.parent_id);
    const childrenOf: Record<string, Category[]> = {};
    cats.forEach((c) => {
      if (c.parent_id) (childrenOf[c.parent_id] ??= []).push(c);
    });
    // Roll up counts (root = self + children)
    const rollup: Record<string, { stores: number; products: number }> = {};
    cats.forEach((c) => {
      rollup[c.id] = {
        stores: storeCounts[c.id] ?? 0,
        products: productCounts[c.id] ?? 0,
      };
    });
    roots.forEach((r) => {
      const kids = childrenOf[r.id] ?? [];
      kids.forEach((k) => {
        rollup[r.id].stores += storeCounts[k.id] ?? 0;
        rollup[r.id].products += productCounts[k.id] ?? 0;
      });
    });
    return { roots, childrenOf, rollup };
  }, [cats, storeCounts, productCounts]);

  const filteredRoots = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return roots;
    return roots.filter((r) => {
      const inRoot =
        (r.name_ar ?? "").toLowerCase().includes(term) ||
        (r.name ?? "").toLowerCase().includes(term) ||
        (r.slug ?? "").toLowerCase().includes(term);
      const inKids = (childrenOf[r.id] ?? []).some(
        (k) =>
          (k.name_ar ?? "").toLowerCase().includes(term) ||
          (k.name ?? "").toLowerCase().includes(term) ||
          (k.slug ?? "").toLowerCase().includes(term),
      );
      return inRoot || inKids;
    });
  }, [roots, childrenOf, q]);

  const renderIcon = (name?: string | null, cls = "h-9 w-9") => {
    const Ico = (name && (Icons as any)[name]) || Layers;
    return <Ico className={`${cls} text-primary`} />;
  };

  return (
    <div>
      <PageHeader
        badge="EXPLORE"
        title="تصفح الفئات"
        subtitle="جميع الخدمات والمتاجر مرتبة حسب الفئة"
      />
      <div className="container py-8 space-y-8">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث في الفئات (مثال: صيدلية، مطعم، محامي)..."
            className="pr-10"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        ) : filteredRoots.length === 0 ? (
          <Card className="p-10 text-center">
            <Layers className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <div className="text-muted-foreground">لا توجد نتائج لبحثك</div>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredRoots.map((r, i) => {
              const kids = childrenOf[r.id] ?? [];
              const totals = rollup[r.id] ?? { stores: 0, products: 0 };
              return (
                <motion.section
                  key={r.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card className="overflow-hidden">
                    <Link
                      to={`/category/${r.slug ?? r.id}`}
                      className="flex items-center gap-4 p-5 bg-gradient-to-l from-primary/10 to-transparent hover:from-primary/20 transition group"
                    >
                      <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                        {renderIcon(r.icon, "h-7 w-7")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-lg flex items-center gap-2">
                          {r.name_ar ?? r.name}
                          <ChevronLeft className="h-4 w-4 opacity-50 group-hover:translate-x-[-3px] transition" />
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="secondary" className="gap-1">
                            <StoreIcon className="h-3 w-3" />
                            {totals.stores} متجر
                          </Badge>
                          <Badge variant="secondary" className="gap-1">
                            <ShoppingBag className="h-3 w-3" />
                            {totals.products} منتج
                          </Badge>
                          {kids.length > 0 && (
                            <Badge variant="outline">{kids.length} فرع</Badge>
                          )}
                        </div>
                      </div>
                    </Link>

                    {kids.length > 0 && (
                      <div className="p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 border-t">
                        {kids
                          .filter((k) => {
                            const term = q.trim().toLowerCase();
                            if (!term) return true;
                            return (
                              (k.name_ar ?? "").toLowerCase().includes(term) ||
                              (k.name ?? "").toLowerCase().includes(term) ||
                              (r.name_ar ?? "").toLowerCase().includes(term)
                            );
                          })
                          .map((k) => {
                            const sc = storeCounts[k.id] ?? 0;
                            const pc = productCounts[k.id] ?? 0;
                            return (
                              <Link
                                key={k.id}
                                to={`/category/${k.slug ?? k.id}`}
                                className="group"
                              >
                                <Card className="p-3 hover:border-primary/50 transition cursor-pointer h-full text-center">
                                  <div className="mx-auto mb-1 flex justify-center">
                                    {renderIcon(k.icon, "h-5 w-5")}
                                  </div>
                                  <div className="text-xs font-bold line-clamp-1">
                                    {k.name_ar ?? k.name}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground mt-1">
                                    {sc > 0 && <span>{sc} متجر</span>}
                                    {sc > 0 && pc > 0 && <span> · </span>}
                                    {pc > 0 && <span>{pc} منتج</span>}
                                    {sc === 0 && pc === 0 && <span>قريباً</span>}
                                  </div>
                                </Card>
                              </Link>
                            );
                          })}
                      </div>
                    )}
                  </Card>
                </motion.section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;
