import { useEffect, useRef, useState } from "react";
import { Send, Paperclip, Image as ImageIcon, FileText, X, Video, Phone, Mic, FileArchive, Code2, ExternalLink, Camera, Check, CheckCheck, Square, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { uploadEvidence, EvidenceFile } from "@/lib/supportEvidence";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  channelId: string;
  isAdmin?: boolean;
  compact?: boolean;
}

const AdminChatThread = ({ channelId, isAdmin = false, compact = false }: Props) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<EvidenceFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [channel, setChannel] = useState<any>(null);
  const [counterparty, setCounterparty] = useState<{ name: string; online: boolean; lastSeen?: string }>({ name: isAdmin ? "المستخدم" : "🛡️ فريق الدعم", online: true });
  const [recording, setRecording] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const recChunks = useRef<Blob[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const [{ data: msgs }, { data: ch }] = await Promise.all([
      supabase.from("admin_messages").select("*").eq("channel_id", channelId).order("created_at"),
      supabase.from("admin_channels").select("*").eq("id", channelId).maybeSingle(),
    ]);
    setMessages(msgs ?? []);
    setChannel(ch);
    if (ch && isAdmin) {
      const { data: prof } = await supabase.from("profiles").select("full_name").eq("id", ch.user_id).maybeSingle();
      const lastSeen = ch.last_message_at;
      const online = lastSeen ? (Date.now() - new Date(lastSeen).getTime() < 120_000) : false;
      setCounterparty({ name: (prof as any)?.full_name || "المستخدم", online, lastSeen });
    }
    if (user) await supabase.rpc("mark_admin_channel_read", { _channel_id: channelId });
  };

  useEffect(() => {
    load();
    const ch = supabase.channel(`admin_msgs_${channelId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "admin_messages", filter: `channel_id=eq.${channelId}` },
        (p) => setMessages(prev => {
          if (prev.some(m => m.id === p.new.id)) return prev;
          const idx = prev.findIndex(m => m._optimistic && m.sender_id === p.new.sender_id && (m.body || "") === (p.new.body || ""));
          if (idx >= 0) { const copy = [...prev]; copy[idx] = p.new; return copy; }
          return [...prev, p.new];
        }))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "admin_messages", filter: `channel_id=eq.${channelId}` },
        (p) => setMessages(prev => prev.map(m => m.id === p.new.id ? { ...m, ...p.new } : m)))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "admin_channels", filter: `id=eq.${channelId}` },
        (p) => setChannel(p.new))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [channelId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const onPickFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.length) return;
    setUploading(true);
    try {
      const uploaded: EvidenceFile[] = [];
      for (const f of Array.from(e.target.files)) {
        if (f.size > 20 * 1024 * 1024) { toast.error(`${f.name}: أكبر من 20MB`); continue; }
        uploaded.push(await uploadEvidence(user.id, f));
      }
      setFiles([...files, ...uploaded]);
    } catch (err: any) {
      toast.error("فشل رفع الملف: " + err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
      if (cameraRef.current) cameraRef.current.value = "";
    }
  };

  const send = async (overrideFiles?: EvidenceFile[], overrideBody?: string) => {
    const useFiles = overrideFiles ?? files;
    const useBody = (overrideBody ?? body).trim();
    if (!user || (!useBody && useFiles.length === 0)) return;
    const tempId = `temp_${Date.now()}`;
    const optimistic = {
      id: tempId, channel_id: channelId, sender_id: user.id,
      sender_role: isAdmin ? "admin" : "user",
      body: useBody || null, attachments: useFiles,
      created_at: new Date().toISOString(), _optimistic: true,
    };
    setMessages(prev => [...prev, optimistic]);
    if (!overrideBody) setBody("");
    if (!overrideFiles) setFiles([]);
    setSending(true);
    const { error } = await supabase.from("admin_messages").insert({
      channel_id: channelId, sender_id: user.id,
      sender_role: isAdmin ? "admin" : "user",
      body: useBody || null, attachments: useFiles as any,
    } as any);
    setSending(false);
    if (error) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      return toast.error("تعذّر الإرسال");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      recChunks.current = [];
      mr.ondataavailable = (e) => e.data.size && recChunks.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(recChunks.current, { type: "audio/webm" });
        const file = new File([blob], `voice_${Date.now()}.webm`, { type: "audio/webm" });
        if (!user) return;
        setUploading(true);
        try {
          const ev = await uploadEvidence(user.id, file);
          await send([ev], "");
        } catch (e: any) { toast.error("فشل رفع التسجيل"); }
        finally { setUploading(false); }
      };
      mr.start(); recRef.current = mr; setRecording(true);
    } catch { toast.error("تعذّر الوصول للميكروفون"); }
  };
  const stopRecording = () => { recRef.current?.stop(); setRecording(false); };

  const startCall = async (mode: "audio" | "video") => {
    if (!user) return;
    const joinUrl = `/support-call/${channelId}?mode=${mode}`;
    const startUrl = `${joinUrl}&start=1`;
    const { error } = await supabase.from("admin_messages").insert({
      channel_id: channelId, sender_id: user.id,
      sender_role: isAdmin ? "admin" : "user",
      body: mode === "video" ? "📹 تم فتح مكالمة فيديو مباشرة" : "🎙️ تم فتح مكالمة صوت مباشرة",
      attachments: [{ url: joinUrl, kind: `call/${mode}`, name: mode === "video" ? "انضمام لمكالمة الفيديو" : "انضمام للمكالمة الصوتية", size: 0 }] as any,
    } as any);
    if (error) return toast.error("تعذّر فتح المكالمة");
    window.open(startUrl, "_blank", "noopener,noreferrer");
  };

  const closeTicket = async () => {
    if (!isAdmin) return;
    const { error } = await supabase.rpc("admin_close_channel", { _channel_id: channelId, _status: "closed" as any });
    if (error) return toast.error("تعذّر الإغلاق");
    toast.success("تم إغلاق التذكرة");
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("هل تريد حذف هذه الرسالة؟ لا يمكن التراجع.")) return;
    const { error } = await supabase.rpc("delete_admin_message" as any, { _message_id: id });
    if (error) return toast.error("تعذّر الحذف: " + error.message);
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, body: null, attachments: [], deleted_at: new Date().toISOString() } : m)));
    toast.success("تم حذف الرسالة");
  };

  const renderAttachment = (a: EvidenceFile, i: number, mine: boolean) => {
    const kind = a.kind || "application/octet-stream";
    if (kind.startsWith("call/")) {
      const isVideo = kind.includes("video");
      return (
        <Button key={i} asChild size="sm" variant={mine ? "secondary" : "gold"} className="w-full justify-between">
          <a href={a.url} target="_blank" rel="noreferrer">
            <span className="inline-flex items-center gap-2">{isVideo ? <Video className="h-4 w-4" /> : <Phone className="h-4 w-4" />} {a.name}</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>
      );
    }
    if (kind.startsWith("image/")) {
      return (
        <a key={i} href={a.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl ring-1 ring-white/10">
          <img src={a.url} alt={a.name} className="max-h-60 w-full object-cover" loading="lazy" />
        </a>
      );
    }
    if (kind.startsWith("video/")) return <video key={i} src={a.url} controls className="max-h-60 w-full rounded-xl ring-1 ring-white/10" />;
    if (kind.startsWith("audio/")) return <audio key={i} src={a.url} controls className="w-full" />;
    const Icon = kind.includes("zip") || kind.includes("rar") ? FileArchive : kind.includes("text") || a.name?.match(/\.(js|ts|tsx|jsx|json|css|html|py|sql)$/i) ? Code2 : FileText;
    return (
      <a key={i} href={a.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg bg-black/20 px-3 py-2 text-xs underline">
        <Icon className="h-3.5 w-3.5" />
        <span className="truncate max-w-[180px]">{a.name}</span>
        {a.size > 0 && <span className="opacity-70">({Math.round(a.size / 1024)}KB)</span>}
      </a>
    );
  };

  // Read receipts: counterparty's unread counter == 0 means they've read everything up to last_message_at
  const counterUnread = isAdmin ? (channel?.unread_for_user ?? 0) : (channel?.unread_for_admin ?? 0);
  const isRead = (m: any) => counterUnread === 0 && !m._optimistic;

  return (
    <div className={`flex flex-col ${compact ? "h-[400px]" : "h-[min(78vh,760px)]"} rounded-xl border border-border/50 overflow-hidden bg-[hsl(270_40%_5%)]`}>
      {/* Header — WhatsApp style */}
      <div className="flex items-center justify-between gap-2 border-b border-border/50 px-4 py-2.5 bg-gradient-to-r from-[hsl(275_60%_12%)] to-[hsl(280_50%_8%)]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold">
              {(counterparty.name || "?").charAt(0)}
            </div>
            {counterparty.online && <span className="absolute bottom-0 end-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-[hsl(275_60%_12%)]" />}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold truncate">{counterparty.name}</div>
            <div className="text-[10px] text-muted-foreground">
              {counterparty.online ? <span className="text-green-400">● متصل الآن</span> : counterparty.lastSeen ? `آخر ظهور ${new Date(counterparty.lastSeen).toLocaleString("ar", { hour: "2-digit", minute: "2-digit" })}` : "غير متصل"}
            </div>
          </div>
        </div>
        <div className="flex gap-1.5">
          <Button variant="ghost" size="icon" onClick={() => startCall("audio")} className="h-8 w-8" title="مكالمة صوتية"><Phone className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => startCall("video")} className="h-8 w-8" title="مكالمة فيديو"><Video className="h-4 w-4" /></Button>
          {isAdmin && <Button variant="ghost" size="icon" onClick={closeTicket} className="h-8 w-8 text-destructive" title="إغلاق التذكرة"><X className="h-4 w-4" /></Button>}
        </div>
      </div>

      {/* Messages — WhatsApp pattern background */}
      <div
        className="flex-1 overflow-y-auto px-3 py-4 space-y-2"
        style={{
          backgroundColor: "hsl(270 40% 5%)",
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'><g fill='none' stroke='%234B0082' stroke-opacity='0.08' stroke-width='1'><circle cx='40' cy='40' r='3'/><path d='M10 10l8 8M62 10l8 8M10 62l8 8M62 62l8 8'/><circle cx='10' cy='40' r='1.5'/><circle cx='70' cy='40' r='1.5'/><circle cx='40' cy='10' r='1.5'/><circle cx='40' cy='70' r='1.5'/></g></svg>")`,
        }}
      >
        <AnimatePresence initial={false}>
          {messages.map((m) => {
            if (m.is_system) {
              return (
                <motion.div key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center my-2">
                  <div className="text-[11px] text-foreground/80 bg-accent/10 border border-accent/20 rounded-full px-3 py-1">{m.body}</div>
                </motion.div>
              );
            }
            const isDeleted = !!m.deleted_at;
            const fromAdmin = m.sender_role === "admin";
            const mine = m.sender_id === user?.id;
            const canDelete = !isDeleted && (mine || isAdmin);
            const alignRight = !fromAdmin;
            const bubbleColor = isDeleted
              ? "bg-muted/40 text-muted-foreground italic"
              : fromAdmin
                ? "bg-[hsl(0_70%_28%)] text-white rounded-tl-sm"
                : "bg-[hsl(150_70%_22%)] text-white rounded-tr-sm";
            const tailSide = fromAdmin ? "tail-left" : "tail-right";
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="flex group"
                style={{ flexDirection: alignRight ? "row-reverse" : "row" }}
              >
                <div className={`relative max-w-[78%] px-3 py-2 rounded-2xl shadow-md ${bubbleColor} ${tailSide}`}>
                  {!isDeleted && (
                    <span
                      aria-hidden
                      className="absolute top-0 h-3 w-3"
                      style={{
                        [fromAdmin ? "left" : "right"]: "-6px",
                        background: fromAdmin ? "hsl(0 70% 28%)" : "hsl(150 70% 22%)",
                        clipPath: fromAdmin ? "polygon(0 0, 100% 0, 100% 100%)" : "polygon(0 0, 100% 0, 0 100%)",
                      }}
                    />
                  )}
                  {isDeleted ? (
                    <div className="text-xs flex items-center gap-1.5"><Trash2 className="h-3 w-3" /> تم حذف هذه الرسالة</div>
                  ) : (
                    <>
                      {m.body && <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">{m.body}</div>}
                      {Array.isArray(m.attachments) && m.attachments.length > 0 && (
                        <div className="mt-2 space-y-2">{m.attachments.map((a: any, i: number) => renderAttachment(a, i, mine))}</div>
                      )}
                    </>
                  )}
                  <div className="flex items-center gap-1 justify-end mt-1 -mb-0.5 text-[10px] text-white/75">
                    {canDelete && (
                      <button onClick={() => deleteMessage(m.id)} className="opacity-0 group-hover:opacity-100 transition hover:text-red-300" title="حذف">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                    <span>{new Date(m.created_at).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}</span>
                    {mine && !isDeleted && (
                      m._optimistic
                        ? <Check className="h-3 w-3" />
                        : isRead(m)
                          ? <CheckCheck className="h-3.5 w-3.5 text-sky-300" />
                          : <CheckCheck className="h-3.5 w-3.5 text-white/60" />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {messages.length === 0 && <div className="text-center text-muted-foreground text-sm py-12">ابدأ المحادثة بإرسال رسالتك الأولى</div>}
        <div ref={endRef} />
      </div>

      {/* Pending attachments */}
      {files.length > 0 && (
        <div className="px-3 pt-2 flex flex-wrap gap-1.5 border-t border-border/30 bg-[hsl(275_50%_8%)]">
          {files.map((f, i) => (
            <Badge key={i} variant="secondary" className="gap-1.5">
              <FileText className="h-3 w-3" />
              <span className="max-w-[120px] truncate">{f.name}</span>
              <button onClick={() => setFiles(files.filter((_, j) => j !== i))}><X className="h-3 w-3" /></button>
            </Badge>
          ))}
        </div>
      )}

      {/* Composer */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="p-2.5 border-t border-border/50 bg-[hsl(275_50%_8%)] flex gap-1.5 items-end"
      >
        <input ref={fileRef} type="file" multiple hidden onChange={onPickFiles}
               accept="image/*,video/*,audio/*,text/*,application/pdf,.doc,.docx,.txt,.js,.ts,.tsx,.jsx,.json,.css,.html,.py,.sql,.zip,.rar" />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={onPickFiles} />
        <Button type="button" variant="ghost" size="icon" onClick={() => fileRef.current?.click()} disabled={uploading} title="إرفاق" className="h-10 w-10 shrink-0">
          <Paperclip className="h-5 w-5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => cameraRef.current?.click()} disabled={uploading} title="كاميرا" className="h-10 w-10 shrink-0">
          <Camera className="h-5 w-5" />
        </Button>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
          placeholder={isAdmin ? "اكتب ردّك..." : "اكتب رسالة..."}
          className="flex-1 min-h-[40px] max-h-32 resize-none py-2.5 text-sm bg-background rounded-2xl"
          disabled={sending || recording}
          autoFocus
        />
        {body.trim() || files.length > 0 ? (
          <Button type="submit" variant="hero" size="icon" disabled={sending || uploading} className="h-10 w-10 shrink-0 rounded-full">
            <Send className="h-4 w-4" />
          </Button>
        ) : recording ? (
          <Button type="button" variant="destructive" size="icon" onClick={stopRecording} className="h-10 w-10 shrink-0 rounded-full animate-pulse">
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" variant="gold" size="icon" onClick={startRecording} className="h-10 w-10 shrink-0 rounded-full" title="رسالة صوتية">
            <Mic className="h-5 w-5" />
          </Button>
        )}
      </form>
    </div>
  );
};

export default AdminChatThread;
