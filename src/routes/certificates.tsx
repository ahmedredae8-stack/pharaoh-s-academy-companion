import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Award, Clock, Printer, ShieldCheck, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useAccount } from "@/components/account/AccountProvider";
import { CertificateSheet, type CertificateData } from "@/components/certificate/CertificateSheet";
import { DuoLayout } from "@/components/duo/DuoLayout";
import { getMyCertificates, issueCertificate } from "@/lib/certificates.functions";

const PATHS = [
  { id: "beginner", label: "المسار المبتدئ" },
  { id: "intermediate", label: "المسار المتوسط" },
  { id: "upperIntermediate", label: "فوق المتوسط" },
  { id: "advanced", label: "المسار المتقدّم" },
] as const;

export const Route = createFileRoute("/certificates")({
  head: () => ({
    meta: [
      { title: "شهاداتي — فرعون Ai" },
      {
        name: "description",
        content: "اطلب شهادة إتمام المسار، تابع حالة مراجعة الإدارة، واطبع شهادتك الاحترافية بعد الاعتماد.",
      },
      { property: "og:title", content: "شهاداتي — فرعون Ai" },
      { property: "og:description", content: "شهادات احترافية معتمدة من فرعون Ai مع رقم تسلسلي قابل للتحقق." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CertificatesPage,
});

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { text: string; className: string; Icon: typeof Clock }> = {
    pending: { text: "بانتظار مراجعة الإدارة", className: "bg-duo-surface-2 text-duo-green-dark", Icon: Clock },
    approved: { text: "معتمدة", className: "bg-duo-surface-2 text-duo-blue-dark", Icon: ShieldCheck },
    rejected: { text: "مرفوضة", className: "bg-duo-surface-2 text-duo-red", Icon: XCircle },
  };
  const item = map[status] ?? map.pending!;
  const Icon = item.Icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${item.className}`}>
      <Icon className="h-4 w-4" /> {item.text}
    </span>
  );
}

function CertificatesPage() {
  const { session } = useAccount();
  const queryClient = useQueryClient();
  const fetchCerts = useServerFn(getMyCertificates);
  const requestCert = useServerFn(issueCertificate);
  const [preview, setPreview] = useState<CertificateData | null>(null);

  const certs = useQuery({
    queryKey: ["my-certificates"],
    queryFn: () => fetchCerts(),
    enabled: Boolean(session),
  });

  const issue = useMutation({
    mutationFn: (pathId: (typeof PATHS)[number]["id"]) => requestCert({ data: { pathId } }),
    onSuccess: (result: any) => {
      if (result?.ok === false) {
        toast.error(`أكمل المسار أولًا (${result.done}/${result.total} درس)`);
        return;
      }
      toast.success(result?.alreadyIssued ? "طلبك موجود بالفعل" : "تم إرسال الشهادة لمراجعة الإدارة");
      queryClient.invalidateQueries({ queryKey: ["my-certificates"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!session) {
    return (
      <DuoLayout>
        <div className="duo-card space-y-3 p-6 text-center">
          <Award className="mx-auto h-10 w-10 text-duo-green" />
          <h1 className="text-xl font-black">شهاداتي</h1>
          <p className="text-sm text-duo-muted">سجّل الدخول لعرض شهاداتك وطلب اعتمادها.</p>
          <Link to="/auth" className="duo-btn inline-flex">
            تسجيل الدخول
          </Link>
        </div>
      </DuoLayout>
    );
  }

  const rows = (certs.data ?? []) as any[];

  return (
    <DuoLayout>
      <div className="space-y-4">
        <header className="duo-card space-y-1 p-5">
          <h1 className="flex items-center gap-2 text-xl font-black">
            <Award className="h-6 w-6 text-duo-green" /> شهاداتي
          </h1>
          <p className="text-sm text-duo-muted">
            كل شهادة تمرّ بمراجعة الإدارة قبل الاعتماد. بعد الاعتماد تحصل على رقم تسلسلي قابل للتحقق عبر صفحة{" "}
            <Link to="/verify" className="font-black text-duo-blue-dark">
              التحقق
            </Link>
            .
          </p>
        </header>

        <section className="duo-card space-y-3 p-5">
          <h2 className="text-sm font-black">اطلب شهادة مسار</h2>
          <div className="flex flex-wrap gap-2">
            {PATHS.map((path) => (
              <button
                key={path.id}
                type="button"
                disabled={issue.isPending}
                onClick={() => issue.mutate(path.id)}
                className="duo-btn text-sm"
              >
                {path.label}
              </button>
            ))}
          </div>
        </section>

        {certs.isLoading ? <p className="p-4 text-sm text-duo-muted">جارٍ التحميل…</p> : null}

        {!certs.isLoading && rows.length === 0 ? (
          <p className="duo-card p-6 text-center text-sm text-duo-muted">لا توجد شهادات بعد.</p>
        ) : null}

        {rows.map((cert) => (
          <article key={cert.id} className="duo-card space-y-3 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-black">{cert.course_title}</h3>
                <p className="font-mono text-xs text-duo-muted">{cert.serial}</p>
              </div>
              <StatusBadge status={cert.status} />
            </div>

            {cert.status === "rejected" && cert.review_note ? (
              <p className="rounded-xl bg-duo-surface-2 p-3 text-sm text-duo-red">{cert.review_note}</p>
            ) : null}

            {cert.status === "pending" ? (
              <p className="rounded-xl bg-duo-surface-2 p-3 text-sm text-duo-muted">
                شهادتك في قائمة المراجعة، سيصلك إشعار فور اعتمادها من الإدارة.
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <button type="button" className="duo-btn text-sm" onClick={() => setPreview(cert)}>
                معاينة الشهادة
              </button>
              {cert.status === "approved" ? (
                <button
                  type="button"
                  className="duo-btn text-sm"
                  onClick={() => {
                    setPreview(cert);
                    setTimeout(() => window.print(), 250);
                  }}
                >
                  <Printer className="h-4 w-4" /> طباعة / PDF
                </button>
              ) : null}
            </div>

            {preview?.serial === cert.serial ? (
              <div className="overflow-x-auto">
                <CertificateSheet
                  data={cert}
                  watermark={cert.status === "approved" ? undefined : "PENDING REVIEW"}
                />
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </DuoLayout>
  );
}
