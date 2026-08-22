import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { saveMyProgress } from "@/lib/account.functions";
import { PATH_PRODUCT, type PathId } from "@/lib/products";

import { useAccount } from "./AccountProvider";
import { Paywall } from "./Paywall";

const LOCAL_STORAGE_KEY = "pharaohAiCyberProgress_v5";

type ProgressPayload = { progress: Record<string, unknown>; lessonSkipCount: number };

declare global {
  interface Window {
    __pharaohBridge?: {
      cloudProgress?: ProgressPayload | null;
      onProgressSave?: (payload: ProgressPayload) => void;
      isPathLocked?: (pathId: string) => boolean;
      openPaywall?: (pathId: string) => void;
    };
    __pharaohReloadProgress?: () => Promise<void>;
  }
}

// Wires the legacy engine to the cloud: progress sync + paywall gating.
export function PharaohShell({ showChrome = false }: { showChrome?: boolean } = {}) {
  const { session, loading, pathUnlocked, isPro, signOut, refresh, account } = useAccount();
  const [paywallPath, setPaywallPath] = useState<PathId | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushProgress = useCallback((payload: ProgressPayload) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveMyProgress({
        data: { data: payload.progress, lessonSkipCount: payload.lessonSkipCount },
      }).catch((error) => console.error("progress sync failed:", error));
    }, 1200);
  }, []);

  // Keep the bridge in sync with auth + entitlement state.
  useEffect(() => {
    window.__pharaohBridge = {
      ...(window.__pharaohBridge ?? {}),
      isPathLocked: (pathId: string) => !pathUnlocked(pathId as PathId),
      openPaywall: (pathId: string) => setPaywallPath(pathId as PathId),
      ...(session ? { onProgressSave: pushProgress } : {}),
    };
  }, [pathUnlocked, pushProgress, session]);

  // Premium paths must stay clickable so the paywall can open.
  useEffect(() => {
    const timer = setTimeout(() => {
      for (const pathId of Object.keys(PATH_PRODUCT) as Array<keyof typeof PATH_PRODUCT>) {
        const button = document.querySelector<HTMLButtonElement>(`[data-path="${pathId}"]`);
        if (!button) continue;
        if (pathUnlocked(pathId)) continue;
        button.disabled = false;
        button.classList.remove("opacity-40", "grayscale");
        const lock = button.querySelector(".lock-icon");
        if (lock) lock.textContent = "مدفوع";
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [pathUnlocked]);

  // First sign-in: migrate local progress up, then hydrate the engine from cloud.
  useEffect(() => {
    if (loading || !session || !account) return;
    void (async () => {
      const cloud = account.progress;
      const localRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
      const local = localRaw ? (JSON.parse(localRaw) as ProgressPayload) : null;

      if (!cloud && local) {
        await saveMyProgress({
          data: { data: local.progress ?? {}, lessonSkipCount: local.lessonSkipCount ?? 0 },
        });
        toast.success("تم رفع تقدّمك المحلي إلى حسابك");
        return;
      }
      if (cloud) {
        const payload: ProgressPayload = {
          progress: (cloud.data ?? {}) as Record<string, unknown>,
          lessonSkipCount: cloud.lesson_skip_count ?? 0,
        };
        window.__pharaohBridge = { ...(window.__pharaohBridge ?? {}), cloudProgress: payload };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
        await window.__pharaohReloadProgress?.();
      }
    })();
  }, [loading, session, account]);

  return (
    <>
      <div hidden={!showChrome} dir="rtl" className="fixed top-3 left-3 z-[900] flex items-center gap-2 text-xs">
        <a
          href="/courses"
          className="rounded-full border border-cyber-gold/40 bg-black/50 px-3 py-1 text-cyber-gold"
        >
          الكورسات
        </a>
        <a
          href="/roadmap"
          className="hidden rounded-full border border-cyber-blue/40 bg-black/50 px-3 py-1 text-cyber-blue sm:inline"
        >
          الخطة
        </a>
        <a
          href="/progress"
          className="rounded-full border border-cyber-blue/40 bg-black/50 px-3 py-1 text-cyber-blue"
        >
          تقدّمي
        </a>
        {isPro ? (
          <span className="rounded-full border border-cyber-gold/50 bg-cyber-gold/10 px-3 py-1 font-bold text-cyber-gold">
            PRO
          </span>
        ) : (
          <button
            onClick={() => setPaywallPath("intermediate")}
            className="rounded-full border border-cyber-gold/40 bg-black/50 px-3 py-1 font-bold text-cyber-gold"
          >
            ترقية
          </button>
        )}
        {session ? (
          <button
            onClick={() => {
              void signOut().then(() => refresh());
            }}
            className="rounded-full border border-cyber-blue/40 bg-black/50 px-3 py-1 text-cyber-blue"
          >
            خروج
          </button>
        ) : (
          <a
            href="/auth"
            className="rounded-full border border-cyber-blue/40 bg-black/50 px-3 py-1 text-cyber-blue"
          >
            تسجيل الدخول
          </a>
        )}
      </div>

      <Paywall
        pathId={paywallPath}
        onClose={() => setPaywallPath(null)}
        onRequireAuth={() => {
          window.location.href = "/auth?redirect=%2F";
        }}
      />
    </>
  );
}