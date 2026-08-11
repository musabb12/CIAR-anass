import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Search, Ban, Archive, UserCog, ShieldOff, ShieldCheck, LogOut, Eye, Phone, MapPin, Calendar, Hash, Mail, ArchiveRestore, UserCheck } from "lucide-react";
import { toast } from "sonner";

const ALL_ROLES = ["customer", "seller", "factory", "pilot", "jobseeker", "admin"] as const;
type Role = (typeof ALL_ROLES)[number];

interface UserRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  avatar_url: string | null;
  is_archived: boolean;
  archived_at: string | null;
  preferred_language: string | null;
  created_at: string;
  last_seen_at: string | null;
  roles: Role[];
  banned: boolean;
  banned_until: string | null;
  ban_reason: string | null;
  wallet_balance: number;
}

const AdminUsersPanel = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "banned" | "archived" | "admin">("all");
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [banDlg, setBanDlg] = useState<{ open: boolean; user?: UserRow; reason: string; days: string }>({ open: false, reason: "", days: "" });
  const [roleDlg, setRoleDlg] = useState<{ open: boolean; user?: UserRow; role: Role }>({ open: false, role: "seller" });

  const load = async () => {
    setLoading(true);
    const [{ data: profs }, { data: roles }, { data: bans }, { data: wallets }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("user_roles").select("user_id, role"),
      (supabase as any).from("user_bans").select("user_id, banned_until, reason, is_active"),
      supabase.from("wallets").select("user_id, balance"),
    ]);
    const roleMap: Record<string, Role[]> = {};
    (roles ?? []).forEach((r: any) => { (roleMap[r.user_id] ??= []).push(r.role); });
    const banMap: Record<string, any> = {};
    (bans ?? []).forEach((b: any) => { if (b.is_active) banMap[b.user_id] = b; });
    const walletMap: Record<string, number> = {};
    (wallets ?? []).forEach((w: any) => { walletMap[w.user_id] = Number(w.balance || 0); });

    const list: UserRow[] = (profs ?? []).map((p: any) => ({
      id: p.id, full_name: p.full_name, phone: p.phone, city: p.city, avatar_url: p.avatar_url,
      is_archived: !!p.is_archived, archived_at: p.archived_at, preferred_language: p.preferred_language,
      created_at: p.created_at, last_seen_at: p.last_seen_at,
      roles: roleMap[p.id] ?? ["customer"],
      banned: !!banMap[p.id],
      banned_until: banMap[p.id]?.banned_until ?? null,
      ban_reason: banMap[p.id]?.reason ?? null,
      wallet_balance: walletMap[p.id] ?? 0,
    }));
    setUsers(list);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter((u) => {
    if (filter === "banned" && !u.banned) return false;
    if (filter === "archived" && !u.is_archived) return false;
    if (filter === "admin" && !u.roles.includes("admin")) return false;
    if (filter === "active" && (u.banned || u.is_archived)) return false;
    if (q.trim()) {
      const s = q.toLowerCase();
      if (![u.full_name, u.phone, u.city, u.id].some((v) => String(v || "").toLowerCase().includes(s))) return false;
    }
    return true;
  });

  const callBan = async () => {
    if (!banDlg.user || !banDlg.reason.trim()) return toast.error("اكتب السبب");
    const days = Number(banDlg.days) || 0;
    const until = days > 0 ? new Date(Date.now() + days * 86400000).toISOString() : null;
    const { error } = await supabase.rpc("admin_ban_user", { _user_id: banDlg.user.id, _reason: banDlg.reason, _until: until as any });
    if (error) return toast.error(error.message);
    toast.success("✅ تم حظر المستخدم");
    setBanDlg({ open: false, reason: "", days: "" });
    load();
  };

  const callUnban = async (u: UserRow) => {
    const { error } = await supabase.rpc("admin_unban_user" as any, { _user_id: u.id });
    if (error) return toast.error(error.message);
    toast.success("✅ تم إلغاء الحظر");
    load();
  };

  const callArchive = async (u: UserRow, archive: boolean) => {
    const { error } = await supabase.rpc("admin_archive_user" as any, { _user_id: u.id, _archive: archive });
    if (error) return toast.error(error.message);
    toast.success(archive ? "📦 تم أرشفة الحساب" : "♻️ تم استعادة الحساب");
    load();
  };

  const callRole = async (u: UserRow, role: Role, add: boolean) => {
    const { error } = await supabase.rpc("admin_set_user_role" as any, { _user_id: u.id, _role: role, _add: add });
    if (error) return toast.error(error.message);
    toast.success(add ? `✅ تم منح صلاحية ${role}` : `🚫 تم سحب صلاحية ${role}`);
    load();
    setSelected((s) => (s?.id === u.id ? { ...s, roles: add ? [...new Set([...s.roles, role])] : s.roles.filter((r) => r !== role) } : s));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-lg flex items-center gap-2"><UserCog className="h-5 w-5 text-primary" /> إدارة المستخدمين الشاملة</h2>
          <p className="text-xs text-muted-foreground mt-1">{users.length} مستخدم • تحكم كامل: حظر، طرد، ترقية، أرشفة</p>
        </div>
        <div className="flex gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute top-1/2 -translate-y-1/2 start-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالاسم/الهاتف/المعرّف..." className="ps-8 h-9" />
          </div>
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {[
          { k: "all", l: "الكل" },
          { k: "active", l: "نشط" },
          { k: "banned", l: "محظور" },
          { k: "archived", l: "مؤرشف" },
          { k: "admin", l: "مسؤولون" },
        ].map((f) => (
          <Button key={f.k} size="sm" variant={filter === f.k ? "hero" : "outline"} onClick={() => setFilter(f.k as any)} className="h-8 text-xs">
            {f.l}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-sm text-muted-foreground">جارٍ التحميل...</div>
      ) : (
        <div className="space-y-2 max-h-[640px] overflow-y-auto pe-1">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">لا يوجد مستخدمون</div>
          ) : filtered.map((u) => (
            <motion.div key={u.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className={`glass border rounded-xl p-3 flex items-center gap-3 ${u.banned ? "border-destructive/50" : u.is_archived ? "border-muted opacity-70" : "border-border/40"}`}>
              <div className="h-11 w-11 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-white overflow-hidden">
                {u.avatar_url ? <img src={u.avatar_url} className="h-full w-full object-cover" /> : (u.full_name || "؟").slice(0, 1)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm truncate">{u.full_name || "بدون اسم"}</span>
                  {u.banned && <Badge className="h-4 px-1 text-[9px] bg-destructive/20 text-destructive">🚫 محظور</Badge>}
                  {u.is_archived && <Badge className="h-4 px-1 text-[9px] bg-muted">📦 مؤرشف</Badge>}
                  {u.roles.map((r) => (
                    <Badge key={r} variant="outline" className="h-4 px-1 text-[9px]">{r}</Badge>
                  ))}
                </div>
                <div className="flex gap-3 text-[10px] text-muted-foreground mt-0.5 flex-wrap">
                  <span><Phone className="inline h-3 w-3 ms-0.5" />{u.phone || "—"}</span>
                  <span><MapPin className="inline h-3 w-3 ms-0.5" />{u.city || "—"}</span>
                  <span><Calendar className="inline h-3 w-3 ms-0.5" />{new Date(u.created_at).toLocaleDateString("ar")}</span>
                  <span>💰 {u.wallet_balance.toLocaleString()} ر.ي</span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => setSelected(u)} title="عرض"><Eye className="h-3.5 w-3.5" /></Button>
                {u.banned ? (
                  <Button size="sm" variant="ghost" className="text-green-500" onClick={() => callUnban(u)} title="إلغاء الحظر"><ShieldCheck className="h-3.5 w-3.5" /></Button>
                ) : (
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setBanDlg({ open: true, user: u, reason: "", days: "" })} title="حظر / طرد"><Ban className="h-3.5 w-3.5" /></Button>
                )}
                {u.is_archived ? (
                  <Button size="sm" variant="ghost" onClick={() => callArchive(u, false)} title="استعادة"><ArchiveRestore className="h-3.5 w-3.5" /></Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => callArchive(u, true)} title="أرشفة"><Archive className="h-3.5 w-3.5" /></Button>
                )}
                <Button size="sm" variant="ghost" className="text-primary" onClick={() => setRoleDlg({ open: true, user: u, role: "seller" })} title="إدارة الصلاحيات"><UserCheck className="h-3.5 w-3.5" /></Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>📋 بيانات المستخدم الكاملة</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xl font-bold text-white overflow-hidden">
                  {selected.avatar_url ? <img src={selected.avatar_url} className="h-full w-full object-cover" /> : (selected.full_name || "؟").slice(0, 1)}
                </div>
                <div>
                  <div className="font-bold text-lg">{selected.full_name || "بدون اسم"}</div>
                  <div className="flex gap-1 mt-1">{selected.roles.map((r) => <Badge key={r} variant="outline" className="text-[10px]">{r}</Badge>)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="glass p-2 rounded"><Hash className="inline h-3 w-3 ms-1" />المعرّف:<div className="font-mono text-[10px] truncate mt-1">{selected.id}</div></div>
                <div className="glass p-2 rounded"><Phone className="inline h-3 w-3 ms-1" />الهاتف:<div className="mt-1">{selected.phone || "—"}</div></div>
                <div className="glass p-2 rounded"><MapPin className="inline h-3 w-3 ms-1" />المدينة:<div className="mt-1">{selected.city || "—"}</div></div>
                <div className="glass p-2 rounded"><Calendar className="inline h-3 w-3 ms-1" />الانضمام:<div className="mt-1">{new Date(selected.created_at).toLocaleString("ar")}</div></div>
                <div className="glass p-2 rounded">💰 الرصيد:<div className="mt-1 font-bold text-accent">{selected.wallet_balance.toLocaleString()} ر.ي</div></div>
                <div className="glass p-2 rounded">🌐 اللغة:<div className="mt-1">{selected.preferred_language || "ar"}</div></div>
                {selected.banned && (
                  <div className="glass p-2 rounded col-span-2 border border-destructive/40">
                    🚫 محظور: {selected.ban_reason}
                    {selected.banned_until && <div className="text-[10px] mt-1">حتى: {new Date(selected.banned_until).toLocaleString("ar")}</div>}
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs font-bold mb-2">إدارة الصلاحيات (الأدوار)</div>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_ROLES.map((r) => {
                    const has = selected.roles.includes(r);
                    return (
                      <Button key={r} size="sm" variant={has ? "hero" : "outline"} className="h-7 text-[10px]" onClick={() => callRole(selected, r, !has)}>
                        {has ? "✓" : "+"} {r}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Ban Dialog */}
      <Dialog open={banDlg.open} onOpenChange={(o) => setBanDlg({ ...banDlg, open: o })}>
        <DialogContent>
          <DialogHeader><DialogTitle>🚫 حظر / طرد المستخدم</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Textarea placeholder="سبب الحظر..." value={banDlg.reason} onChange={(e) => setBanDlg({ ...banDlg, reason: e.target.value })} />
            <Input type="number" placeholder="عدد الأيام (0 = دائم)" value={banDlg.days} onChange={(e) => setBanDlg({ ...banDlg, days: e.target.value })} />
            <div className="flex gap-2">
              <Button variant="destructive" onClick={callBan} className="flex-1">تأكيد الحظر</Button>
              <Button variant="outline" onClick={() => setBanDlg({ open: false, reason: "", days: "" })}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsersPanel;
