import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

/**
 * جسر الإشعارات: يدمج Push للموبايل (Capacitor) + Realtime للويب
 * - على الويب: يستخدم Supabase Realtime على جدول notifications + Web Notifications API
 * - على الموبايل (Capacitor): يطلب صلاحية Push ويسجل التوكن
 */
export const useNotificationsBridge = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // === Web Notifications ===
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    // === Realtime على notifications ===
    const ch = supabase
      .channel(`notif-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n: any = payload.new;
          // Toast سينمائي
          toast(n.title, {
            description: n.message,
            action: n.link ? { label: "عرض", onClick: () => (window.location.href = n.link) } : undefined,
          });
          // Web notification
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            try {
              new Notification(n.title, { body: n.message, icon: "/placeholder.svg", tag: n.id });
            } catch {}
          }
          // Vibrate
          if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
        },
      )
      .subscribe();

    // === Capacitor Push (موبايل فقط) ===
    if (Capacitor.isNativePlatform()) {
      (async () => {
        try {
          const { PushNotifications } = await import("@capacitor/push-notifications");
          const perm = await PushNotifications.requestPermissions();
          if (perm.receive === "granted") {
            await PushNotifications.register();
            PushNotifications.addListener("registration", async (token) => {
              await supabase
                .from("device_tokens" as any)
                .upsert({ user_id: user.id, token: token.value, platform: Capacitor.getPlatform() });
            });
            PushNotifications.addListener("pushNotificationReceived", (n) => {
              toast(n.title || "إشعار", { description: n.body });
            });
          }
        } catch {
          /* الإضافة قد لا تكون مهيأة */
        }
      })();
    }

    return () => {
      supabase.removeChannel(ch);
    };
  }, [user]);
};

export default useNotificationsBridge;
