import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { formatYER } from "@/lib/format";

interface Props {
  product: {
    id: string;
    name: string;
    price: number;
    discount_price: number | null;
    images: string[];
    rating: number;
    reviews_count: number;
    stock: number;
  };
}

const ProductCard = ({ product }: Props) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggle } = useWishlist();
  const fav = isInWishlist(product.id);
  const price = Number(product.discount_price ?? product.price);
  const hasDiscount = product.discount_price && Number(product.discount_price) < Number(product.price);
  const discountPct = hasDiscount ? Math.round((1 - Number(product.discount_price) / Number(product.price)) * 100) : 0;

  return (
    <div className="glass rounded-2xl overflow-hidden border border-border/50 group hover:border-primary/50 transition-all hover:shadow-[0_0_30px_hsl(var(--primary)/0.2)]">
      <Link to={`/product/${product.id}`} className="block relative aspect-square overflow-hidden bg-secondary/30">
        <img
          src={product.images?.[0] ?? "/placeholder.svg"}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {hasDiscount && (
          <span className="absolute top-2 start-2 bg-accent text-accent-foreground text-xs font-cyber px-2 py-1 rounded-md">
            -{discountPct}%
          </span>
        )}
        <button
          onClick={(e) => { e.preventDefault(); toggle(product.id); }}
          className="absolute top-2 end-2 h-9 w-9 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-primary/20 transition"
          aria-label="مفضلة"
        >
          <Heart className={`h-4 w-4 ${fav ? "fill-accent text-accent" : "text-foreground"}`} />
        </button>
      </Link>
      <div className="p-3">
        <Link to={`/product/${product.id}`} className="block">
          <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem] hover:text-primary transition">{product.name}</h3>
        </Link>
        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
          <Star className="h-3 w-3 fill-accent text-accent" />
          <span>{Number(product.rating).toFixed(1)}</span>
          <span>({product.reviews_count})</span>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div>
            <div className="font-cyber font-bold text-primary">{formatYER(price)}</div>
            {hasDiscount && (
              <div className="text-xs text-muted-foreground line-through">{formatYER(product.price)}</div>
            )}
          </div>
          <Button size="icon" variant="hero" onClick={() => addToCart(product.id)} disabled={product.stock <= 0}>
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
        {product.stock <= 0 && <div className="text-xs text-destructive mt-2 font-cyber">// نفذ المخزون</div>}
        {product.stock > 0 && product.stock < 10 && <div className="text-xs text-accent mt-2 font-cyber">// آخر {product.stock} قطعة</div>}
      </div>
    </div>
  );
};

export default ProductCard;
