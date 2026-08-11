import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Wand2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  onGenerated: (data: any) => void;
}

const AIListingDialog = ({ open, onClose, onGenerated }: Props) => {
  const [hint, setHint] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);

  const generate = async () => {
    if (hint.trim().length < 5) return toast.error("اكتب وصفاً مختصراً للمنتج (5 أحرف على الأقل)");
    setLoading(true);
    setPreview(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-listing", {
        body: { hint, category },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPreview(data);
      toast.success("✨ المارد ولّد بطاقة منتج كاملة!");
    } catch (e: any) {
      toast.error(e.message || "تعذّر التوليد");
    } finally {
      setLoading(false);
    }
  };

  const accept = () => {
    if (!preview) return;
    onGenerated(preview);
    setPreview(null);
    setHint("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl glass border-accent/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Wand2 className="h-5 w-5 text-accent animate-pulse" />
            🪄 المارد يولّد لك بطاقة المنتج
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">صف منتجك بكلمات بسيطة</label>
            <Textarea
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="مثال: عسل سد€مني أصلي من حضرموت 1 كيلو..."
              rows={3}
              className="resize-none"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">الفئة (اختياري)</label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="أغذية، إلكترونيات، ملابس..." />
          </div>

          <Button onClick={generate} disabled={loading} variant="gold" className="w-full">
            {loading ? <Loader2 className="h-4 w-4 ms-2 animate-spin" /> : <Sparkles className="h-4 w-4 ms-2" />}
            {loading ? "المارد يفكر..." : "ولّد البطاقة بقوة المارد"}
          </Button>

          {preview && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-accent/40 bg-gradient-mystic/10 p-4 space-y-3"
            >
              <div>
                <div className="text-[10px] font-cyber text-accent tracking-widest mb-1">الاسم المقترح</div>
                <div className="font-bold">{preview.name}</div>
              </div>
              <div>
                <div className="text-[10px] font-cyber text-accent tracking-widest mb-1">الوصف</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{preview.description}</p>
              </div>
              <div className="flex gap-4 flex-wrap text-xs">
                <span>💰 السعر: <b className="text-primary">{preview.suggested_price_yer?.toLocaleString()} €</b></span>
                <span>📦 المخزون: <b className="text-accent">{preview.stock_recommendation}</b></span>
              </div>
              {preview.tags?.length && (
                <div className="flex flex-wrap gap-1.5">
                  {preview.tags.map((t: string, i: number) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary">{t}</span>
                  ))}
                </div>
              )}
              <Button onClick={accept} variant="hero" className="w-full">✓ اعتماد ونشر</Button>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIListingDialog;
