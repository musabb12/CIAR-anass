import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface CartRow {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    discount_price: number | null;
    images: string[];
    stock: number;
    store_id: string | null;
  };
}

const hasProduct = (row: any): row is CartRow => Boolean(row?.product);

interface CartContextValue {
  items: CartRow[];
  count: number;
  subtotal: number;
  loading: boolean;
  addToCart: (productId: string, qty?: number) => Promise<void>;
  updateQty: (id: string, qty: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue>({
  items: [], count: 0, subtotal: 0, loading: false,
  addToCart: async () => {}, updateQty: async () => {},
  removeItem: async () => {}, clearCart: async () => {}, refresh: async () => {},
});

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("cart_items")
      .select("id, product_id, quantity, product:products(id,name,price,discount_price,images,stock,store_id)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && data) {
      const validItems = (data as any[]).filter(hasProduct);
      setItems(validItems);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const addToCart = async (productId: string, qty = 1) => {
    if (!user) { toast.error("سجّل الدخول أولاً للإضافة إلى السلة"); return; }
    const existing = items.find(i => i.product_id === productId);
    if (existing) {
      await updateQty(existing.id, existing.quantity + qty);
    } else {
      const { error } = await supabase.from("cart_items").insert({ user_id: user.id, product_id: productId, quantity: qty });
      if (error) { toast.error("تعذرت الإضافة"); return; }
      toast.success("أُضيف إلى السلة");
      refresh();
    }
  };

  const updateQty = async (id: string, qty: number) => {
    if (qty <= 0) return removeItem(id);
    const { error } = await supabase.from("cart_items").update({ quantity: qty }).eq("id", id);
    if (!error) refresh();
  };

  const removeItem = async (id: string) => {
    await supabase.from("cart_items").delete().eq("id", id);
    refresh();
  };

  const clearCart = async () => {
    if (!user) return;
    await supabase.from("cart_items").delete().eq("user_id", user.id);
    setItems([]);
  };

  const subtotal = items.reduce((sum, i) => {
    if (!i.product) return sum;
    return sum + Number(i.product.discount_price ?? i.product.price ?? 0) * i.quantity;
  }, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, count, subtotal, loading, addToCart, updateQty, removeItem, clearCart, refresh }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
