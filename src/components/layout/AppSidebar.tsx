import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home, Store, ShoppingBag, Tag, Sparkles, Layers, Briefcase, Factory, Bike,
  ShoppingCart, Heart, Wallet, Bell, User, LayoutDashboard, Package, Truck,
  HeadphonesIcon, Info, Hexagon, LogOut, Search, Gift, Zap, Building2, Shield,
  Menu, X, ChevronLeft,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const groups = [
  {
    label: "ال€سية",
    items: [
      { title: "الصفحة ال€سية", url: "/", icon: Home },
      { title: "المتجر", url: "/shop", icon: Store },
      { title: "تصفح الفئات", url: "/categories", icon: Layers },
      { title: "البحث الذكي", url: "/search", icon: Search },
    ],
  },
  {
    label: "العروض والخدمات",
    items: [
      { title: "🧞 كنوز المارد", url: "/treasures", icon: Sparkles, highlight: true },
      { title: "العروض الحصرية", url: "/deals", icon: Tag },
      { title: "الجديد والمميز", url: "/new-arrivals", icon: Zap },
      { title: "الأكثر مبيعاً", url: "/bestsellers", icon: Zap },
      { title: "بطاقات الهدايا", url: "/gifts", icon: Gift },
      { title: "خدماتنا", url: "/services", icon: HeadphonesIcon },
      { title: "العلامات التجارية", url: "/brands", icon: Building2 },
    ],
  },
  {
    label: "التسوق",
    items: [
      { title: "سلة التسوق", url: "/cart", icon: ShoppingCart, showCart: true },
      { title: "المفضلة", url: "/wishlist", icon: Heart, auth: true },
      { title: "طلباتي", url: "/orders", icon: Package, auth: true },
      { title: "تتبع الشحنة", url: "/tracking", icon: Truck },
    ],
  },
  {
    label: "حسابي",
    items: [
      { title: "لوحة التحكم", url: "/dashboard/customer", icon: LayoutDashboard, auth: true },
      { title: "ملفي الشخصي", url: "/profile", icon: User, auth: true },
      { title: "محفظتي", url: "/wallet", icon: Wallet, auth: true },
      { title: "الإشعارات", url: "/notifications", icon: Bell, auth: true },
      { title: "🛡️ تواصل مع المسؤول", url: "/admin-contact", icon: Shield, auth: true, highlight: true },
    ],
  },
  {
    label: "للأعمال",
    items: [
      { title: "كن بائعاً", url: "/dashboard/seller", icon: Store, auth: true },
      { title: "بوابة المصانع B2B", url: "/dashboard/factory", icon: Factory, auth: true },
      { title: "كن موصِّلاً", url: "/dashboard/pilot", icon: Bike, auth: true },
      { title: "الوظائف", url: "/jobs", icon: Briefcase },
    ],
  },
  {
    label: "المعلومات",
    items: [
      { title: "من نحن", url: "/about", icon: Info },
      { title: "الدعم والمساعدة", url: "/support", icon: HeadphonesIcon },
    ],
  },
];

export function AppSidebar() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  const close = () => setOpen(false);

  return (
    <>
      {/* زر عائم دائم لفتح الشريط */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed top-1/2 -translate-y-1/2 right-0 z-40"
          >
            <Button
              onClick={() => setOpen(true)}
              size="icon"
              variant="default"
              aria-label="فتح القائمة"
              className="h-12 w-10 rounded-r-none rounded-l-2xl shadow-2xl bg-gradient-to-br from-primary to-accent hover:scale-105 transition-transform border-r-0"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-[85vw] max-w-sm sm:w-80 p-0 bg-sidebar text-sidebar-foreground border-l border-border/50 [&>button]:hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 px-3 py-3 border-b border-border/50 shrink-0">
            <NavLink to="/" onClick={close} className="flex items-center gap-2 group min-w-0">
              <div className="relative shrink-0">
                <Hexagon className="h-8 w-8 text-primary group-hover:rotate-180 transition-transform duration-700" strokeWidth={1.5} />
                <Hexagon className="h-4 w-4 text-accent absolute inset-0 m-auto" fill="currentColor" />
              </div>
              <div className="leading-tight min-w-0">
                <div className="font-cyber text-sm font-bold text-gradient-primary truncate">مارد التفوق</div>
                <div className="text-[9px] text-muted-foreground tracking-widest truncate">€قك إلى عالم التسوق</div>
              </div>
            </NavLink>
            <Button variant="ghost" size="icon" onClick={close} aria-label="إغلاق" className="shrink-0">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            <nav className="p-2 space-y-4">
              {groups.map((g, gi) => (
                <div key={g.label}>
                  <div className="px-2 pb-1 text-[10px] font-cyber tracking-widest text-primary/70">{g.label}</div>
                  <ul className="space-y-0.5">
                    {g.items.map((item, i) => (
                      <li key={item.url}>
                        <motion.div
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: gi * 0.03 + i * 0.015, duration: 0.2 }}
                        >
                          <NavLink
                            to={item.url}
                            end={item.url === "/"}
                            onClick={close}
                            className={({ isActive }) =>
                              cn(
                                "flex items-center gap-3 w-full rounded-md px-2.5 py-2 hover:bg-primary/10 transition-colors text-sm",
                                (item as any).highlight && "bg-gradient-mystic/20 border border-accent/30",
                                isActive && "bg-primary/15 text-primary border-r-2 border-primary",
                              )
                            }
                          >
                            <item.icon className={cn("h-4 w-4 shrink-0", (item as any).highlight && "text-accent animate-genie-glow")} />
                            <span className={cn("flex-1 truncate", (item as any).highlight && "shimmer-gold font-bold")}>{item.title}</span>
                            {(item as any).showCart && count > 0 && (
                              <Badge variant="secondary" className="h-5 min-w-5 px-1 bg-accent text-accent-foreground">{count}</Badge>
                            )}
                          </NavLink>
                        </motion.div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t border-border/50 p-2 shrink-0">
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { signOut(); close(); }}
                className="w-full justify-start gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span>تسجيل خروج</span>
              </Button>
            ) : (
              <Button
                variant="hero"
                size="sm"
                className="w-full"
                onClick={() => { navigate("/auth"); close(); }}
              >
                دخول / تسجيل
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
