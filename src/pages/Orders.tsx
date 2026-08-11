import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { formatYER, formatDate, orderStatusLabel, orderStatusColor } from "@/lib/format";

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("orders").select("*, order_items(*)").eq("customer_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
      setOrders(data ?? []); setLoading(false);
    });
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        <h1 className="text-3xl font-black mb-6">طلباتي</h1>
        {loading ? (
          <div className="text-center py-20 text-muted-foreground">جاري التحميل...</div>
        ) : orders.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا توجد طلبات بعد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(o => (
              <Link key={o.id} to={`/orders/${o.id}`} className="block glass rounded-xl p-4 hover:border-primary/50 border border-border/50 transition">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-cyber font-bold text-primary">{o.order_number}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(o.created_at)}</div>
                  </div>
                  <span className={`text-xs font-cyber px-3 py-1 rounded-full ${orderStatusColor[o.status]}`}>
                    {orderStatusLabel[o.status]}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{o.order_items?.length ?? 0} منتج</span>
                  <div className="flex items-center gap-2">
                    <span className="font-cyber font-bold">{formatYER(o.total)}</span>
                    <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Orders;
