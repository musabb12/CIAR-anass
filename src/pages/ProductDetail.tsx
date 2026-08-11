import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Heart, ShoppingCart, Star, Store as StoreIcon, Truck, Shield, Minus, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/hooks/useAuth";
import { formatYER } from "@/lib/format";
import { useI18n } from "@/hooks/useI18n";
import { toast } from "sonner";

const ProductDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useI18n();
  const { addToCart } = useCart();
  const { isInWishlist, toggle } = useWishlist();
  const [product, setProduct] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (!id) return;
    supabase.from("products").select("*").eq("id", id).maybeSingle().then(async ({ data }) => {
      setProduct(data);
      if (data?.store_id) {
        const { data: s } = await supabase.from("stores").select("*").eq("id", data.store_id).maybeSingle();
        setStore(s);
      }
    });
    supabase.from("reviews").select("*").eq("product_id", id).order("created_at", { ascending: false }).then(({ data }) => setReviews(data ?? []));
  }, [id]);

  const submitReview = async () => {
    if (!user) return toast.error(t("sign_in_to_review"));
    const { error } = await supabase.from("reviews").upsert({ product_id: id, user_id: user.id, rating: newRating, comment: newComment });
    if (error) toast.error(t("review_send_failed"));
    else {
      toast.success(t("review_thanks"));
      setNewComment("");
      const { data } = await supabase.from("reviews").select("*").eq("product_id", id).order("created_at", { ascending: false });
      setReviews(data ?? []);
    }
  };

  if (!product) return <div className="min-h-screen bg-background"><Navbar /><div className="container py-20 text-center text-muted-foreground">{t("loading")}</div></div>;

  const price = Number(product.discount_price ?? product.price);
  const fav = isInWishlist(product.id);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Gallery */}
          <div>
            <div className="aspect-square rounded-2xl overflow-hidden bg-secondary/30 mb-3">
              <img src={product.images?.[activeImg] ?? "/placeholder.svg"} alt={product.name} className="h-full w-full object-cover" />
            </div>
            {product.images?.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img: string, i: number) => (
                  <button key={i} onClick={() => setActiveImg(i)} className={`h-16 w-16 rounded-lg overflow-hidden border-2 ${activeImg === i ? "border-primary" : "border-transparent"}`}>
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {store && (
              <Link to={`/store/${store.id}`} className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-3">
                <StoreIcon className="h-4 w-4" /> {store.name}
              </Link>
            )}
            <h1 className="text-2xl md:text-3xl font-black mb-3">{product.name}</h1>
            <div className="flex items-center gap-2 mb-4 text-sm">
              <Star className="h-4 w-4 fill-accent text-accent" />
              <span className="font-cyber">{Number(product.rating).toFixed(1)}</span>
              <span className="text-muted-foreground">({product.reviews_count} {t("review_count")})</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{product.sales_count} {t("sold")}</span>
            </div>

            <div className="flex items-baseline gap-3 mb-5">
              <div className="text-3xl font-cyber font-bold text-primary">{formatYER(price)}</div>
              {product.discount_price && Number(product.discount_price) < Number(product.price) && (
                <div className="text-lg text-muted-foreground line-through">{formatYER(product.price)}</div>
              )}
            </div>

            <p className="text-muted-foreground mb-6 leading-relaxed">{product.description}</p>

            {/* تفاصيل المنتج الكاملة */}
            {(() => {
              const variants = Array.isArray(product.variants) ? product.variants : [];
              const colors = variants.find((v: any) => /color|لون/i.test(v?.name ?? ""))?.options ?? product.specs?.colors;
              const sizes = variants.find((v: any) => /size|مقاس|قياس/i.test(v?.name ?? ""))?.options ?? product.specs?.sizes;
              const rows: { label: string; value: any }[] = [
                { label: t("brand"), value: product.brand },
                { label: t("size"), value: product.size },
                { label: t("weight"), value: product.weight },
                { label: t("dimensions"), value: product.dimensions },
                { label: t("material"), value: product.material },
                { label: t("usage"), value: product.usage },
                { label: t("condition"), value: product.condition === "new" ? t("cond_new") : product.condition === "used" ? t("cond_used") : product.condition },
                { label: t("warranty"), value: product.warranty },
                { label: t("type"), value: product.product_type },
                { label: t("sku"), value: product.sku },
                { label: t("category"), value: product.specs?.category },
                { label: t("country"), value: product.specs?.country || product.specs?.origin },
                { label: t("manufacturer"), value: product.specs?.manufacturer },
                { label: t("model"), value: product.specs?.model },
                { label: t("stock_available"), value: product.stock },
              ].filter((r) => r.value !== undefined && r.value !== null && r.value !== "");
              const extra = Object.entries(product.specs ?? {}).filter(
                ([k]) => !["colors","sizes","country","origin","manufacturer","model","category"].includes(k)
              );
              if (rows.length === 0 && !colors && !sizes && extra.length === 0) return null;
              return (
                <div className="glass rounded-2xl p-4 mb-6 border border-primary/20">
                  <h3 className="text-sm font-bold mb-3 text-primary">{t("product_details")}</h3>
                  {colors && Array.isArray(colors) && colors.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs text-muted-foreground mb-2">{t("available_colors")}</div>
                      <div className="flex flex-wrap gap-2">
                        {colors.map((c: string, i: number) => (
                          <span key={i} className="px-3 py-1 rounded-full text-xs border border-border bg-secondary/40 flex items-center gap-1.5">
                            <span className="h-3 w-3 rounded-full border border-border" style={{ background: c }} />
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {sizes && Array.isArray(sizes) && sizes.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs text-muted-foreground mb-2">{t("sizes")}</div>
                      <div className="flex flex-wrap gap-2">
                        {sizes.map((s: string, i: number) => (
                          <span key={i} className="px-3 py-1 rounded-md text-xs border border-border bg-secondary/40 font-cyber">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    {rows.map((r) => (
                      <div key={r.label} className="flex justify-between border-b border-border/30 pb-1">
                        <dt className="text-muted-foreground">{r.label}</dt>
                        <dd className="font-medium text-end">{String(r.value)}</dd>
                      </div>
                    ))}
                    {extra.map(([k, v]) => (
                      <div key={k} className="flex justify-between border-b border-border/30 pb-1">
                        <dt className="text-muted-foreground">{k}</dt>
                        <dd className="font-medium text-end">{String(v)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              );
            })()}

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm">{t("quantity")}:</span>
              <div className="flex items-center border border-border rounded-md">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="h-10 w-10 flex items-center justify-center hover:bg-secondary"><Minus className="h-4 w-4" /></button>
                <span className="w-12 text-center font-cyber">{qty}</span>
                <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="h-10 w-10 flex items-center justify-center hover:bg-secondary"><Plus className="h-4 w-4" /></button>
              </div>
              <span className="text-xs text-muted-foreground">{t("available_qty")}: {product.stock}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mb-6">
              <Button variant="hero" size="lg" className="flex-1" onClick={() => addToCart(product.id, qty)} disabled={product.stock <= 0}>
                <ShoppingCart className="ms-2 h-5 w-5" /> {t("add_to_cart")}
              </Button>
              <Button variant="outline" size="lg" onClick={() => toggle(product.id)}>
                <Heart className={`h-5 w-5 ${fav ? "fill-accent text-accent" : ""}`} />
              </Button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-3">
              <div className="glass rounded-lg p-3 flex items-center gap-2 text-xs"><Truck className="h-4 w-4 text-primary" /> {t("fast_delivery")}</div>
              <div className="glass rounded-lg p-3 flex items-center gap-2 text-xs"><Shield className="h-4 w-4 text-accent" /> {t("quality_warranty")}</div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-5">{t("reviews_title")}</h2>

          {user && (
            <div className="border border-border/50 rounded-lg p-4 mb-6">
              <div className="text-sm mb-2">{t("rate_product")}</div>
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setNewRating(n)}>
                    <Star className={`h-6 w-6 ${n <= newRating ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t("share_experience")}
                rows={3}
                className="w-full bg-background border border-border rounded-md p-3 text-sm mb-3"
              />
              <Button variant="cyber" onClick={submitReview}>{t("send_review")}</Button>
            </div>
          )}

          {reviews.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">{t("be_first_review")}</div>
          ) : (
            <div className="space-y-4">
              {reviews.map(r => (
                <div key={r.id} className="border-b border-border/30 pb-4 last:border-0">
                  <div className="flex gap-1 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                    ))}
                  </div>
                  <p className="text-sm">{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProductDetail;
