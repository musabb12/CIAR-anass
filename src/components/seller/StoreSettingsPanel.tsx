import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import ImageUploader from "@/components/common/ImageUploader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Loader2, Settings as SettingsIcon } from "lucide-react";

interface Props {
  storeId: string;
}

const StoreSettingsPanel = ({ storeId }: Props) => {
  const [s, setS] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("store_settings").select("*").eq("store_id", storeId).maybeSingle();
    if (data) setS(data);
    else {
      const { data: created } = await supabase.from("store_settings").insert({ store_id: storeId }).select().single();
      setS(created);
    }
    setLoading(false);
  };
  useEffect(() => { if (storeId) load(); }, [storeId]);

  const set = (k: string, v: any) => setS((p: any) => ({ ...p, [k]: v }));
  const setSocial = (k: string, v: any) => setS((p: any) => ({ ...p, social_links: { ...(p.social_links ?? {}), [k]: v } }));

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("store_settings").update({
      primary_color: s.primary_color, accent_color: s.accent_color,
      background_url: s.background_url, layout: s.layout, currency: s.currency,
      shipping_policy: s.shipping_policy, return_policy: s.return_policy, privacy_policy: s.privacy_policy,
      social_links: s.social_links ?? {}, business_hours: s.business_hours ?? {},
      payment_methods: s.payment_methods ?? [], whatsapp: s.whatsapp, telegram: s.telegram,
      email: s.email, location_lat: s.location_lat, location_lng: s.location_lng,
      location_address: s.location_address, accepts_jobs: s.accepts_jobs,
    }).eq("store_id", storeId);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("تم حفظ الإعدادات ✨");
  };

  if (loading || !s) return <div className="py-12 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline" /></div>;

  return (
    <div className="space-y-6">
      <div className="glass rounded-xl p-5 space-y-3">
        <h3 className="font-bold flex items-center gap-2"><SettingsIcon className="h-4 w-4 text-primary" /> الشكل والألوان</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>اللون ال€سي</Label>
            <div className="flex gap-2"><input type="color" value={s.primary_color} onChange={(e) => set("primary_color", e.target.value)} className="h-10 w-16 rounded border" />
              <Input value={s.primary_color} onChange={(e) => set("primary_color", e.target.value)} /></div>
          </div>
          <div>
            <Label>لون التمييز (ذهبي)</Label>
            <div className="flex gap-2"><input type="color" value={s.accent_color} onChange={(e) => set("accent_color", e.target.value)} className="h-10 w-16 rounded border" />
              <Input value={s.accent_color} onChange={(e) => set("accent_color", e.target.value)} /></div>
          </div>
        </div>
        <div>
          <Label>الخلفية / Background</Label>
          <ImageUploader value={s.background_url ? [s.background_url] : []} onChange={(u) => set("background_url", u[0] ?? "")} max={1} folder="store/bg" />
        </div>
      </div>

      <div className="glass rounded-xl p-5 space-y-3">
        <h3 className="font-bold">📞 طرق التواصل</h3>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>واتساب</Label><Input value={s.whatsapp ?? ""} onChange={(e) => set("whatsapp", e.target.value)} placeholder="+9677..." /></div>
          <div><Label>تيليجرام</Label><Input value={s.telegram ?? ""} onChange={(e) => set("telegram", e.target.value)} /></div>
          <div className="col-span-2"><Label>البريد الإلكتروني</Label><Input value={s.email ?? ""} onChange={(e) => set("email", e.target.value)} /></div>
        </div>
      </div>

      <div className="glass rounded-xl p-5 space-y-3">
        <h3 className="font-bold">🌐 روابط التواصل الاجتماعي</h3>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Instagram</Label><Input value={s.social_links?.instagram ?? ""} onChange={(e) => setSocial("instagram", e.target.value)} /></div>
          <div><Label>Facebook</Label><Input value={s.social_links?.facebook ?? ""} onChange={(e) => setSocial("facebook", e.target.value)} /></div>
          <div><Label>TikTok</Label><Input value={s.social_links?.tiktok ?? ""} onChange={(e) => setSocial("tiktok", e.target.value)} /></div>
          <div><Label>Twitter / X</Label><Input value={s.social_links?.twitter ?? ""} onChange={(e) => setSocial("twitter", e.target.value)} /></div>
        </div>
      </div>

      <div className="glass rounded-xl p-5 space-y-3">
        <h3 className="font-bold">📍 الموقع</h3>
        <div><Label>العنوان</Label><Input value={s.location_address ?? ""} onChange={(e) => set("location_address", e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>خط العرض (lat)</Label><Input type="number" step="any" value={s.location_lat ?? ""} onChange={(e) => set("location_lat", e.target.value ? Number(e.target.value) : null)} /></div>
          <div><Label>خط الطول (lng)</Label><Input type="number" step="any" value={s.location_lng ?? ""} onChange={(e) => set("location_lng", e.target.value ? Number(e.target.value) : null)} /></div>
        </div>
      </div>

      <div className="glass rounded-xl p-5 space-y-3">
        <h3 className="font-bold">📜 السياسات</h3>
        <div><Label>سياسة الشحن</Label><Textarea rows={2} value={s.shipping_policy ?? ""} onChange={(e) => set("shipping_policy", e.target.value)} /></div>
        <div><Label>سياسة الإرجاع</Label><Textarea rows={2} value={s.return_policy ?? ""} onChange={(e) => set("return_policy", e.target.value)} /></div>
        <div><Label>سياسة الخصوصية</Label><Textarea rows={2} value={s.privacy_policy ?? ""} onChange={(e) => set("privacy_policy", e.target.value)} /></div>
      </div>

      <div className="glass rounded-xl p-5 flex items-center justify-between">
        <div>
          <h3 className="font-bold">💼 قبول طلبات التوظيف</h3>
          <p className="text-xs text-muted-foreground">السماح للباحثين عن عمل بالتقديم على متجرك</p>
        </div>
        <Switch checked={s.accepts_jobs ?? false} onCheckedChange={(v) => set("accepts_jobs", v)} />
      </div>

      <Button variant="gold" onClick={save} disabled={saving} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin ms-1" /> : <Save className="h-4 w-4 ms-1" />}
        حفظ الإعدادات
      </Button>
    </div>
  );
};

export default StoreSettingsPanel;
