import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const GREETING = "أهلاً بك في عالمك يا سيدي ✨ لقد حللتُ تفضيلاتك ووفّرت لك أفضل عروض ألمانيا اليوم في مدينتك. هل تود €تها؟";

const GenieAssistant = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [smartDeals, setSmartDeals] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 9e6, behavior: "smooth" }); }, [messages]);

  // Smart Mock: load 3 personalized deals on open
  useEffect(() => {
    if (!open || smartDeals.length) return;
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, price, discount_price, images")
        .not("discount_price", "is", null)
        .order("sales_count", { ascending: false })
        .limit(3);
      setSmartDeals(data || []);
      if (!messages.length) setMessages([{ role: "assistant", content: GREETING }]);
    })();
  }, [open]);

  const askGenie = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: text };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/genie-assistant`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          context: user ? { user_id: user.id } : null,
        }),
      });

      if (resp.status === 429) { toast.error("المارد متعب، حاول بعد قليل"); setLoading(false); return; }
      if (resp.status === 402) { toast.error("نفذت أرصدة المارد"); setLoading(false); return; }
      if (!resp.ok || !resp.body) throw new Error("stream failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";
      setMessages((p) => [...p, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantText += delta;
              setMessages((p) => p.map((m, i) => i === p.length - 1 ? { ...m, content: assistantText } : m));
            }
          } catch { buffer = line + "\n" + buffer; break; }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("تعذّر الوصول للمارد");
    } finally { setLoading(false); }
  };

  return (
    <>
      {/* Floating Genie Button */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 left-6 z-40 h-16 w-16 rounded-full bg-gradient-mystic flex items-center justify-center animate-mystic-pulse"
        aria-label="خادم المارد"
      >
        <Sparkles className="h-7 w-7 text-accent animate-genie-glow" strokeWidth={2} />
        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent animate-ping" />
        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            className="fixed bottom-24 left-6 z-40 w-[calc(100vw-3rem)] sm:w-[420px] max-h-[75vh] glass-gold rounded-2xl shadow-elevated flex flex-col overflow-hidden"
          >
            {/* header */}
            <div className="flex items-center justify-between p-4 border-b border-accent/20 bg-gradient-to-r from-primary/20 to-accent/10">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-gradient-mystic flex items-center justify-center">
                  <Wand2 className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <div className="font-display font-bold text-sm">خادم المارد</div>
                  <div className="text-[10px] text-muted-foreground">مساعدك الذكي ✨</div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}><X className="h-4 w-4" /></Button>
            </div>

            {/* messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-secondary text-foreground"
                      : "bg-gradient-mystic/30 border border-accent/20 text-foreground"
                  }`}>
                    {m.content || <span className="opacity-50">...</span>}
                  </div>
                </div>
              ))}

              {/* Smart Deals (mock from DB) */}
              {smartDeals.length > 0 && messages.length <= 1 && (
                <div className="space-y-2 pt-2">
                  <div className="text-[11px] text-accent font-bold flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> كنوز المارد لك اليوم
                  </div>
                  {smartDeals.map((d) => (
                    <a key={d.id} href={`/product/${d.id}`} className="flex items-center gap-3 p-2 rounded-xl bg-secondary/50 hover:bg-secondary transition border border-border/50">
                      {d.images?.[0] && <img src={d.images[0]} alt={d.name} className="h-10 w-10 rounded-lg object-cover" />}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{d.name}</div>
                        <div className="text-[11px] text-accent font-bold">{d.discount_price} €</div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* input */}
            <div className="p-3 border-t border-accent/20 flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && askGenie(input)}
                placeholder="اسأل المارد..."
                className="bg-background/50 border-accent/20"
                disabled={loading}
              />
              <Button
                onClick={() => askGenie(input)}
                disabled={loading || !input.trim()}
                size="icon"
                className="bg-gradient-mystic hover:opacity-90 shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GenieAssistant;
