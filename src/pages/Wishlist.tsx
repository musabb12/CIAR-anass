import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/layout/Navbar";
import ProductCard from "@/components/shop/ProductCard";
import { useAuth } from "@/hooks/useAuth";

const Wishlist = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("wishlists").select("product:products(*)").eq("user_id", user.id).then(({ data }) => {
      setProducts((data ?? []).map((r: any) => r.product).filter(Boolean));
    });
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        <h1 className="text-3xl font-black mb-6">قائمة المفضلة</h1>
        {products.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Heart className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا توجد منتجات في المفضلة</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </main>
    </div>
  );
};

export default Wishlist;
