import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/format";

const Notifications = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);

  const refresh = async () => {
    if (!user) return;
    const { data } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { refresh(); }, [user]);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    refresh();
  };
  const markAll = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    refresh();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-black">الإشعارات</h1>
          <Button variant="outline" size="sm" onClick={markAll}>تحديد الكل كمقروء</Button>
        </div>
        {items.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Bell className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا توجد إشعارات</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(n => (
              <div key={n.id} className={`glass rounded-xl p-4 flex gap-3 ${!n.is_read ? "border border-primary/30" : ""}`}>
                <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${!n.is_read ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
                  <Bell className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{n.title}</div>
                  {n.message && <div className="text-sm text-muted-foreground mt-1">{n.message}</div>}
                  <div className="text-xs text-muted-foreground mt-2">{formatDate(n.created_at)}</div>
                  {n.link && <Link to={n.link} className="text-xs text-primary hover:underline">عرض التفاصيل ←</Link>}
                </div>
                {!n.is_read && (
                  <button onClick={() => markRead(n.id)} className="text-primary"><Check className="h-4 w-4" /></button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Notifications;
