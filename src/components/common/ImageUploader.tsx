import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, ImagePlus } from "lucide-react";
import { toast } from "sonner";

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  folder?: string; // e.g. "products" | "store" | "promos"
}

const ImageUploader = ({ value, onChange, max = 6, folder = "products" }: Props) => {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  const upload = async (files: FileList | null) => {
    if (!files || !user) return;
    if (value.length + files.length > max) {
      toast.error(`الحد الأقصى ${max} صور`);
      return;
    }
    setBusy(true);
    const urls: string[] = [];
    try {
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name}: الحجم أكبر من 5MB`);
          continue;
        }
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("store-media").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (error) {
          toast.error("فشل الرفع: " + error.message);
          continue;
        }
        const { data } = supabase.storage.from("store-media").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
      onChange([...value, ...urls]);
      if (urls.length) toast.success(`تم رفع ${urls.length} صورة ✨`);
    } finally {
      setBusy(false);
    }
  };

  const remove = (idx: number) => {
    const next = [...value];
    next.splice(idx, 1);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {value.map((url, i) => (
          <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-border/60">
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-1 end-1 h-6 w-6 rounded-full bg-destructive/90 text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
            >
              <X className="h-3 w-3" />
            </button>
            {i === 0 && (
              <div className="absolute bottom-0 inset-x-0 bg-primary/90 text-primary-foreground text-[10px] text-center py-0.5">€سية</div>
            )}
          </div>
        ))}
        {value.length < max && (
          <label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary cursor-pointer flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition bg-secondary/20">
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
            <span className="text-[10px]">{busy ? "..." : "إضافة"}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={busy}
              onChange={(e) => upload(e.target.files)}
            />
          </label>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground">
        {value.length}/{max} • PNG/JPG • أقصى 5MB لكل صورة • أول صورة هي ال€سية
      </p>
    </div>
  );
};

export default ImageUploader;
