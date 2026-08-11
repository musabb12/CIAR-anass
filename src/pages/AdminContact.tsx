import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Plus, MessageCircle, AlertOctagon, LifeBuoy, Ticket, HelpCircle, Mail, Send, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminChatThread from "@/components/admin-chat/AdminChatThread";
import { toast } from "sonner";

const KIND_META: Record<string, { label: string; icon: any; color: string; desc: string }> = {
  contact:    { label: "تواصل مباشر", icon: MessageCircle, color: "text-primary",     desc: "تواصل مباشرة مع فريق المسؤولين" },
  support:    { label: "الدعم الفني",  icon: LifeBuoy,     color: "text-accent",      desc: "مشاكل تقنية، مدفوعات، أو حساب" },
  ticket:     { label: "تذكرة",        icon: Ticket,       color: "text-blue-400",    desc: "طلبات رسمية تحتاج متابعة" },
  complaint:  { label: "شكوى",         icon: AlertOctagon, color: "text-orange-400",  desc: "شكاوى ضد متجر أو مستخدم أو سائق" },
  report:     { label: "بلاغ",         icon: AlertOctagon, color: "text-destructive", desc: "بلاغ احتيال أو محتوى مسيء (مع أدلة)" },
  help:       { label: "مساعدة",       icon: HelpCircle,   color: "text-green-400",   desc: "أسئلة عامة وإرشادات الاستخدام" },
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  open:        { label: "مفتوحة",  cls: "bg-primary/20 text-primary" },
  in_progress: { label: "قيد المعالجة", cls: "bg-accent/20 text-accent" },
  resolved:    { label: "تم الحل", cls: "bg-green-500/20 text-green-400" },
  closed:      { label: "مغلقة",   cls: "bg-muted text-muted-foreground" },
};

