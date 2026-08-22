import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";

import { PharaohShell } from "@/components/account/PharaohShell";
import { DuoLayout } from "@/components/duo/DuoLayout";
import { LessonMap } from "@/components/duo/LessonMap";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "فرعون Ai — خريطة تعلّم الأمن السيبراني بالعربية" },
      {
        name: "description",
        content:
          "تعلّم الأمن السيبراني بالعربية عبر خريطة دروس متعرجة، محاكيات عملية، واختبار بعد كل مهمة.",
      },
      { property: "og:title", content: "فرعون Ai — خريطة تعلّم الأمن السيبراني" },
      {
        property: "og:description",
        content: "خريطة دروس تفاعلية ومحاكيات عملية لتعلّم الأمن السيبراني بالعربية.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;500;700;900&display=swap",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [stats, setStats] = useState({ xp: 0, done: 0 });
  const onStatsChange = useCallback(
    (next: { xp: number; done: number }) => setStats(next),
    [],
  );

  return (
    <DuoLayout stats={{ xp: stats.xp, streak: stats.done }}>
      <h1 className="sr-only">خريطة دروس الأمن السيبراني</h1>
      <LessonMap onStatsChange={onStatsChange} />
      <PharaohShell />
    </DuoLayout>
  );
}
