import { useEffect } from "react";

import { registerPushToken } from "@/lib/push.functions";

type PushPlugin = {
  requestPermissions: () => Promise<{ receive: string }>;
  register: () => Promise<void>;
  addListener: (event: string, handler: (payload: any) => void) => Promise<unknown> | unknown;
};

/**
 * يسجّل رمز الجهاز لإشعارات خارج التطبيق (Android عبر Capacitor).
 * على الويب لا يفعل شيئًا — لا يوجد Plugin.
 */
export function usePushRegistration(enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const capacitor = (window as any).Capacitor;
    const plugin: PushPlugin | undefined = capacitor?.Plugins?.PushNotifications;
    if (!plugin || !capacitor?.isNativePlatform?.()) return;

    let cancelled = false;
    void (async () => {
      try {
        const permission = await plugin.requestPermissions();
        if (permission.receive !== "granted" || cancelled) return;
        await plugin.addListener("registration", (token: { value: string }) => {
          if (!token?.value) return;
          void registerPushToken({
            data: { token: token.value, platform: capacitor.getPlatform?.() === "ios" ? "ios" : "android" },
          }).catch(() => undefined);
        });
        await plugin.register();
      } catch {
        /* الإشعارات غير متاحة على هذا الجهاز */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);
}
