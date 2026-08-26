import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Award, Clock, Lock, Printer, ShieldCheck, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useAccount } from "@/components/account/AccountProvider";
import {
  CERTIFICATE_TEMPLATES,
  CertificateSheet,
  type CertificateData,
  type CertificateTemplate,
} from "@/components/certificate/CertificateSheet";
import { DuoLayout } from "@/components/duo/DuoLayout";
import { verifyPlayPurchase } from "@/lib/billing.functions";
import { LESSON_COUNTS } from "@/lib/certificate-catalog";
import { getMyCertificates, issueCertificate } from "@/lib/certificates.functions";
import { BillingUnavailableError, launchNativePurchase } from "@/lib/native-billing";
import { CERTIFICATE_PRODUCT, hasProduct, type PathId } from "@/lib/products";

const PATHS: { id: PathId; label: string }[] = [
  { id: "beginner", label: "المسار المبتدئ" },
  { id: "intermediate", label: "المسار المتوسط" },
  { id: "upperIntermediate", label: "فوق المتوسط" },
  { id: "advanced", label: "المسار المتقدّم" },
];

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
  const item = map[status] ?? map["pending"]!;
  const Icon = item.Icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${item.className}`}>
      <Icon className="h-4 w-4" /> {item.text}
    </span>
  );
}

function CertificatesPage() {
  const { session, entitlements, account, refresh } = useAccount();
  const queryClient = useQueryClient();
  const fetchCerts = useServerFn(getMyCertificates);
  const requestCert = useServerFn(issueCertificate);
  const [preview, setPreview] = useState<CertificateData | null>(null);
  const [template, setTemplate] = useState<CertificateTemplate>("royal");
  const [buying, setBuying] = useState(false);

  const certs = useQuery({
    queryKey: ["my-certificates"],
    queryFn: () => fetchCerts(),
    enabled: Boolean(session),
  });

  const issue = useMutation({
    mutationFn: (pathId: PathId) => requestCert({ data: { pathId } }),
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

  async function buyCertificate() {
    setBuying(true);
    try {
      const result = await launchNativePurchase(CERTIFICATE_PRODUCT.id, "one_time");
      await verifyPlayPurchase({
        data: {
          productId: result.productId || CERTIFICATE_PRODUCT.id,
          purchaseToken: result.purchaseToken,
          kind: "one_time",
        },
      });
      await refresh();
      toast.success("تم تفعيل الشهادة الرسمية");
    } catch (error) {
      if (error instanceof BillingUnavailableError) {
        toast.info("الشراء متاح داخل تطبيق أندرويد من متجر Google Play");
      } else {
        toast.error("تعذّر إتمام الشراء، حاول لاحقًا");
      }
    } finally {
      setBuying(false);
    }
  }

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
  const progressData = ((account?.progress as any)?.data ?? {}) as Record<string, unknown>;
  const owned = hasProduct(entitlements, CERTIFICATE_PRODUCT.id);

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

        {!owned ? (
          <section className="duo-card space-y-3 p-5">
            <h2 className="flex items-center gap-2 text-sm font-black">
              <Lock className="h-5 w-5 text-duo-yellow" /> {CERTIFICATE_PRODUCT.title}
            </h2>
            <p className="text-sm text-duo-muted">{CERTIFICATE_PRODUCT.subtitle}</p>
            <button type="button" disabled={buying} className="duo-btn text-sm" onClick={() => void buyCertificate()}>
              شراء عبر Google Play — {CERTIFICATE_PRODUCT.price}
            </button>
            <p className="text-[11px] font-bold text-duo-muted">
              الدفع عبر Google Play فقط. بعد الشراء يظهر زر «طلب الشهادة» أمام كل مسار أكملته.
            </p>
          </section>
        ) : null}

        <section className="duo-card space-y-3 p-5">
          <h2 className="text-sm font-black">طلب شهادة بعد إنهاء المسار</h2>
          <div className="space-y-2">
            {PATHS.map((path) => {
              const total = LESSON_COUNTS[path.id];
              const done = Math.max(0, Number(progressData[`${path.id}UnlockedLesson`] ?? 0));
              const completed = done >= total;
              const already = rows.some((row) => row.path_id === path.id);
              return (
                <div
                  key={path.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-duo-surface-2 p-3"
                >
                  <div>
                    <p className="text-sm font-black">{path.label}</p>
                    <p className="text-xs text-duo-muted">
                      {Math.min(done, total)}/{total} درس
                    </p>
                  </div>
                  {already ? (
                    <span className="text-xs font-black text-duo-muted">تم الطلب</span>
                  ) : !completed ? (
                    <span className="text-xs font-black text-duo-muted">أكمل المسار لفتح الطلب</span>
                  ) : !owned ? (
                    <span className="text-xs font-black text-duo-yellow">يتطلّب الشهادة الرسمية</span>
                  ) : (
                    <button
                      type="button"
                      disabled={issue.isPending}
                      onClick={() => issue.mutate(path.id)}
                      className="duo-btn text-sm"
                    >
                      طلب الشهادة
                    </button>
                  )}
                </div>
              );
            })}
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
              <button
                type="button"
                className="duo-btn text-sm"
                onClick={() => {
                  setPreview(cert);
                  setTemplate((cert.template as CertificateTemplate) ?? "royal");
                }}
              >
                معاينة الشهادة
              </button>
              {cert.status === "approved" ? (
                <button
                  type="button"
                  className="duo-btn text-sm"
                  onClick={() => {
                    setPreview(cert);
                    setTemplate((cert.template as CertificateTemplate) ?? "royal");
                    setTimeout(() => window.print(), 250);
                  }}
                >
                  <Printer className="h-4 w-4" /> طباعة / PDF
                </button>
              ) : null}
            </div>

            {preview?.serial === cert.serial ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {CERTIFICATE_TEMPLATES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTemplate(item.id)}
                      className={`rounded-full px-3 py-1 text-[11px] font-black ${
                        template === item.id ? "bg-duo-green text-duo-ink" : "bg-duo-surface-2 text-duo-muted"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="overflow-x-auto">
                  {cert.status === "approved" ? (
                    <CertificateSheet data={{ ...cert, template }} />
                  ) : (
                    <CertificateSheet data={{ ...cert, template }} watermark="PENDING REVIEW" />
                  )}
                </div>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </DuoLayout>
  );
}
