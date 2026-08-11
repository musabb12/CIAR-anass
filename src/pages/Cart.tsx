import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { formatYER } from "@/lib/format";
import { useCurrency, currencies } from "@/hooks/useCurrency";

const Cart = () => {
  const { items, subtotal, count, updateQty, removeItem, loading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { currentCurrency, setCurrency } = useCurrency();
  
  const shipping = subtotal > 0 ? 1500 : 0;
  const total = subtotal + shipping;

  if (!user) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-20 text-center">
        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">سجّل الدخول لعرض سلتك</h2>
        <Link to="/auth"><Button variant="hero">تسجيل الدخول</Button></Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        <h1 className="text-3xl font-black mb-6">سلة التسوق ({count})</h1>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">جاري التحميل...</div>
        ) : items.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-5">سلتك فارغة</p>
            <Link to="/shop"><Button variant="hero">تسوّق الآن</Button></Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {items.map(item => {
                const p = item.product;
                if (!p) return null;
                const price = Number(p.discount_price ?? p.price);
                return (
                  <div key={item.id} className="glass rounded-xl p-4 flex gap-4">
                    <Link to={`/product/${p.id}`} className="shrink-0">
                      <img src={p.images?.[0] ?? "/placeholder.svg"} alt={p.name} className="h-24 w-24 rounded-lg object-cover bg-secondary/30" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/product/${p.id}`} className="font-medium line-clamp-2 hover:text-primary">{p.name}</Link>
                      <div className="font-cyber text-primary mt-1">{formatYER(price)}</div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border border-border rounded-md">
                          <button onClick={() => updateQty(item.id, item.quantity - 1)} className="h-8 w-8 flex items-center justify-center hover:bg-secondary"><Minus className="h-3 w-3" /></button>
                          <span className="w-10 text-center text-sm font-cyber">{item.quantity}</span>
                          <button onClick={() => updateQty(item.id, item.quantity + 1)} className="h-8 w-8 flex items-center justify-center hover:bg-secondary"><Plus className="h-3 w-3" /></button>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="text-destructive hover:text-destructive/80">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="glass rounded-2xl p-6 h-fit sticky top-20">
              <h3 className="font-bold mb-4">ملخص الطلب</h3>
              
              {/* قائمة اختيار العملة التجارية */}
              <div className="mb-4 pb-4 border-b border-border/50">
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">عملة العرض والتشغيل</label>
                <select
                  value={currentCurrency.code}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-background/50 backdrop-blur-sm border border-border/60 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all text-foreground cursor-pointer"
                >
                  {Object.values(currencies).map(curr => (
                    <option key={curr.code} value={curr.code} className="bg-background text-foreground text-sm">
                      {curr.name} ({curr.symbol})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 text-sm pb-4 border-b border-border/50">
                <div className="flex justify-between"><span className="text-muted-foreground">المجموع الفرعي</span><span className="font-cyber">{formatYER(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">الشحن</span><span className="font-cyber">{formatYER(shipping)}</span></div>
              </div>
              <div className="flex justify-between font-bold pt-4 mb-5">
                <span>الإجمالي</span>
                <span className="font-cyber text-primary text-lg">{formatYER(total)}</span>
              </div>
              <Button variant="hero" size="lg" className="w-full" onClick={() => navigate("/checkout")}>
                <ArrowLeft className="ms-2 h-4 w-4" /> متابعة الدفع
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Cart;
