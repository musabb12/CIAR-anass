import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import ImageUploader from "@/components/common/ImageUploader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Store as StoreIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  open: boolean;
  onClose: () => void;
  store?: any | null;
  onSaved: (store: any) => void;
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9\u0600-\u06FF]+/g, "-").replace(/^-|-$/g, "") || `store-${Date.now()}`;

const StoreSetupDialog = ({ open, onClose, store, onSaved }: Props) => {
  const { user } = useAuth();
  const [form, setForm] = useState<any>({
    name: "", slug: "", description: "", city: "", phone: "",
    logo_url: "", cover_url: "", theme_color: "#4B0082", category_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("categories").select("id,name_ar,name,parent_id,icon").order("display_order")
      .then(({ data }) => setCategories(data ?? []));
  }, []);

  useEffect(() => {
    if (store) setForm({ ...form, ...store });
    // eslint-disable-next-line
  }, [store, open]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!user) return;
    if (!form.name.trim()) { toast.error("اسم المتجر مطلوب"); return; }
    if (!form.category_id) { toast.error("اختر فئة المتجر"); return; }
    setSaving(true);
    const payload = {
      owner_id: user.id,
      name: form.name,
      slug: form.slug?.trim() || slugify(form.name),
      description: form.description || null,
      city: form.city || null,
      phone: form.phone || null,
      logo_url: form.logo_url || null,
      cover_url: form.cover_url || null,
      theme_color: form.theme_color,
      category_id: form.category_id,
    };
    const res = store?.id
      ? await supabase.from("stores").update(payload).eq("id", store.id).select().single()
      : await supabase.from("stores").insert(payload).select().single();
    setSaving(false);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success(store?.id ? "تم تحديث المتجر ✨" : "تم إنشاء متجرك 🎉");
    onSaved(res.data);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StoreIcon className="h-5 w-5 text-primary" />
            {store?.id ? "تعديل المتجر" : "إنشاء متجرك"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>صورة الغلاف</Label>
            <ImageUploader value={form.cover_url ? [form.cover_url] : []} onChange={(u) => set("cover_url", u[0] ?? "")} max={1} folder="store/cover" />
          </div>
          <div>
            <Label>الشعار (Logo)</Label>
            <ImageUploader value={form.logo_url ? [form.logo_url] : []} onChange={(u) => set("logo_url", u[0] ?? "")} max={1} folder="store/logo" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><Label>اسم المتجر *</Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
            <div><Label>الرابط (slug)</Label><Input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="my-store" /></div>
          </div>
          <div><Label>وصف المتجر</Label><Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
          <div>
            <Label>فئة المتجر *</Label>
            <Select value={form.category_id || ""} onValueChange={(v) => set("category_id", v)}>
              <SelectTrigger><SelectValue placeholder="اختر فئة (مثال: صيدلية، مطعم، عقارات...)" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {categories.filter(c => !c.parent_id).map(root => (
                  <div key={root.id}>
                    <div className="px-2 py-1 text-xs font-bold text-muted-foreground">{root.name_ar ?? root.name}</div>
                    <SelectItem value={root.id}>— {root.name_ar ?? root.name} (عام)</SelectItem>
                    {categories.filter(c => c.parent_id === root.id).map(child => (
                      <SelectItem key={child.id} value={child.id}>↳ {child.name_ar ?? child.name}</SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>المدينة</Label><Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="ب€ن، ميونخ..." /></div>
            <div><Label>الهاتف</Label><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
          </div>
          <div>
            <Label>اللون ال€سي للمتجر</Label>
            <div className="flex gap-2 items-center">
              <input type="color" value={form.theme_color} onChange={(e) => set("theme_color", e.target.value)} className="h-10 w-16 rounded border" />
              <Input value={form.theme_color} onChange={(e) => set("theme_color", e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>إلغاء</Button>
          <Button variant="gold" onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin ms-1" />}
            {store?.id ? "حفظ" : "إنشاء المتجر"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StoreSetupDialog;
