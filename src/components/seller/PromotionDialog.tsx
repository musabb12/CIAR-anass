import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import ImageUploader from "@/components/common/ImageUploader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tag, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  storeId: string;
  promo?: any | null;
  onSaved: () => void;
}

const PromotionDialog = ({ open, onClose, storeId, promo, onSaved }: Props) => {
  const [form, setForm] = useState<any>({
    title: "", description: "", image_url: "", discount_pct: 10,
    starts_at: new Date().toISOString().slice(0, 16),
    ends_at: "", is_active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (promo) setForm({
      ...promo,
      starts_at: promo.starts_at?.slice(0, 16) ?? "",
      ends_at: promo.ends_at?.slice(0, 16) ?? "",
    });
    else setForm({ title: "", description: "", image_url: "", discount_pct: 10, starts_at: new Date().toISOString().slice(0, 16), ends_at: "", is_active: true });
  }, [promo, open]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.title.trim()) { toast.error("عنوان العرض مطلوب"); return; }
    setSaving(true);
    const payload = {
      store_id: storeId,
      title: form.title,
      description: form.description || null,
      image_url: form.image_url || null,
      discount_pct: Number(form.discount_pct) || 0,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : new Date().toISOString(),
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      is_active: form.is_active,
    };
    const res = promo?.id
      ? await supabase.from("store_promotions").update(payload).eq("id", promo.id)
      : await supabase.from("store_promotions").insert(payload);
    setSaving(false);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success("تم الحفظ ✨");
    onSaved(); onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Tag className="h-5 w-5 text-accent" /> {promo?.id ? "تعديل العرض" : "إنشاء عرض جديد"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label>عنوان العرض *</Label><Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="تخفيض €عي 50%" /></div>
          <div><Label>الوصف</Label><Textarea rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
          <div><Label>صورة العرض</Label>
            <ImageUploader value={form.image_url ? [form.image_url] : []} onChange={(u) => set("image_url", u[0] ?? "")} max={1} folder="promos" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>نسبة الخصم %</Label><Input type="number" value={form.discount_pct} onChange={(e) => set("discount_pct", e.target.value)} /></div>
            <div><Label>يبدأ</Label><Input type="datetime-local" value={form.starts_at} onChange={(e) => set("starts_at", e.target.value)} /></div>
            <div><Label>ينتهي</Label><Input type="datetime-local" value={form.ends_at} onChange={(e) => set("ends_at", e.target.value)} /></div>
          </div>
          <div className="flex items-center justify-between">
            <Label>نشط</Label>
            <Switch checked={form.is_active} onCheckedChange={(v) => set("is_active", v)} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button variant="gold" onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin ms-1" />}حفظ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PromotionDialog;
