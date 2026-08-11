import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Hexagon, LogOut, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ROLES } from "@/lib/roles";
import type { AppRole } from "@/hooks/useAuth";

interface Props {
  role: AppRole;
  title: string;
  subtitle: string;
  children: ReactNode;
}

const DashboardShell = ({ role, title, subtitle, children }: Props) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const roleConfig = ROLES.find((r) => r.id === role)!;
  const Icon = roleConfig.icon;
  const isGold = roleConfig.accent === "gold";

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Hexagon className="h-7 w-7 text-primary" strokeWidth={1.5} />
            <div>
              <div className="font-cyber text-sm font-bold text-gradient-primary">مارد التفوق</div>
              <div className="text-[10px] text-muted-foreground tracking-widest">{roleConfig.label.toUpperCase()}</div>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden md:block text-xs text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} aria-label="ال€سية">
              <Home className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={async () => { await signOut(); navigate("/"); }}>
              <LogOut className="ms-2 h-4 w-4" /> خروج
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Hero strip */}
        <div className="relative rounded-2xl bg-gradient-card border border-border/50 p-6 md:p-8 mb-8 overflow-hidden">
          <div className={`absolute -top-20 -right-20 h-48 w-48 rounded-full blur-3xl ${isGold ? "bg-accent/30" : "bg-primary/30"}`} />
          <div className="relative flex items-center gap-5">
            <div className={`h-14 w-14 rounded-xl flex items-center justify-center ${isGold ? "bg-accent/15 text-accent" : "bg-primary/15 text-primary"} animate-pulse-glow`}>
              <Icon className="h-7 w-7" />
            </div>
            <div>
              <div className="font-cyber text-xs tracking-widest text-muted-foreground mb-1">// {roleConfig.label.toUpperCase()} CONSOLE</div>
              <h1 className="text-2xl md:text-3xl font-black">{title}</h1>
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            </div>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
};

export default DashboardShell;
