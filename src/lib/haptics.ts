import { Capacitor } from "@capacitor/core";

/** تأثيرات لمس متناسقة بين الويب والموبايل */
export const haptic = async (style: "light" | "medium" | "heavy" | "success" | "warning" = "light") => {
  // ويب: vibrate
  if (!Capacitor.isNativePlatform()) {
    if (navigator.vibrate) {
      const map = { light: 20, medium: 40, heavy: 70, success: [30, 30, 60], warning: [60, 30, 60, 30, 60] };
      navigator.vibrate(map[style] as any);
    }
    return;
  }
  // موبايل: Capacitor Haptics
  try {
    const { Haptics, ImpactStyle, NotificationType } = await import("@capacitor/haptics");
    if (style === "success") return Haptics.notification({ type: NotificationType.Success });
    if (style === "warning") return Haptics.notification({ type: NotificationType.Warning });
    const impact =
      style === "heavy" ? ImpactStyle.Heavy : style === "medium" ? ImpactStyle.Medium : ImpactStyle.Light;
    return Haptics.impact({ style: impact });
  } catch {
    /* noop */
  }
};
