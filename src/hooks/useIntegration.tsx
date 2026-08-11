import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Integration {
  id: string;
  provider: string;
  category: string;
  display_name: string;
  description: string | null;
  icon: string | null;
  docs_url: string | null;
  public_key: string | null;
  config: Record<string, any>;
  has_secret: boolean;
  secret_name: string | null;
  enabled: boolean;
  status: string;
  last_tested_at: string | null;
  last_error: string | null;
}

const cache: Record<string, Integration | null> = {};
const listeners = new Set<() => void>();

export function useIntegration(provider: string) {
  const [integration, setIntegration] = useState<Integration | null>(cache[provider] ?? null);
  const [loading, setLoading] = useState(!(provider in cache));

  useEffect(() => {
    let cancel = false;
    const load = async () => {
      const { data } = await (supabase as any)
        .from("app_integrations")
        .select("*")
        .eq("provider", provider)
        .eq("enabled", true)
        .maybeSingle();
      if (cancel) return;
      cache[provider] = data ?? null;
      setIntegration(data ?? null);
      setLoading(false);
    };
    load();
    const refresh = () => load();
    listeners.add(refresh);

    // Realtime auto-update when admin enables/changes a key
    const ch = supabase
      .channel(`integration_${provider}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "app_integrations", filter: `provider=eq.${provider}` }, load)
      .subscribe();

    return () => {
      cancel = true;
      listeners.delete(refresh);
      supabase.removeChannel(ch);
    };
  }, [provider]);

  return { integration, loading, enabled: !!integration?.enabled, publicKey: integration?.public_key ?? null, config: integration?.config ?? {} };
}

export function refreshAllIntegrations() {
  Object.keys(cache).forEach(k => delete cache[k]);
  listeners.forEach(l => l());
}
