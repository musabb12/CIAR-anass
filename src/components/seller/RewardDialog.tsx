import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Gift, Loader2, Wand2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  storeId: string;
  reward?: any | null;
  onSaved: () => void;
}

const RewardDialog = ({ open, onClose, storeId, reward, onSaved }: Props) => {
  const [form, setForm] = useState<any>({
    code: "", reward_type: "percent", value: 10, min_order: 0,
    max_uses: 100, description: "", is_active: true, expires_at: "",
  });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (reward) setForm({ ...reward, expires_at: reward.expires_at?.slice(0, 16) ?? "" });
    else setForm({ code: "", reward_type: "percent", value: 10, min_order: 0, max_uses: 100, description: "", is_active: true, expires_at: "" });
  }, [reward, open]);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const generate = () => set("code", "MARED-" + Math.random().toString(36).slice(2, 8).toUpperCase());
  const save = async () => {
    if (!form.code.trim()) { toast.error("الكود مطلوب"); return; }
    setSaving(true);
    const payload = {
      store_id: storeId, code: form.code.toUpperCase(), reward_type: form.reward_type,
      value: Number(form.value), min_order: Number(form.min_order),
      max_uses: Number(form.max_uses), description: form.description || null,
      is_active: form.is_active,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    };
    const res = reward?.id ? await supabase.from("store_rewards").update(payload).eq("id", reward.id)
                            : await supabase.from("store_rewards").insert(payload);
    setSaving(false);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success("تم الحفظ ✨"); onSaved(); onClose();
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Gift className="h-5 w-5 text-accent" /> جائزة / كوبون</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>كود الكوبون *</Label>
            <div className="flex gap-2">
              <Input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="WELCOME10" />
              <Button type="button" variant="outline" onClick={generate}><Wand2 className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>النوع</Label>
              <Select value={form.reward_type} onValueChange={(v) => set("reward_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">نسبة %</SelectItem>
                  <SelectItem value="fixed">مبلغ ثابت</SelectItem>
                  <SelectItem value="gift">هدية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>القيمة</Label><Input type="number" value={form.value} onChange={(e) => set("value", e.target.value)} /></div>
            <div><Label>أقل طلب (ريال)</Label><Input type="number" value={form.min_order} onChange={(e) => set("min_order", e.target.value)} /></div>
            <div><Label>أقصى استخدامات</Label><Input type="number" value={form.max_uses} onChange={(e) => set("max_uses", e.target.value)} /></div>
            <div className="col-span-2"><Label>تاريخ الانتهاء</Label><Input type="datetime-local" value={form.expires_at} onChange={(e) => set("expires_at", e.target.value)} /></div>
          </div>
          <div><Label>وصف</Label><Textarea rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
          <div className="flex items-center justify-between"><Label>نشط</Label><Switch checked={form.is_active} onCheckedChange={(v) => set("is_active", v)} /></div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button variant="gold" onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin ms-1" />}حفظ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
export default RewardDialog;
