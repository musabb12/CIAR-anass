import { Link } from "react-router-dom";
import DashboardShell from "@/components/layout/DashboardShell";
import { ShoppingBag, Heart, Wallet, Package, MapPin, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatYER } from "@/lib/format";

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ orders: 0, wishlist: 0, balance: 0, addresses: 0 });

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("customer_id", user.id),
      supabase.from("wishlists").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("wallets").select("balance").eq("user_id", user.id).maybeSingle(),
      supabase.from("addresses").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ]).then(([o, w, wa, a]) => setStats({
      orders: o.count ?? 0, wishlist: w.count ?? 0,
      balance: Number(wa.data?.balance ?? 0), addresses: a.count ?? 0,
    }));
  }, [user]);

  const cards = [
    { to: "/orders",        icon: Package,    label: "طلباتي",     value: stats.orders.toString(),     c: "primary" },
    { to: "/wishlist",      icon: Heart,      label: "المفضلة",    value: stats.wishlist.toString(),   c: "accent" },
    { to: "/wallet",        icon: Wallet,     label: "ال€د",     value: formatYER(stats.balance),    c: "primary" },
    { to: "/profile",       icon: MapPin,     label: "العناوين",   value: stats.addresses.toString(),  c: "accent" },
  ];

  return (
    <DashboardShell role="customer" title="مرحباً بك" subtitle="إدارة كاملة لحسابك ومشترياتك">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map((s, i) => (
          <Link key={i} to={s.to} className="glass rounded-xl p-5 hover:border-primary/50 border border-border/50 transition">
            <s.icon className={`mb-3 h-5 w-5 ${s.c === "accent" ? "text-accent" : "text-primary"}`} />
            <div className="font-cyber text-xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/shop" className="glass rounded-2xl p-6 hover:border-primary/50 border border-border/50 transition">
          <ShoppingBag className="h-8 w-8 text-primary mb-3" />
          <h3 className="font-bold mb-1">تسوّق الآن</h3>
          <p className="text-sm text-muted-foreground">آلاف المنتجات بانتظارك</p>
        </Link>
        <Link to="/jobs" className="glass rounded-2xl p-6 hover:border-accent/50 border border-border/50 transition">
          <Package className="h-8 w-8 text-accent mb-3" />
          <h3 className="font-bold mb-1">الوظائف</h3>
          <p className="text-sm text-muted-foreground">فرص عمل في انتظارك</p>
        </Link>
        <Link to="/notifications" className="glass rounded-2xl p-6 hover:border-primary/50 border border-border/50 transition">
          <Bell className="h-8 w-8 text-primary mb-3" />
          <h3 className="font-bold mb-1">الإشعارات</h3>
          <p className="text-sm text-muted-foreground">آخر التحديثات</p>
        </Link>
      </div>
    </DashboardShell>
  );
};

export default CustomerDashboard;
