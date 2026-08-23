import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useAccount } from "@/components/account/AccountProvider";
import { DuoLayout } from "@/components/duo/DuoLayout";
import { isEmojiAvatar, mediaUrl, uploadMedia } from "@/lib/media";
import { updateMyProfile } from "@/lib/profile.functions";
import { getMyStats } from "@/lib/stats.functions";

const AVATARS = ["🐱", "🐺", "🦅", "🐍", "🦂", "🐫", "🦉", "🐉", "🛡️", "👑", "🕵️", "🤖"];

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "ملفي الشخصي — فرعون Ai" },
      {
        name: "description",
        content: "ملفك الشخصي في فرعون Ai: صورتك الرمزية، نقاطك، معاملك المكتملة ونتائج اختباراتك.",
      },
      { property: "og:title", content: "ملفي الشخصي — فرعون Ai" },
      {
        property: "og:description",
        content: "تابع نقاطك ومعاملك المكتملة واختر صورتك الرمزية في فرعون Ai.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { session, account, isPro, signOut, refresh, loading } = useAccount();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("🐱");
  const [busy, setBusy] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!account?.profile) return;
    setName(account.profile.display_name ?? "");
    if (account.profile.avatar_url) setAvatar(account.profile.avatar_url);
  }, [account]);

  useEffect(() => {
    let alive = true;
    if (isEmojiAvatar(avatar)) {
      setAvatarSrc(null);
      return;
    }
    void mediaUrl(avatar).then((url) => {
      if (alive) setAvatarSrc(url);
    });
    return () => {
      alive = false;
    };
  }, [avatar]);

  async function onPickFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const path = await uploadMedia(file, "avatars");
      setAvatar(path);
      await updateMyProfile({ data: { displayName: name || "مجنّد", avatar: path } });
      await refresh();
      toast.success("تم رفع صورتك الشخصية");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذّر رفع الصورة");
    } finally {
      setBusy(false);
    }
  }

  const { data: stats } = useQuery({
    queryKey: ["my-stats", session?.user.id ?? "anon"],
    enabled: Boolean(session),
    queryFn: () => getMyStats(),
  });

  const xp = (stats?.labs.length ?? 0) * 20 + (stats?.quizzes ?? []).reduce((a, q) => a + q.score, 0) * 10;

  async function save() {
    setBusy(true);
    try {
      await updateMyProfile({ data: { displayName: name || "مجنّد", avatar } });
      await refresh();
      toast.success("تم حفظ ملفك الشخصي");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذّر الحفظ");
    } finally {
      setBusy(false);
    }
  }

  if (!loading && !session) {
    return (
      <DuoLayout>
        <div className="duo-card p-8 text-center">
          <img src="/mascot.png" alt="تميمة فرعون Ai" className="mx-auto h-24 w-24 object-contain" />
          <h1 className="mt-3 text-xl font-black">أنشئ ملفك الشخصي</h1>
          <p className="mt-2 text-sm text-duo-muted">
            سجّل الدخول لحفظ تقدّمك عبر أجهزتك ودخول دوري المتصدرين.
          </p>
          <Link to="/auth" className="duo-btn mt-5">
            تسجيل الدخول أو إنشاء حساب
          </Link>
        </div>
      </DuoLayout>
    );
  }

  return (
    <DuoLayout stats={{ xp }}>
      <h1 className="text-2xl font-black text-duo-text">ملفي الشخصي</h1>

      <div className="duo-card mt-4 p-5">
        <div className="flex items-center gap-4">
          <span className="grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-duo-surface-2 text-4xl">
            {avatarSrc ? (
              <img src={avatarSrc} alt="صورتي الشخصية" className="h-full w-full object-cover" />
            ) : (
              avatar
            )}
          </span>
          <div className="flex-1">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اسمك داخل اللعبة"
              className="w-full rounded-xl border-2 border-duo-line bg-duo-ink px-4 py-3 font-bold text-duo-text outline-none focus:border-duo-green"
            />
            <p className="mt-1 text-xs text-duo-muted">{session?.user.email}</p>
          </div>
        </div>

        <label className="mt-5 flex cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-duo-line bg-duo-surface-2 px-4 py-3 text-sm font-bold text-duo-muted">
          ارفع صورة شخصية مخصّصة (حتى 5 ميجابايت)
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={busy}
            onChange={(e) => void onPickFile(e.target.files?.[0])}
          />
        </label>

        <p className="mt-5 text-sm font-bold text-duo-muted">أو اختر صورة رمزية جاهزة</p>
        <div className="mt-2 grid grid-cols-6 gap-2">
          {AVATARS.map((a) => (
            <button
              key={a}
              onClick={() => setAvatar(a)}
              className={`grid aspect-square place-items-center rounded-2xl border-2 text-2xl ${
                avatar === a ? "border-duo-green bg-duo-green/15" : "border-duo-line bg-duo-surface-2"
              }`}
            >
              {a}
            </button>
          ))}
        </div>

        <button onClick={() => void save()} disabled={busy} className="duo-btn mt-5 w-full">
          حفظ التغييرات
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <Stat label="نقاط" value={xp} />
        <Stat label="معامل" value={stats?.labs.length ?? 0} />
        <Stat label="اختبارات" value={stats?.quizzes.length ?? 0} />
      </div>

      <div className="duo-card mt-4 p-5">
        <p className="font-bold">الاشتراك</p>
        <p className="mt-1 text-sm text-duo-muted">
          {isPro ? "لديك اشتراك PRO — كل المسارات مفتوحة." : "النسخة المجانية — مسار المبتدئ مفتوح."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/progress" className="duo-btn duo-btn-blue">
            لوحة تقدّمي
          </Link>
          <button
            onClick={() => {
              void signOut().then(async () => {
                await refresh();
                void navigate({ to: "/" });
              });
            }}
            className="duo-btn duo-btn-ghost"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    </DuoLayout>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="duo-card p-4">
      <p className="text-2xl font-black text-duo-yellow">{value}</p>
      <p className="text-xs font-bold text-duo-muted">{label}</p>
    </div>
  );
}
