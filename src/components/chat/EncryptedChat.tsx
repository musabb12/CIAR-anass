import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Lock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { encryptMessage, decryptMessage } from "@/lib/crypto";
import { formatDate } from "@/lib/format";

interface Props {
  orderId: string;
  otherUserId: string;
}

interface Msg {
  id: string;
  sender_id: string;
  text: string;
  created_at: string;
}

const EncryptedChat = ({ orderId, otherUserId }: Props) => {
  const { user } = useAuth();
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // إنشاء/جلب الـ thread
  useEffect(() => {
    if (!user || !otherUserId) return;
    (async () => {
      const { data: existing } = await supabase
        .from("chat_threads")
        .select("id, participants")
        .eq("order_id", orderId)
        .maybeSingle();
      if (existing) {
        setThreadId(existing.id);
      } else {
        const { data: created } = await supabase
          .from("chat_threads")
          .insert({ order_id: orderId, participants: [user.id, otherUserId] })
          .select("id")
          .single();
        if (created) setThreadId(created.id);
      }
    })();
  }, [user, otherUserId, orderId]);

  // تحميل + realtime
  useEffect(() => {
    if (!threadId) return;
    const load = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at");
      const decoded: Msg[] = await Promise.all(
        (data ?? []).map(async (m: any) => ({
          id: m.id,
          sender_id: m.sender_id,
          text: await decryptMessage(threadId, m.ciphertext, m.iv ?? ""),
          created_at: m.created_at,
        })),
      );
      setMessages(decoded);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    };
    load();
    const ch = supabase
      .channel(`chat-${threadId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `thread_id=eq.${threadId}` },
        () => load(),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [threadId]);

  const send = async () => {
    if (!threadId || !user || !input.trim()) return;
    setSending(true);
    const { ciphertext, iv } = await encryptMessage(threadId, input.trim());
    await supabase.from("chat_messages").insert({
      thread_id: threadId,
      sender_id: user.id,
      ciphertext,
      iv,
    });
    setInput("");
    setSending(false);
  };

  return (
    <div className="glass rounded-2xl overflow-hidden flex flex-col" style={{ height: 420 }}>
      <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2 bg-primary/5">
        <Lock className="h-4 w-4 text-accent" />
        <span className="text-sm font-bold">محادثة مشفرة (AES-256)</span>
        <span className="text-[10px] text-muted-foreground ms-auto font-cyber">END-TO-END</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-xs py-10">ابدأ المحادثة الآمنة الآن</div>
        )}
        <AnimatePresence>
          {messages.map((m) => {
            const mine = m.sender_id === user?.id;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${mine ? "justify-start" : "justify-end"}`}
              >
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  mine ? "bg-primary text-primary-foreground rounded-bl-sm" : "bg-secondary rounded-br-sm"
                }`}>
                  <div>{m.text}</div>
                  <div className="text-[9px] opacity-60 mt-1 font-cyber">{formatDate(m.created_at)}</div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={endRef} />
      </div>
      <div className="p-3 border-t border-border/50 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="رسالة آمنة..."
          disabled={!threadId || sending}
        />
        <Button onClick={send} disabled={!input.trim() || sending} variant="hero" size="icon">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default EncryptedChat;
