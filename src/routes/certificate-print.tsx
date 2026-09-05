import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Mail, Printer } from "lucide-react";
import { useState } from "react";

import { useAccount } from "@/components/account/AccountProvider";
import { CertificateSheet, type CertificateTemplate } from "@/components/certificate/CertificateSheet";
import { DuoLayout } from "@/components/duo/DuoLayout";
import { getMyCertificates } from "@/lib/certificates.functions";

export const Route = createFileRoute("/certificate-print")({
  head: () => ({
    meta: [
      { title: "طباعة الشهادة — فرعون Ai" },
      {
        name: "description",
        content: "اطبع شهادتك المعتمدة بصيغة PDF بالقالب المحفوظ، أو أرسلها بالبريد الإلكتروني للجهة التي تريدها.",
      },
      { property: "og:title", content: "طباعة الشهادة — فرعون Ai" },
      { property: "og:description", content: "طباعة شهادة فرعون Ai بصيغة PDF وإرسالها بالبريد." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CertificatePrintPage,
});

function CertificatePrintPage() {
  const { session } = useAccount();
  const listMine = useServerFn(getMyCertificates);
  const [selected, setSelected] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["my-certificates", session?.user.id ?? "anon"],
    queryFn: () => listMine(),
    enabled: Boolean(session),
  });

  const rows = ((data ?? []) as any[]).filter((c) => c.status === "approved");
  const cert = rows.find((c) => c.id === selected) ?? rows[0] ?? null;

  if (!session) {
    return (
      <DuoLayout>
        <div className="duo-card space-y-3 p-6 text-center">
          <p className="font-bold">سجّل الدخول لعرض شهاداتك وطباعتها.</p>
          <Link to="/auth" className="duo-btn inline-flex">
            تسجيل الدخول
          </Link>
        </div>
      </DuoLayout>
    );
  }

  const verifyLink =
    typeof window !== "undefined" && cert ? `${window.location.origin}/verify?serial=${cert.serial}` : "";

  const mailHref = cert
    ? `mailto:?subject=${encodeURIComponent(`شهادة ${cert.recipient_name} — ${cert.course_title}`)}&body=${encodeURIComponent(
        [
          `مرحبًا،`,
          ``,
          `هذه شهادة "${cert.course_title}" الصادرة من منصة فرعون Ai.`,
          `الاسم: ${cert.recipient_name}`,
          `رقم الشهادة: ${cert.serial}`,
          `للتحقق من صحتها: ${verifyLink}`,
          ``,
          `يمكنك إرفاق نسخة PDF من الشهادة بعد حفظها من زر «طباعة PDF».`,
        ].join("\n"),
      )}`
    : "";

  return (
    <DuoLayout>
      <div className="space-y-4 print:hidden">
        <h1 className="text-2xl font-black">طباعة الشهادة</h1>
        <p className="text-sm text-duo-muted">
          تُطبع الشهادة بالقالب المحفوظ لها. اختر «طباعة PDF» ثم «حفظ كملف PDF» في نافذة الطباعة.
        </p>

        {isLoading ? (
          <div className="duo-card p-6 text-center text-duo-muted">جارٍ تحميل شهاداتك…</div>
        ) : rows.length === 0 ? (
          <div className="duo-card space-y-3 p-6 text-center">
            <p className="font-bold">لا توجد شهادة معتمدة بعد.</p>
            <Link to="/certificates" className="duo-btn inline-flex">
              صفحة الشهادات
            </Link>
          </div>
        ) : (
          <div className="duo-card space-y-3 p-5">
            {rows.length > 1 ? (
              <label className="block text-xs font-black text-duo-muted">
                اختر الشهادة
                <select
                  value={cert?.id ?? ""}
                  onChange={(event) => setSelected(event.target.value)}
                  className="mt-1 w-full rounded-xl border-2 border-duo-line bg-duo-ink px-3 py-2 text-sm font-bold text-duo-text"
                >
                  {rows.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.course_title} — {row.serial}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <button type="button" className="duo-btn" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> طباعة PDF
              </button>
              <a className="duo-btn duo-btn-blue" href={mailHref}>
                <Mail className="h-4 w-4" /> إرسال بالبريد
              </a>
            </div>
          </div>
        )}
      </div>

      {cert ? (
        <div className="mt-4">
          <CertificateSheet
            data={cert}
            template={(cert.template as CertificateTemplate | undefined) ?? undefined}
          />
        </div>
      ) : null}
    </DuoLayout>
  );
}
