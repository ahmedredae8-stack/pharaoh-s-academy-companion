import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import { DuoLayout } from "@/components/duo/DuoLayout";
import { FLAGSHIP_COURSE } from "@/lib/paid-courses";

export const Route = createFileRoute("/courses")({
  head: () => ({
    meta: [
      { title: "فرعون سايبر رينج — كورس معامل الأمن السيبراني | فرعون Ai" },
      {
        name: "description",
        content:
          "كورس واحد بمستوى المنصات العالمية: معامل محاكاة آمنة داخل المتصفح، نظام أعلام ونقاط، ومساعد ذكاء اصطناعي — قريبًا على فرعون Ai.",
      },
      { property: "og:title", content: "فرعون سايبر رينج — قريبًا" },
      {
        property: "og:description",
        content: "معامل هجوم ودفاع آمنة داخل المتصفح مع أعلام ونقاط وشهادة معتمدة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Courses,
});

function Courses() {
  const course = FLAGSHIP_COURSE;

  return (
    <DuoLayout>
      <h1 className="text-2xl font-black text-duo-text">الكورسات</h1>
      <p className="mt-1 text-sm text-duo-muted">
        كورس واحد فقط — لكنه يعادل منصة تدريب كاملة.
      </p>

      <article className="duo-card mt-6 overflow-hidden p-0">
        <div className="relative">
          <img
            src={course.cover}
            alt="غلاف كورس فرعون سايبر رينج"
            width={1280}
            height={800}
            loading="lazy"
            className="h-52 w-full object-cover sm:h-72"
          />
          <span className="absolute right-4 top-4 rounded-full bg-duo-yellow px-4 py-1 text-xs font-black text-duo-ink">
            {course.badge}
          </span>
        </div>

        <div className="p-5">
          <p className="text-xs font-black tracking-widest text-duo-blue">{course.englishTitle}</p>
          <h2 className="mt-1 text-xl font-black leading-8 text-duo-text">{course.title}</h2>
          <p className="mt-2 text-sm leading-7 text-duo-muted">{course.subtitle}</p>

          <p className="mt-3 text-xs font-bold text-duo-muted">
            {course.level} • {course.hours} ساعة • {course.lessons} درسًا ومعملًا
          </p>

          <ul className="mt-4 space-y-2">
            {course.highlights.map((item) => (
              <li key={item} className="flex items-start gap-2 rounded-2xl bg-duo-surface-2 p-3 text-sm font-bold text-duo-text">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-duo-yellow" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black text-duo-text">{course.price}</span>
              {course.oldPrice ? (
                <span className="text-xs font-bold text-duo-muted line-through">{course.oldPrice}</span>
              ) : null}
            </div>
            <button type="button" disabled className="duo-btn cursor-not-allowed px-5 py-2 text-sm opacity-60">
              قريبًا
            </button>
          </div>
        </div>
      </article>
    </DuoLayout>
  );
}
