// بصمة الجهاز + Anti-bot متطور مع حماية تدفق البيانات
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const computeFingerprint = async (): Promise<string> => {
  const data = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency ?? 0,
    (navigator as any).deviceMemory ?? 0,
  ].join("|");
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

const detectBot = (): boolean => {
  if (navigator.webdriver) return true;
  if (/HeadlessChrome|PhantomJS|bot|crawl|slurp|spider/i.test(navigator.userAgent)) return true;
  if ((window as any).callPhantom || (window as any)._phantom) return true;
  return false;
};

export const useFraudShield = () => {
  const { user } = useAuth();
  const hasExecuted = useRef(false);

  useEffect(() => {
    if (!user || hasExecuted.current) return;

    // منع التكرار اللحظي في الذاكرة الحية وقفل الجلسة عبر المتصفح
    const sessionLockKey = `nx_frd_chk_${user.id}`;
    if (sessionStorage.getItem(sessionLockKey)) {
      hasExecuted.current = true;
      return;
    }

    hasExecuted.current = true;
    sessionStorage.setItem(sessionLockKey, "locked");

    (async () => {
      try {
        const fp = await computeFingerprint();
        const isBot = detectBot();

        const { data: existing } = await supabase
          .from("device_sessions")
          .select("id, trusted")
          .eq("user_id", user.id)
          .eq("device_fingerprint", fp)
          .maybeSingle();

        if (existing) {
          await supabase.from("device_sessions")
            .update({ last_seen_at: new Date().toISOString() })
            .eq("id", existing.id);
        } else {
          await supabase.from("device_sessions").insert({
            user_id: user.id,
            device_fingerprint: fp,
            user_agent: navigator.userAgent.slice(0, 255),
          });

          await supabase.from("fraud_signals").insert({
            user_id: user.id,
            kind: "new_device",
            severity: "low",
            details: { ua: navigator.userAgent.slice(0, 200) },
          });
        }

        if (isBot) {
          await supabase.from("fraud_signals").insert({
            user_id: user.id,
            kind: "bot_detected",
            severity: "high",
            details: { ua: navigator.userAgent.slice(0, 200) },
          });
        }
      } catch (error) {
        console.error("FraudShield Core Engine Error:", error);
        sessionStorage.removeItem(sessionLockKey); // تحرير القفل في حالة الفشل الحرج لإعادة المحاولة لاحقاً
      }
    })();
  }, [user]);
};
