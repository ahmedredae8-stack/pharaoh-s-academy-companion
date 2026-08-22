import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Flame, Gem, Home, Trophy, User } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";

import { useAccount } from "@/components/account/AccountProvider";

const NAV = [
  { to: "/", label: "الرئيسية", icon: Home },
  { to: "/courses", label: "كورسات", icon: BookOpen },
  { to: "/leaderboard", label: "المتصدرون", icon: Trophy },
  { to: "/profile", label: "ملفي", icon: User },
] as const;

export function DuoLayout({
  children,
  stats,
}: {
  children: ReactNode;
  stats?: { xp?: number; streak?: number; hearts?: number };
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isPro } = useAccount();

  useEffect(() => {
    document.documentElement.lang = "ar";
    document.documentElement.dir = "rtl";
  }, []);

  return (
    <div dir="rtl" className="duo-screen pb-24">
      <header className="sticky top-0 z-40 border-b-2 border-duo-line bg-duo-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src="/mascot.png" alt="تميمة فرعون Ai" className="h-9 w-9 object-contain" />
            <span className="text-lg font-black text-duo-green">فرعون Ai</span>
          </Link>
          <div className="flex items-center gap-3 text-sm font-black">
            <span className="flex items-center gap-1 text-duo-red">
              <Flame className="h-5 w-5" /> {stats?.streak ?? 0}
            </span>
            <span className="flex items-center gap-1 text-duo-blue">
              <Gem className="h-5 w-5" /> {stats?.xp ?? 0}
            </span>
            {isPro ? (
              <span className="rounded-full bg-duo-surface-2 px-2 py-0.5 text-xs text-duo-green">
                PRO
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-5">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-duo-line bg-duo-surface shadow-[0_-8px_24px_-20px_rgba(60,42,0,0.6)]">
        <div className="mx-auto flex max-w-3xl items-stretch justify-around">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-1 flex-col items-center gap-1 px-2 py-3 text-[11px] font-bold ${
                  active ? "text-duo-green" : "text-duo-muted"
                }`}
              >
                <span
                  className={`rounded-xl px-4 py-1 ${active ? "bg-duo-surface-2" : ""}`}
                >
                  <Icon className="h-6 w-6" />
                </span>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
