import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { DuoLayout } from "@/components/duo/DuoLayout";
import { PROGRAM, TOTAL_HOURS, TOTAL_WEEKS } from "@/lib/courses";
import { CURRICULUM } from "@/lib/curriculum";
import { PAID_COURSES } from "@/lib/paid-courses";
import { PATH_LABELS } from "@/lib/products";

export const Route = createFileRoute("/courses")({
  head: () => ({
    meta: [
      { title: "كورسات أمن سيبراني عملية من الصفر — 24 أسبوعًا | فرعون Ai" },
      {
        name: "description",
        content:
          "برنامج عملي أسبوعي لتعلّم الأمن السيبراني من الصفر: معمل منزلي، تمارين حقيقية، مصادر مجانية، وتسليم عملي كل أسبوع حتى مستوى قابل للتوظيف.",
      },
      { property: "og:title", content: "كورسات أمن سيبراني عملية من الصفر — 24 أسبوعًا" },
      {
        property: "og:description",
        content: "24 أسبوعًا بمعامل وتسليمات حقيقية تنقلك من الصفر إلى وظيفة في الأمن السيبراني.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Courses,
});

const TAB_STYLE =
  "flex-1 rounded-2xl border-2 px-3 py-2 text-sm font-black transition-colors";

function Courses() {
  const [tab, setTab] = useState<"weeks" | "tracks">("weeks");

  return (
    <DuoLayout>
      <h1 className="text-2xl font-black text-duo-text">الكورسات</h1>
      <p className="mt-1 text-sm text-duo-muted">
        {TOTAL_WEEKS} أسبوعًا • ≈ {TOTAL_HOURS} ساعة عمل حقيقي • معمل وتسليم في كل أسبوع.
      </p>

      <section className="mt-6">
        <h2 className="text-lg font-black text-duo-text">كورسات مدفوعة</h2>
        <p className="mt-1 text-sm text-duo-muted">
          كورسات عملية كاملة بمعامل وتمارين — اشترِ الكورس الذي يناسب مستواك.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PAID_COURSES.map((c) => (
            <article key={c.id} className="duo-card flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-duo-surface-2 text-2xl">
                  {c.emoji}
                </span>
                {c.badge ? (
                  <span className="rounded-full bg-duo-surface-2 px-3 py-1 text-[11px] font-black text-duo-green">
                    {c.badge}
                  </span>
                ) : null}
              </div>
              <h3 className="mt-3 text-base font-black leading-7 text-duo-text">{c.title}</h3>
              <p className="mt-1 flex-1 text-sm leading-6 text-duo-muted">{c.subtitle}</p>
              <p className="mt-3 text-xs font-bold text-duo-muted">
                {c.level} • {c.hours} ساعة • {c.lessons} درسًا
              </p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-black text-duo-text">{c.price}</span>
                  {c.oldPrice ? (
                    <span className="text-xs font-bold text-duo-muted line-through">
                      {c.oldPrice}
                    </span>
                  ) : null}
                </div>
                <Link to="/profile" className="duo-btn px-4 py-2 text-sm">
                  اشترك الآن
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setTab("weeks")}
          className={`${TAB_STYLE} ${
            tab === "weeks"
              ? "border-duo-green bg-duo-green/15 text-duo-green"
              : "border-duo-line bg-duo-surface text-duo-muted"
          }`}
        >
          البرنامج الأسبوعي
        </button>
        <button
          onClick={() => setTab("tracks")}
          className={`${TAB_STYLE} ${
            tab === "tracks"
              ? "border-duo-blue bg-duo-blue/15 text-duo-blue"
              : "border-duo-line bg-duo-surface text-duo-muted"
          }`}
        >
          المسارات التخصصية
        </button>
      </div>

      {tab === "weeks" ? (
        <div className="mt-6 space-y-8">
          {PROGRAM.map((term) => (
            <section key={term.id}>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-black text-duo-yellow">{term.title}</h2>
                <span className="rounded-full bg-duo-blue/15 px-3 py-0.5 text-xs font-bold text-duo-blue">
                  {PATH_LABELS[term.pathId]}
                </span>
              </div>
              <p className="mt-1 text-sm text-duo-muted">{term.subtitle}</p>

              <div className="mt-3 space-y-3">
                {term.weeks.map((w) => (
                  <article key={w.week} className="duo-card p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-black">
                        <span className="text-duo-green">أسبوع {w.week}</span> — {w.title}
                      </h3>
                      <span className="text-xs font-bold text-duo-muted">{w.hours} ساعات</span>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-duo-muted">{w.goal}</p>
                    <dl className="mt-3 space-y-1 text-sm leading-7">
                      <Row label="المعمل" value={w.lab} />
                      <Row label="المصدر" value={w.resource} />
                      <Row label="التسليم" value={w.deliverable} />
                    </dl>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {CURRICULUM.map((stage) => (
            <article key={stage.pathId} className="duo-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-black text-duo-yellow">{stage.title}</h2>
                <span className="rounded-full bg-duo-surface-2 px-3 py-0.5 text-xs font-bold text-duo-muted">
                  {stage.level} • {stage.hours} ساعة
                </span>
              </div>
              <p className="mt-2 text-sm leading-7 text-duo-muted">{stage.summary}</p>
              <ul className="mt-3 space-y-2">
                {stage.modules.map((m) => (
                  <li key={m.title} className="rounded-2xl bg-duo-surface-2 p-3">
                    <p className="font-bold">{m.title}</p>
                    <p className="text-xs text-duo-muted">{m.weeks}</p>
                    <p className="mt-1 text-sm text-duo-muted">{m.project}</p>
                    <p className="mt-1 text-xs text-duo-blue">{m.tools.join(" • ")}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs font-bold text-duo-green">{stage.certification}</p>
            </article>
          ))}
        </div>
      )}

    </DuoLayout>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="inline font-black text-duo-yellow">{label}: </dt>
      <dd className="inline text-duo-muted">{value}</dd>
    </div>
  );
}
