import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Trash2, Upload, Image as ImageIcon, Video, MoveUp, MoveDown, Eye, EyeOff } from "lucide-react";

interface HeroItem {
  id: string;
  media_type: "image" | "video";
  url: string;
  poster_url: string | null;
  title: string | null;
  subtitle: string | null;
  badge_text: string | null;
  cta_text: string | null;
  cta_url: string | null;
  text_align: string;
  text_color: string;
  sort_order: number;
  is_active: boolean;
  overlay_opacity: number;
  duration_ms: number;
  effect: string;
}

const HeroMediaManager = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<HeroItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");

  const load = async () => {
    const { data } = await supabase.from("hero_media" as any).select("*").order("sort_order", { ascending: true });
    setItems((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const upload = async (file: File) => {
    if (!user) return toast.error("سجّل الدخول أولاً");
    if (file.size > 50 * 1024 * 1024) return toast.error("الحجم أكبر من 50MB");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/hero/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("store-media").upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("store-media").getPublicUrl(path);
      const type: "image" | "video" = file.type.startsWith("video") ? "video" : "image";
      const max = items.reduce((m, x) => Math.max(m, x.sort_order), 0);
      const { error } = await supabase.from("hero_media" as any).insert({
        media_type: type, url: pub.publicUrl, title: title || null, subtitle: subtitle || null,
        sort_order: max + 1, is_active: true, overlay_opacity: 0.55, duration_ms: type === "video" ? 0 : 3000, effect: "kenburns",
      } as any);
      if (error) throw error;
      toast.success("تمت إضافة الخلفية ✨");
      setTitle(""); setSubtitle("");
      load();
    } catch (e: any) {
      const message = e.message?.includes("row-level security")
        ? "لا تملك صلاحية رفع الخلفيات. تأكد من تسجيل الدخول كمشرف."
        : e.message || "فشل الرفع";
      toast.error(message);
    } finally { setUploading(false); }
  };

  const patch = async (id: string, fields: Partial<HeroItem>) => {
    const { error } = await supabase.from("hero_media" as any).update(fields as any).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("حذف هذه الخلفية؟")) return;
    const { error } = await supabase.from("hero_media" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف");
    load();
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const other = items[idx + dir];
    if (!other) return;
    const a = items[idx];
    await patch(a.id, { sort_order: other.sort_order });
    await patch(other.id, { sort_order: a.sort_order });
  };

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-lg flex items-center gap-2"><Upload className="h-5 w-5 text-primary" /> إضافة خلفية متحركة جديدة</h3>
        <p className="text-sm text-muted-foreground">ارفع صوراً عالية الجودة أو فيديوهات قصيرة (MP4/WebM). تظهر متعاقبة كخلفية متحركة في الواجهة الرئيسية مع تأثير Ken Burns احترافي مثل المواقع العالمية.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>عنوان (اختياري)</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً: عروض الموسم" />
          </div>
          <div>
            <Label>نص فرعي (اختياري)</Label>
            <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="وصف قصير" />
          </div>
        </div>
        <label className="block">
          <div className="cursor-pointer flex items-center justify-center gap-2 h-32 rounded-xl border-2 border-dashed border-primary/40 bg-secondary/30 hover:border-primary transition">
            {uploading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <>
              <Upload className="h-6 w-6 text-primary" />
              <span className="text-sm">انقر لاختيار صورة أو فيديو (حتى 50MB)</span>
            </>}
          </div>
          <input type="file" accept="image/*,video/*" className="hidden" disabled={uploading}
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        </label>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-lg">الخلفيات الحالية ({items.length})</h3>
        {loading ? <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div> :
         items.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">لا توجد خلفيات. ارفع أول صورة لتظهر فوراً في الواجهة الرئيسية.</p> :
         items.map((it, idx) => (
          <div key={it.id} className="glass rounded-xl p-3 flex flex-col sm:flex-row gap-3 items-start">
            <div className="relative w-full sm:w-48 aspect-video rounded-lg overflow-hidden bg-black flex-shrink-0">
              {it.media_type === "video" ? (
                <video src={it.url} className="h-full w-full object-cover" muted playsInline />
              ) : (
                <img src={it.url} alt="" className="h-full w-full object-cover" />
              )}
              <div className="absolute top-1 start-1 text-[10px] px-2 py-0.5 rounded-full bg-black/60 text-white flex items-center gap-1">
                {it.media_type === "video" ? <Video className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                {it.media_type === "video" ? "فيديو" : "صورة"}
              </div>
            </div>
            <div className="flex-1 w-full space-y-2">
              <div className="grid sm:grid-cols-2 gap-2">
                <Input value={it.title || ""} onChange={(e) => patch(it.id, { title: e.target.value })} placeholder="🎯 العنوان الرئيسي فوق الصورة" className="text-sm" />
                <Input value={it.subtitle || ""} onChange={(e) => patch(it.id, { subtitle: e.target.value })} placeholder="نص فرعي / وصف" className="text-sm" />
                <Input value={it.badge_text || ""} onChange={(e) => patch(it.id, { badge_text: e.target.value })} placeholder="🏷️ شارة (عرض حصري…)" className="text-sm" />
                <Input value={it.cta_text || ""} onChange={(e) => patch(it.id, { cta_text: e.target.value })} placeholder="نص زر الإعلان (تسوّق الآن)" className="text-sm" />
                <Input value={it.cta_url || ""} onChange={(e) => patch(it.id, { cta_url: e.target.value })} placeholder="رابط الزر (/shop أو https://…)" className="text-sm sm:col-span-2" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <div>
                  <Label className="text-[10px]">تأثير</Label>
                  <Select value={it.effect} onValueChange={(v) => patch(it.id, { effect: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kenburns">Ken Burns</SelectItem>
                      <SelectItem value="fade">تلاشي</SelectItem>
                      <SelectItem value="zoom">تكبير</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px]">محاذاة</Label>
                  <Select value={it.text_align || "center"} onValueChange={(v) => patch(it.id, { text_align: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="center">وسط</SelectItem>
                      <SelectItem value="start">يمين</SelectItem>
                      <SelectItem value="end">يسار</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px]">مدة (ث)</Label>
                  <Input type="number" min={3} value={Math.round(it.duration_ms / 1000)} onChange={(e) => patch(it.id, { duration_ms: Number(e.target.value) * 1000 })} className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-[10px]">عتمة ({Math.round(it.overlay_opacity * 100)}%)</Label>
                  <Input type="range" min={0} max={1} step={0.05} value={it.overlay_opacity} onChange={(e) => patch(it.id, { overlay_opacity: Number(e.target.value) })} className="h-8" />
                </div>
                <div>
                  <Label className="text-[10px]">لون النص</Label>
                  <Input type="color" value={it.text_color || "#FFFFFF"} onChange={(e) => patch(it.id, { text_color: e.target.value })} className="h-8 p-1" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex items-center gap-2">
                  <Switch checked={it.is_active} onCheckedChange={(v) => patch(it.id, { is_active: v })} />
                  <span className="text-xs">{it.is_active ? <span className="text-green-400 flex items-center gap-1"><Eye className="h-3 w-3" /> مفعّل</span> : <span className="text-muted-foreground flex items-center gap-1"><EyeOff className="h-3 w-3" /> معطّل</span>}</span>
                </div>
                <Button size="sm" variant="outline" onClick={() => move(idx, -1)} disabled={idx === 0}><MoveUp className="h-3 w-3" /></Button>
                <Button size="sm" variant="outline" onClick={() => move(idx, 1)} disabled={idx === items.length - 1}><MoveDown className="h-3 w-3" /></Button>
                <Button size="sm" variant="destructive" onClick={() => remove(it.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeroMediaManager;
