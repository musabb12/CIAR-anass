import { supabase } from "@/integrations/supabase/client";

export interface EvidenceFile {
  url: string;
  kind: string;
  name: string;
  size: number;
}

export const uploadEvidence = async (userId: string, file: File): Promise<EvidenceFile> => {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("support-evidence").upload(path, file, {
    cacheControl: "3600", upsert: false, contentType: file.type,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("support-evidence").getPublicUrl(path);
  return { url: data.publicUrl, kind: file.type, name: file.name, size: file.size };
};
