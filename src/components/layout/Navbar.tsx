import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { LogOut, LayoutDashboard, ShoppingCart, Heart, Bell, Wallet, User, Store, Briefcase, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { ROLES } from "@/lib/roles";
import { supabase } from "@/integrations/supabase/client";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import ThemeToggle from "@/components/common/ThemeToggle";
import ciarLogo from "@/assets/ciar-logo.png";

const Navbar = () => {
  const { user, roles, signOut } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const primaryRolePath = ROLES.find((r) => roles.includes(r.id))?.path ?? "/auth";

  useEffect(() => {
    if (!user) { setUnread(0); return; }
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false).then(({ count }) => setUnread(count ?? 0));
  }, [user]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? "glass border-b border-border/60 shadow-sm" : "bg-transparent border-b border-transparent"}`}>
      <div className="container flex h-14 sm:h-16 items-center justify-between gap-2 overflow-hidden">
        <div className="flex items-center gap-2 shrink-0">
          <Link to="/" className="flex items-center gap-2 group">
            <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl overflow-hidden flex items-center justify-center transition-shadow ${scrolled ? "shadow-sm" : "drop-shadow-[0_2px_10px_rgba(120,60,255,0.45)]"}`}>
              <img src={ciarLogo} alt="شعار CiAR" width={40} height={40} className="h-full w-full object-contain" />
            </div>

            <div className="leading-none min-w-0">
              <div className={`text-sm sm:text-base font-extrabold tracking-normal ${scrolled ? "text-foreground" : "text-white drop-shadow"}`}>CiAR</div>
              <div className={`hidden sm:block text-[10px] tracking-normal uppercase whitespace-nowrap ${scrolled ? "text-muted-foreground" : "text-white/70"}`}>Global Commerce</div>
            </div>
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-6 text-sm">
          <Link to="/shop" className="text-muted-foreground hover:text-primary transition flex items-center gap-1"><Store className="h-4 w-4" /> المتجر</Link>
          <Link to="/jobs" className="text-muted-foreground hover:text-primary transition flex items-center gap-1"><Briefcase className="h-4 w-4" /> الوظائف</Link>
        </nav>

        <div className="flex min-w-0 items-center justify-end gap-0.5 sm:gap-1">
          <div className="hidden sm:block">
            <ThemeToggle onLight={!scrolled} />
          </div>
          <div className="rounded-full border border-accent/40 bg-accent/5 p-0.5 sm:ps-1 sm:pe-2 sm:py-0.5 sm:me-1 glow-gold shrink-0">
            <LanguageSwitcher compact />
          </div>
          {user && (
            <>
              <Button variant="ghost" size="icon" onClick={() => navigate("/wishlist")} aria-label="مفضلة" className="hidden sm:inline-flex"><Heart className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/wallet")} aria-label="محفظة" className="hidden sm:inline-flex"><Wallet className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/notifications")} aria-label="إشعارات" className="relative">
                <Bell className="h-4 w-4" />
                {unread > 0 && <span className="absolute top-1 end-1 h-2 w-2 rounded-full bg-accent" />}
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" onClick={() => navigate("/cart")} aria-label="سلة" className="relative">
            <ShoppingCart className="h-4 w-4" />
            {count > 0 && <span className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">{count}</span>}
          </Button>
          {user ? (
            <>
              <Button variant="outline" size="sm" onClick={() => navigate(primaryRolePath)} className="hidden md:flex">
                <LayoutDashboard className="ms-2 h-4 w-4" /> لوحتي
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/profile")} aria-label="ملف" className="hidden sm:inline-flex"><User className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={signOut} aria-label="خروج" className="hidden sm:inline-flex"><LogOut className="h-4 w-4" /></Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="hidden sm:inline-flex">دخول</Button>
              <Button variant="hero" size="sm" onClick={() => navigate("/auth?mode=signup")} className="hidden sm:inline-flex">ابدأ</Button>
            </>
          )}
          <Button variant="ghost" size="icon" onClick={() => navigate("/search")} aria-label="القائمة" className="sm:hidden">
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