const AdminContact = () => {
  const { user } = useAuth();
  const [channels, setChannels] = useState<any[]>([]);
  const [active, setActive] = useState<any | null>(null);
  const [tab, setTab] = useState("all");

  // create form
  const [open, setOpen] = useState(false);
  const [newKind, setNewKind] = useState<string>("contact");
  const [newSubject, setNewSubject] = useState("");
  const [newPriority, setNewPriority] = useState("normal");
  const [newBody, setNewBody] = useState("");

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("admin_channels").select("*").eq("user_id", user.id).order("last_message_at", { ascending: false });
    setChannels(data ?? []);
  };

  useEffect(() => { load(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel(`my_admin_channels_${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_channels", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const create = async () => {
    if (!user || !newSubject.trim() || !newBody.trim()) return toast.error("أكمل الموضوع والرسالة");
    const { data: ch, error } = await supabase.from("admin_channels").insert({
      user_id: user.id, kind: newKind as any, subject: newSubject.trim(), priority: newPriority,
      metadata: {
        email: user.email,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen: `${window.screen.width}x${window.screen.height}`,
      },
    }).select().single();
    if (error || !ch) return toast.error("تعذّر الإنشاء");

    await supabase.from("admin_messages").insert({
      channel_id: ch.id, sender_id: user.id, sender_role: "user", body: newBody.trim(),
    });

    toast.success("تم الإرسال — سيتم الرد قريباً");
    setOpen(false); setNewSubject(""); setNewBody(""); setNewKind("contact"); setNewPriority("normal");
    await load();
    setActive(ch);
  };

  const filtered = tab === "all" ? channels : channels.filter(c => c.kind === tab);

  if (active) {
    const meta = KIND_META[active.kind];
    const Icon = meta.icon;
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container py-6 max-w-3xl">
          <Button variant="ghost" size="sm" onClick={() => { setActive(null); load(); }} className="mb-4">
            <ChevronLeft className="h-4 w-4 ms-1" /> عودة
          </Button>
          <div className="glass rounded-2xl p-5 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Icon className={`h-6 w-6 ${meta.color}`} />
                <div>
                  <div className="text-xs font-cyber text-muted-foreground">{meta.label}</div>
                  <h2 className="font-bold text-lg">{active.subject}</h2>
                </div>
              </div>
              <Badge className={STATUS_META[active.status]?.cls}>{STATUS_META[active.status]?.label}</Badge>
            </div>
            {active.status !== "resolved" && active.status !== "closed" && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={async () => {
                  const { error } = await supabase.rpc("user_close_channel", { _channel_id: active.id });
                  if (error) return toast.error("تعذّر الإغلاق");
                  toast.success("تم إغلاق التذكرة");
                  setActive(null); load();
                }}
              >
                ✅ إغلاق التذكرة
              </Button>
            )}
          </div>
          <AdminChatThread channelId={active.id} isAdmin={false} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-6 max-w-4xl">
        <div className="glass rounded-2xl p-6 mb-6 relative overflow-hidden">
          <div className="absolute -top-12 -end-12 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-accent/15 text-accent flex items-center justify-center">
              <Shield className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-black">تواصل مع المسؤول</h1>
              <p className="text-sm text-muted-foreground">دعم، تذاكر، شكاوى، بلاغات وتواصل مباشر — كل شيء في مكان واحد</p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="hero"><Plus className="h-4 w-4 ms-1" /> جديد</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>إنشاء محادثة جديدة</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">النوع</label>
                    <Select value={newKind} onValueChange={setNewKind}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(KIND_META).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v.label} — {v.desc}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">الأولوية</label>
                    <Select value={newPriority} onValueChange={setNewPriority}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">منخفضة</SelectItem>
                        <SelectItem value="normal">عادية</SelectItem>
                        <SelectItem value="high">مرتفعة</SelectItem>
                        <SelectItem value="urgent">عاجلة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input placeholder="الموضوع *" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} maxLength={120} />
                  <Textarea placeholder="اكتب رسالتك بالتفصيل..." value={newBody} onChange={(e) => setNewBody(e.target.value)} rows={5} maxLength={2000} />
                  <Button variant="hero" className="w-full" onClick={create}>
                    <Send className="h-4 w-4 ms-1" /> إرسال للمسؤول
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center">سيتم الرد عبر الدردشة، ويمكنك إرفاق صور وأدلة من داخل المحادثة</p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-4 md:grid-cols-7 mb-4">
            <TabsTrigger value="all">الكل</TabsTrigger>
            {Object.entries(KIND_META).map(([k, v]) => (
              <TabsTrigger key={k} value={k} className="text-[11px]">{v.label}</TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={tab}>
            <div className="space-y-2">
              {filtered.length === 0 ? (
                <div className="glass rounded-xl p-10 text-center text-muted-foreground">
                  لا توجد محادثات بعد. أنشئ محادثة جديدة للتواصل مع المسؤول.
                </div>
              ) : filtered.map((c, i) => {
                const meta = KIND_META[c.kind];
                const Icon = meta?.icon ?? Mail;
                return (
                  <motion.button
                    key={c.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setActive(c)}
                    className="w-full glass rounded-xl p-4 flex items-start gap-3 hover:border-primary/40 border border-transparent transition text-start"
                  >
                    <div className={`h-10 w-10 rounded-lg bg-secondary/40 flex items-center justify-center ${meta?.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h3 className="font-bold text-sm truncate">{c.subject}</h3>
                        {c.unread_for_user > 0 && (
                          <Badge className="bg-accent text-accent-foreground h-5 min-w-5 px-1.5 text-[10px]">{c.unread_for_user}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{meta?.label}</span>
                        <span>•</span>
                        <Badge variant="outline" className={`${STATUS_META[c.status]?.cls} border-0 h-4 px-1.5 text-[9px]`}>
                          {STATUS_META[c.status]?.label}
                        </Badge>
                        <span>•</span>
                        <span>{new Date(c.last_message_at).toLocaleDateString("ar")}</span>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminContact;
