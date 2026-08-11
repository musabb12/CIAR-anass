import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface HeroMediaItem {
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

export const useHeroMedia = () => {
  const [items, setItems] = useState<HeroMediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("hero_media" as any)
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    setItems((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("hero_media_live")
      .on("postgres_changes", { event: "*", schema: "public", table: "hero_media" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return { items, loading };
};
