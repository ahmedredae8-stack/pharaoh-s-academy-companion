import { createFileRoute, Link } from "@tanstack/react-router";

import { CURRICULUM, STUDY_RHYTHM } from "@/lib/curriculum";
import { PATH_LABELS } from "@/lib/products";

export const Route = createFileRoute("/roadmap")({
  head: () => ({
    meta: [
      { title: "خطة تعلّم الأمن السيبراني من الصفر للاحتراف | فرعون Ai" },
      {
        name: "description",
        content:
          "خطة تعلّم عملية للأمن السيبراني بالعربية: أربع مراحل، وحدات أسبوعية، أدوات حقيقية، ومشروع تطبيقي لكل وحدة حتى مستوى الاحتراف.",
      },
      { property: "og:title", content: "خطة تعلّم الأمن السيبراني من الصفر للاحتراف" },
      {
        property: "og:description",
        content: "أربع مراحل متدرجة بأدوات ومشاريع حقيقية لتتعلم الأمن السيبراني فعليًا.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Roadmap,
});

function Roadmap() {
  const totalHours = CURRICULUM.reduce((sum, stage) => sum + stage.hours, 0);

  return (
    <div dir="rtl" className="pharaoh-page min-h-screen px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <Link to="/" className="text-sm text-cyber-blue hover:underline">
          ← رجوع للتطبيق
        </Link>

        <h1 className="mt-6 text-3xl font-black pharaoh-title md:text-4xl">
          خطة تعلّم الأمن السيبراني — من الصفر إلى الاحتراف
        </h1>
        <p className="mt-3 leading-8 pharaoh-muted">
          هذه ليست قائمة دروس، بل مسار مهني. {CURRICULUM.length} مراحل، ما يقارب {totalHours} ساعة
          تعلّم فعلي، ولكل وحدة أدوات حقيقية ومشروع تُنجزه بيدك. أنجز المشاريع، وستملك ملفًا مهنيًا
          قبل أن تملك شهادة.
        </p>

        <section className="mt-8 rounded-2xl border border-cyber-blue/30 bg-black/40 p-5">
          <h2 className="text-lg font-bold text-cyber-blue">قواعد الإيقاع</h2>
          <ul className="mt-3 space-y-2 text-sm leading-7 pharaoh-muted">
            {STUDY_RHYTHM.map((rule) => (
              <li key={rule}>• {rule}</li>
            ))}
          </ul>
        </section>

        <div className="mt-10 space-y-8">
          {CURRICULUM.map((stage, index) => (
            <article
              key={stage.pathId}
              className="rounded-2xl border border-cyber-gold/25 bg-black/40 p-6"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-cyber-gold/15 px-3 py-1 text-xs font-bold text-cyber-gold">
                  المرحلة {index + 1}
                </span>
                <span className="text-xs pharaoh-muted">{stage.level}</span>
                <span className="text-xs pharaoh-muted">~{stage.hours} ساعة</span>
                <span className="text-xs text-cyber-blue">{PATH_LABELS[stage.pathId]}</span>
              </div>

              <h2 className="mt-3 text-2xl font-bold pharaoh-title">{stage.title}</h2>
              <p className="mt-2 leading-8 pharaoh-muted">{stage.summary}</p>

              <div className="mt-5 space-y-4">
                {stage.modules.map((module) => (
                  <div
                    key={module.title}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-bold text-[#e6f1ff]">{module.title}</h3>
                      <span className="text-xs pharaoh-muted">{module.weeks}</span>
                    </div>
                    <ul className="mt-2 space-y-1 text-sm leading-7 pharaoh-muted">
                      {module.outcomes.map((outcome) => (
                        <li key={outcome}>◦ {outcome}</li>
                      ))}
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {module.tools.map((tool) => (
                        <span
                          key={tool}
                          className="rounded-md border border-cyber-blue/30 px-2 py-0.5 text-[11px] text-cyber-blue"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-sm text-cyber-gold/90">
                      المشروع: <span className="pharaoh-muted">{module.project}</span>
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-5 text-sm pharaoh-muted">
                الشهادة المستهدفة: <span className="text-cyber-blue">{stage.certification}</span>
              </p>
            </article>
          ))}
        </div>

      </div>
    </div>
  );
}