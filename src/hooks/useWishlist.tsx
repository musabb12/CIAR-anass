import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const useWishlist = () => {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!user) { setIds(new Set()); return; }
    const { data } = await supabase.from("wishlists").select("product_id").eq("user_id", user.id);
    setIds(new Set((data ?? []).map((r: any) => r.product_id)));
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const toggle = async (productId: string) => {
    if (!user) { toast.error("سجّل الدخول أولاً"); return; }
    if (ids.has(productId)) {
      await supabase.from("wishlists").delete().eq("user_id", user.id).eq("product_id", productId);
      toast.success("أزيل من المفضلة");
    } else {
      await supabase.from("wishlists").insert({ user_id: user.id, product_id: productId });
      toast.success("أضيف إلى المفضلة");
    }
    refresh();
  };

  return { ids, isInWishlist: (id: string) => ids.has(id), toggle, refresh };
};
