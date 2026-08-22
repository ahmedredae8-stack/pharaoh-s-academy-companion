import { Check, Crown, Lock, Star, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { useAccount } from "@/components/account/AccountProvider";
import "@/legacy/legacy.css";
import { APP_HTML } from "@/legacy/markup";
import { PATH_LABELS, type PathId } from "@/lib/products";

import { unlockedIndex, type LegacyPath, type LegacyProgress } from "./legacy-engine";

const PATH_ORDER: PathId[] = ["beginner", "intermediate", "upperIntermediate", "advanced"];

const UNIT_COLOR: Record<PathId, string> = {
  beginner: "#ffc800",
  intermediate: "#ffb020",
  upperIntermediate: "#f59e0b",
  advanced: "#e08700",
};

const OFFSETS = [0, 46, 72, 46, 0, -46, -72, -46];

export function LessonMap({
  onStatsChange,
}: {
  onStatsChange?: (stats: { xp: number; done: number }) => void;
}) {
  const { pathUnlocked } = useAccount();
  const [ready, setReady] = useState(false);
  const [paths, setPaths] = useState<Record<string, LegacyPath>>({});
  const [progress, setProgress] = useState<LegacyProgress>({});
  const [active, setActive] = useState(false);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const sync = useCallback(() => {
    const api = window.__pharaohApi;
    if (!api) return;
    setPaths(api.getPaths());
    setProgress(api.getProgress());
    setReady(true);
  }, []);

  useEffect(() => {
    window.__pharaohDuo = true;
    document.body.classList.add("antialiased");

    const onReady = () => sync();
    const onExit = () => {
      setActive(false);
      sync();
    };
    window.addEventListener("pharaoh:ready", onReady);
    window.addEventListener("pharaoh:exit", onExit);

    let cancelled = false;
    void (async () => {
      // Inject the legacy markup once, imperatively: React must never re-render
      // this subtree or the engine loses its DOM references mid-lesson.
      if (hostRef.current && hostRef.current.childElementCount === 0) {
        hostRef.current.innerHTML = APP_HTML;
      }
      const { bootPharaoh } = await import("@/legacy/engine");
      if (cancelled) return;
      bootPharaoh();
      if (window.__pharaohApi) sync();
    })();

    return () => {
      cancelled = true;
      window.removeEventListener("pharaoh:ready", onReady);
      window.removeEventListener("pharaoh:exit", onExit);
    };
  }, [sync]);

  const totals = useMemo(() => {
    let done = 0;
    for (const pathId of PATH_ORDER) {
      const count = paths[pathId]?.lessons.length ?? 0;
      const unlocked = unlockedIndex(progress, pathId);
      done += Math.max(0, Math.min(unlocked, count));
    }
    return { done, xp: done * 20 };
  }, [paths, progress]);

  useEffect(() => {
    onStatsChange?.(totals);
  }, [totals, onStatsChange]);

  function openLesson(pathId: PathId, index: number, locked: boolean) {
    if (!pathUnlocked(pathId)) {
      window.__pharaohBridge?.openPaywall?.(pathId);
      return;
    }
    if (locked) {
      toast.info("أكمل الدرس السابق أولًا لفتح هذه المهمة");
      return;
    }
    setActive(true);
    // The legacy markup ships with its loading screen active; make sure it never blocks the lesson.
    document.getElementById("loading-screen")?.classList.remove("active");
    requestAnimationFrame(() => {
      document.getElementById("loading-screen")?.classList.remove("active");
      window.__pharaohApi?.open(pathId, index);
    });
  }

  return (
    <>
      <div className="space-y-10">
        <div className="duo-card flex flex-col items-center gap-4 p-5 text-center sm:flex-row sm:text-right">
          <img
            src="/mascot.png"
            alt="تميمة فرعون Ai"
            className="duo-bounce h-20 w-20 shrink-0 object-contain drop-shadow"
          />
          <div className="flex-1 space-y-3">
            <h1 className="text-xl font-black leading-8 text-duo-text sm:text-2xl">
              تعلّم الأمن السيبراني من الصفر
            </h1>
            <p className="text-sm font-bold leading-6 text-duo-muted">
              كل مهمة فيها قصة + محاكاة عملية + اختبار سريع.
            </p>
            <button
              type="button"
              onClick={() => openLesson(PATH_ORDER[0] as PathId, 0, false)}
              className="duo-btn w-full px-6 py-3 text-sm sm:w-auto"
            >
              ابدأ الآن
            </button>
          </div>
        </div>

        {!ready ? (
          <div className="duo-card p-10 text-center text-duo-muted">جارٍ تحميل الخريطة…</div>
        ) : null}

        {PATH_ORDER.map((pathId) => {
          const path = paths[pathId];
          if (!path) return null;
          const purchased = pathUnlocked(pathId);
          const unlocked = Math.max(unlockedIndex(progress, pathId), pathId === "beginner" ? 0 : 0);
          const color = UNIT_COLOR[pathId];
          const total = path.lessons.length;
          const doneCount = Math.max(0, Math.min(unlockedIndex(progress, pathId), total));

          return (
            <section key={pathId}>
              <div
                className="flex items-center justify-between rounded-3xl px-5 py-4"
                style={{
                  background: `linear-gradient(180deg, ${color} 0%, ${color}dd 100%)`,
                  color: "#2a1a00",
                  boxShadow: `0 5px 0 0 rgba(0,0,0,0.12)`,
                }}
              >
                <div>
                  <p className="text-xs font-black opacity-70">{PATH_LABELS[pathId]}</p>
                  <h2 className="text-lg font-black">{path.title}</h2>
                  <p className="mt-1 text-xs font-bold opacity-80">
                    {doneCount} / {total} مهمة مكتملة
                  </p>
                </div>
                {purchased ? (
                  <Crown className="h-8 w-8 opacity-80" />
                ) : (
                  <Lock className="h-7 w-7 opacity-80" />
                )}
              </div>

              <div className="mt-6 flex flex-col items-center gap-5">
                {path.lessons.map((lesson, i) => {
                  const done = i < unlockedIndex(progress, pathId);
                  const current = purchased && i === unlocked;
                  const locked = !purchased || i > unlocked;
                  const offset = OFFSETS[i % OFFSETS.length] ?? 0;

                  return (
                    <div
                      key={lesson.index}
                      className="flex w-full flex-col items-center"
                      style={{ transform: `translateX(${offset}px)` }}
                    >
                      <button
                        onClick={() => openLesson(pathId, i, locked)}
                        aria-label={lesson.title}
                        className="duo-node"
                        style={{
                          background: locked
                            ? "var(--color-duo-surface-2)"
                            : `linear-gradient(180deg, ${color} 0%, ${color}cc 100%)`,
                          color: locked ? "var(--color-duo-muted)" : "#08131f",
                          boxShadow: locked
                            ? "0 5px 0 0 var(--color-duo-line)"
                            : "0 7px 0 0 rgba(160,110,0,0.55)",
                          outline: current ? "4px solid rgba(255,200,0,0.35)" : "none",
                        }}
                      >
                        {locked ? (
                          <Lock className="h-7 w-7" />
                        ) : done ? (
                          <Check className="h-8 w-8" />
                        ) : (
                          <Star className="h-8 w-8" />
                        )}
                      </button>
                      <p
                        className={`mt-2 max-w-[220px] text-center text-xs font-bold ${
                          locked ? "text-duo-muted" : "text-duo-text"
                        }`}
                      >
                        {lesson.title}
                      </p>
                      {current ? (
                        <span className="mt-1 rounded-full bg-duo-green/15 px-3 py-0.5 text-[11px] font-black text-duo-green">
                          ابدأ الآن
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {active ? (
        <button
          onClick={() => {
            setActive(false);
            sync();
          }}
          className="duo-exit-btn"
          aria-label="العودة إلى الخريطة"
        >
          <X className="h-5 w-5" />
        </button>
      ) : null}

      {/* Legacy lesson engine host: dialogues, simulators, quizzes.
          Always mounted, only hidden via CSS, and filled imperatively. */}
      <div
        ref={overlayRef}
        className="duo-legacy fixed inset-0 z-[800] overflow-hidden"
        style={{ display: active ? "block" : "none" }}
      >
        <div ref={hostRef} className="h-full w-full" />
      </div>
    </>
  );
}
