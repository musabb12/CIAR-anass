import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import PageHeader from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon } from "lucide-react";
import ProductCard from "@/components/shop/ProductCard";
import { supabase } from "@/integrations/supabase/client";

const Search = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const term = params.get("q");
    if (!term) return;
    setLoading(true);
    supabase.from("products").select("*").ilike("name", `%${term}%`).limit(40)
      .then(({ data }) => { setResults(data ?? []); setLoading(false); });
  }, [params]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <div>
      <PageHeader badge="SEARCH" title="البحث الذكي" subtitle="اعثر على ما تريد بسرعة من بين آلاف المنتجات">
        <form onSubmit={onSearch} className="mt-5 flex gap-2 max-w-xl">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن منتج، متجر، أو علامة تجارية..." />
          <Button variant="hero" type="submit"><SearchIcon className="ms-2 h-4 w-4" /> بحث</Button>
        </form>
      </PageHeader>
      <div className="container py-10">
        {loading ? <div className="text-center text-muted-foreground py-10">جاري البحث...</div> :
          results.length ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : params.get("q") ? (
            <div className="text-center text-muted-foreground py-10">لا توجد نتائج لـ "{params.get("q")}"</div>
          ) : (
            <div className="text-center text-muted-foreground py-10">ابدأ البحث للعثور على منتجاتك</div>
          )
        }
      </div>
    </div>
  );
};
export default Search;
