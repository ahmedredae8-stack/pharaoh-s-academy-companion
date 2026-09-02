import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Medal, Trophy } from "lucide-react";

import { useAccount } from "@/components/account/AccountProvider";
import { DuoLayout } from "@/components/duo/DuoLayout";
import { supabase } from "@/integrations/supabase/client";
import { safeDisplayName } from "@/lib/utils";

type Row = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  labs: number;
  quiz_points: number;
  xp: number;
};

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "المتصدرون — دوري فرعون Ai للأمن السيبراني" },
      {
        name: "description",
        content: "تابع ترتيب المتعلمين حسب النقاط المكتسبة من المعامل العملية واختبارات الدروس.",
      },
      { property: "og:title", content: "المتصدرون — دوري فرعون Ai" },
      {
        property: "og:description",
        content: "ترتيب المتعلمين حسب نقاط المعامل والاختبارات في منصة فرعون Ai.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LeaderboardPage,
});

const MEDALS = ["text-duo-yellow", "text-slate-300", "text-amber-600"];

function LeaderboardPage() {
  const { session } = useAccount();

  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard", session?.user.id ?? "anon"],
    enabled: Boolean(session),
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase.rpc("leaderboard_top", { _limit: 50 });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  return (
    <DuoLayout>
      <h1 className="flex items-center gap-2 text-2xl font-black text-duo-yellow">
        <Trophy className="h-7 w-7" /> دوري المتصدرين
      </h1>
      <p className="mt-1 text-sm text-duo-muted">
        نقاطك = 20 لكل معمل عملي + 10 لكل إجابة صحيحة في الاختبارات.
      </p>

      {!session ? (
        <div className="duo-card mt-6 p-6 text-center">
          <p className="font-bold">سجّل الدخول لدخول الدوري ومقارنة نقاطك مع بقية المجنّدين.</p>
          <Link to="/auth" className="duo-btn mt-4">
            تسجيل الدخول
          </Link>
        </div>
      ) : isLoading ? (
        <div className="duo-card mt-6 p-6 text-center text-duo-muted">جارٍ تحميل الترتيب…</div>
      ) : (
        <ol className="mt-6 space-y-2">
          {(data ?? []).map((row, i) => {
            const me = row.user_id === session.user.id;
            return (
              <li
                key={row.user_id}
                className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 ${
                  me ? "border-duo-green bg-duo-green/10" : "border-duo-line bg-duo-surface"
                }`}
              >
                <span className={`w-6 text-center font-black ${MEDALS[i] ?? "text-duo-muted"}`}>
                  {i < 3 ? <Medal className="mx-auto h-5 w-5" /> : i + 1}
                </span>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-duo-surface-2 text-xl">
                  {row.avatar_url ?? "🐱"}
                </span>
                <span className="flex-1 truncate font-bold">{safeDisplayName(row.display_name)}</span>
                <span className="font-black text-duo-blue">{row.xp} XP</span>
              </li>
            );
          })}
          {(data ?? []).length === 0 ? (
            <li className="duo-card p-6 text-center text-duo-muted">لا توجد نتائج بعد — كن الأول!</li>
          ) : null}
        </ol>
      )}
    </DuoLayout>
  );
}
