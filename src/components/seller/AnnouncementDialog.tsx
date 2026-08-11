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
import { Megaphone, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  storeId: string;
  ann?: any | null;
  onSaved: () => void;
}

const AnnouncementDialog = ({ open, onClose, storeId, ann, onSaved }: Props) => {
  const [form, setForm] = useState<any>({ title: "", content: "", image_url: "", priority: 0, is_active: true });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (ann) setForm(ann);
    else setForm({ title: "", content: "", image_url: "", priority: 0, is_active: true });
  }, [ann, open]);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const save = async () => {
    if (!form.title.trim()) { toast.error("العنوان مطلوب"); return; }
    setSaving(true);
    const payload = {
      store_id: storeId, title: form.title, content: form.content || null,
      image_url: form.image_url || null, priority: Number(form.priority) || 0, is_active: form.is_active,
    };
    const res = ann?.id ? await supabase.from("store_announcements").update(payload).eq("id", ann.id)
                       : await supabase.from("store_announcements").insert(payload);
    setSaving(false);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success("تم الحفظ ✨"); onSaved(); onClose();
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5 text-primary" /> إعلان</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>العنوان *</Label><Input value={form.title} onChange={(e) => set("title", e.target.value)} /></div>
          <div><Label>المحتوى</Label><Textarea rows={3} value={form.content} onChange={(e) => set("content", e.target.value)} /></div>
          <div><Label>صورة</Label>
            <ImageUploader value={form.image_url ? [form.image_url] : []} onChange={(u) => set("image_url", u[0] ?? "")} max={1} folder="announcements" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>الأولوية</Label><Input type="number" value={form.priority} onChange={(e) => set("priority", e.target.value)} /></div>
            <div className="flex items-center justify-between pt-6"><Label>نشط</Label><Switch checked={form.is_active} onCheckedChange={(v) => set("is_active", v)} /></div>
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
export default AnnouncementDialog;
