import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { useAccount } from "@/components/account/AccountProvider";
import { computeBadges, computeStreak, toDayKey } from "@/lib/gamification";
import { getMyStats } from "@/lib/stats.functions";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "لوحة تقدّمي | فرعون Ai" },
      {
        name: "description",
        content:
          "تابع سلسلة أيام تعلّمك، شاراتك، نتائج اختباراتك، والمعامل التي أنجزتها في رحلة الأمن السيبراني.",
      },
      { property: "og:title", content: "لوحة تقدّمي في فرعون Ai" },
      {
        property: "og:description",
        content: "سلسلة الأيام، الشارات، ونتائج الاختبارات في مسار الأمن السيبراني.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  const { session, isPro, loading } = useAccount();
  const fetchStats = useServerFn(getMyStats);
  const { data, isPending } = useQuery({
    queryKey: ["my-stats", session?.user.id ?? "anon"],
    queryFn: () => fetchStats(),
    enabled: Boolean(session),
  });

  if (!loading && !session) {
    return (
      <Shell>
        <p className="leading-8 pharaoh-muted">
          سجّل الدخول لتتابع سلسلة أيامك وشاراتك ونتائجك عبر كل أجهزتك.
        </p>
        <a
          href="/auth?redirect=%2Fprogress"
          className="mt-4 inline-block rounded-full bg-cyber-gold px-5 py-2 font-bold text-cyber-dark"
        >
          تسجيل الدخول
        </a>
      </Shell>
    );
  }

  if (isPending || !data) {
    return (
      <Shell>
        <p className="pharaoh-muted">جارٍ تحميل تقدّمك…</p>
      </Shell>
    );
  }

  const days = [...data.labs, ...data.quizzes].map((row) => toDayKey(row.created_at));
  const streak = computeStreak(days);
  const perfect = data.quizzes.filter((q) => q.total > 0 && q.score === q.total).length;
  const avgScore = data.quizzes.length
    ? Math.round(
        (data.quizzes.reduce((sum, q) => sum + (q.total ? q.score / q.total : 0), 0) /
          data.quizzes.length) *
          100,
      )
    : 0;
  const badges = computeBadges({
    labCount: data.labs.length,
    quizCount: data.quizzes.length,
    perfectQuizzes: perfect,
    currentStreak: streak.current,
    longestStreak: streak.longest,
    isPro,
  });

  return (
    <Shell>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="سلسلة حالية" value={`${streak.current} يوم`} />
        <Stat label="أطول سلسلة" value={`${streak.longest} يوم`} />
        <Stat label="معامل مكتملة" value={String(data.labs.length)} />
        <Stat label="متوسط الاختبارات" value={`${avgScore}%`} />
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-cyber-blue">الشارات</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`rounded-xl border p-3 text-center ${
                badge.earned
                  ? "border-cyber-gold/50 bg-cyber-gold/10"
                  : "border-white/10 bg-white/[0.02] opacity-50"
              }`}
            >
              <div className="text-sm font-bold text-cyber-gold">{badge.title}</div>
              <div className="mt-1 text-[11px] leading-5 pharaoh-muted">
                {badge.description}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-cyber-blue">آخر الاختبارات</h2>
        {data.quizzes.length === 0 ? (
          <p className="mt-2 text-sm pharaoh-muted">لم تُنجز أي اختبار بعد.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {[...data.quizzes]
              .reverse()
              .slice(0, 10)
              .map((quiz, index) => (
                <li
                  key={`${quiz.path_id}-${quiz.lesson_index}-${index}`}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm"
                >
                  <span className="pharaoh-muted">
                    درس {quiz.lesson_index + 1} — {quiz.path_id}
                  </span>
                  <span className="font-bold text-cyber-gold">
                    {quiz.score}/{quiz.total}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </section>

      {data.labs.length >= 10 && (
        <section className="mt-8 rounded-2xl border border-cyber-gold/40 bg-cyber-gold/5 p-6 text-center">
          <h2 className="text-lg font-bold text-cyber-gold">شهادة إنجاز</h2>
          <p className="mt-2 text-sm leading-7 pharaoh-muted">
            {data.displayName ?? "متدرّب فرعون Ai"} — أنجز {data.labs.length} معملًا عمليًا و
            {data.quizzes.length} اختبارًا في الأمن السيبراني.
          </p>
          <button
            onClick={() => {
              const text = `أنجزت ${data.labs.length} معملًا عمليًا في الأمن السيبراني على تطبيق فرعون Ai 🏆`;
              if (navigator.share) void navigator.share({ text });
              else void navigator.clipboard.writeText(text);
            }}
            className="mt-4 rounded-full bg-cyber-gold px-5 py-2 font-bold text-cyber-dark"
          >
            مشاركة الإنجاز
          </button>
        </section>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" className="pharaoh-page min-h-screen px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-sm text-cyber-blue hover:underline">
            ← رجوع للتطبيق
          </Link>
          <Link to="/roadmap" className="text-sm text-cyber-gold hover:underline">
            خطة التعلّم
          </Link>
        </div>
        <h1 className="mt-6 text-3xl font-black pharaoh-title">لوحة تقدّمي</h1>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-cyber-blue/25 bg-black/40 p-4 text-center">
      <div className="text-2xl font-black text-cyber-gold">{value}</div>
      <div className="mt-1 text-xs pharaoh-muted">{label}</div>
    </div>
  );
}