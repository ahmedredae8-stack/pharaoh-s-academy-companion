import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Ban, KeyRound, ShieldCheck, Signature } from "lucide-react";
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
import { adminIssueCertificate, adminUpdateCertificateDesign } from "@/lib/admin-certificates.functions";

import {
  adminCreateRedeemCodes,
  adminListCertificates,
  adminListRedeemCodes,
  adminListUsers,
  adminReviewCertificate,
  adminSetBan,
  adminStats,
  amIAdmin,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "لوحة الإدارة — فرعون Ai" },
      {
        name: "description",
        content: "مراجعة الشهادات، إدارة التوقيع الرسمي، حظر المستخدمين وإنشاء أكواد التفعيل في فرعون Ai.",
      },
      { property: "og:title", content: "لوحة الإدارة — فرعون Ai" },
      { property: "og:description", content: "أدوات الإدارة الكاملة لمنصة فرعون Ai." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { session } = useAccount();
  const queryClient = useQueryClient();
  const checkAdmin = useServerFn(amIAdmin);
  const listCerts = useServerFn(adminListCertificates);
  const review = useServerFn(adminReviewCertificate);
  const updateDesign = useServerFn(adminUpdateCertificateDesign);
  const listUsers = useServerFn(adminListUsers);
  const setBan = useServerFn(adminSetBan);
  const stats = useServerFn(adminStats);
  const createCodes = useServerFn(adminCreateRedeemCodes);
  const listCodes = useServerFn(adminListRedeemCodes);

  const [tab, setTab] = useState<"certs" | "issue" | "users" | "codes">("certs");
  const [userQuery, setUserQuery] = useState("");
  const [editing, setEditing] = useState<any>(null);
  const [codeProduct, setCodeProduct] = useState("pharaoh_pro_lifetime");
  const [codeCount, setCodeCount] = useState(5);
  const [issueForm, setIssueForm] = useState({
    userId: "",
    pathId: "custom",
    courseTitle: "Applied Cybersecurity — Practitioner Track",
    recipientName: "",
    lessonsCompleted: 0,
    quizAverage: 100,
    honors: "",
    signatureName: "",
    signatureTitle: "Program Director, Pharaoh Ai",
    signatureUrl: "",
    template: "royal" as CertificateTemplate,
    approve: true,
  });


  const admin = useQuery({ queryKey: ["am-i-admin"], queryFn: () => checkAdmin(), enabled: Boolean(session) });
  const isAdmin = Boolean((admin.data as any)?.admin);

  const overview = useQuery({ queryKey: ["admin-stats"], queryFn: () => stats(), enabled: isAdmin });
  const certs = useQuery({ queryKey: ["admin-certs"], queryFn: () => listCerts(), enabled: isAdmin && tab === "certs" });
  const users = useQuery({
    queryKey: ["admin-users", userQuery],
    queryFn: () => listUsers({ data: { query: userQuery } }),
    enabled: isAdmin && tab === "users",
  });
  const codes = useQuery({ queryKey: ["admin-codes"], queryFn: () => listCodes(), enabled: isAdmin && tab === "codes" });

  const reviewMut = useMutation({
    mutationFn: (input: { id: string; status: "approved" | "rejected"; note: string }) => review({ data: input }),
    onSuccess: () => {
      toast.success("تم تحديث حالة الشهادة");
      queryClient.invalidateQueries({ queryKey: ["admin-certs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const designMut = useMutation({
    mutationFn: (input: any) => updateDesign({ data: input }),
    onSuccess: () => {
      toast.success("تم حفظ تصميم الشهادة");
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["admin-certs"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const banMut = useMutation({
    mutationFn: (input: { userId: string; banned: boolean; reason: string }) => setBan({ data: input }),
    onSuccess: () => {
      toast.success("تم تحديث حالة المستخدم");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const codesMut = useMutation({
    mutationFn: () => createCodes({ data: { productId: codeProduct, count: codeCount, note: "" } }),
    onSuccess: () => {
      toast.success("تم توليد الأكواد");
      queryClient.invalidateQueries({ queryKey: ["admin-codes"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!session) {
    return (
      <DuoLayout>
        <div className="duo-card space-y-3 p-6 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-duo-green" />
          <h1 className="text-xl font-black">لوحة الإدارة</h1>
          <p className="text-sm text-duo-muted">سجّل الدخول بحساب الإدارة للمتابعة.</p>
          <Link to="/auth" className="duo-btn inline-flex">
            تسجيل الدخول
          </Link>
        </div>
      </DuoLayout>
    );
  }

  if (admin.isLoading) {
    return (
      <DuoLayout>
        <p className="p-6 text-center text-sm text-duo-muted">جارٍ التحقق من الصلاحيات…</p>
      </DuoLayout>
    );
  }

  if (!isAdmin) {
    return (
      <DuoLayout>
        <p className="duo-card p-6 text-center text-sm font-black text-duo-red">هذه الصفحة للإدارة فقط.</p>
      </DuoLayout>
    );
  }

  const certRows = (certs.data ?? []) as any[];
  const userRows = (users.data ?? []) as any[];
  const codeRows = (codes.data ?? []) as any[];
  const summary = overview.data as any;

  return (
    <DuoLayout>
      <div className="space-y-4">
        <header className="duo-card space-y-3 p-5">
          <h1 className="flex items-center gap-2 text-xl font-black">
            <ShieldCheck className="h-6 w-6 text-duo-green" /> لوحة الإدارة
          </h1>
          <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
            <Metric label="المستخدمون" value={summary?.users ?? 0} />
            <Metric label="المنشورات" value={summary?.posts ?? 0} />
            <Metric label="الشهادات" value={summary?.certificates ?? 0} />
            <Metric label="بانتظار المراجعة" value={summary?.pendingCertificates ?? 0} />
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["certs", "الشهادات"],
                ["issue", "إصدار يدوي"],
                ["users", "المستخدمون"],
                ["codes", "أكواد التفعيل"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`rounded-full px-4 py-2 text-xs font-black ${
                  tab === key ? "bg-duo-green text-duo-ink" : "bg-duo-surface-2 text-duo-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        {tab === "certs"
          ? certRows.map((cert) => (
              <article key={cert.id} className="duo-card space-y-3 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-black">{cert.course_title}</h3>
                    <p className="text-xs text-duo-muted">{cert.recipient_name}</p>
                    <p className="font-mono text-xs text-duo-muted">{cert.serial}</p>
                  </div>
                  <span className="rounded-full bg-duo-surface-2 px-3 py-1 text-xs font-black">{cert.status}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="duo-btn text-sm"
                    onClick={() => reviewMut.mutate({ id: cert.id, status: "approved", note: "" })}
                  >
                    اعتماد
                  </button>
                  <button
                    type="button"
                    className="duo-btn duo-btn-ghost text-sm"
                    onClick={() => {
                      const note = window.prompt("سبب الرفض؟") ?? "";
                      reviewMut.mutate({ id: cert.id, status: "rejected", note });
                    }}
                  >
                    رفض
                  </button>
                  <button
                    type="button"
                    className="duo-btn duo-btn-blue text-sm"
                    onClick={() => setEditing(editing?.id === cert.id ? null : cert)}
                  >
                    <Signature className="h-4 w-4" /> تعديل التصميم والتوقيع
                  </button>
                </div>

                {editing?.id === cert.id ? (
                  <form
                    className="space-y-2 rounded-2xl bg-duo-surface-2 p-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const form = new FormData(event.currentTarget);
                      designMut.mutate({
                        id: cert.id,
                        recipientName: String(form.get("recipientName") ?? ""),
                        courseTitle: String(form.get("courseTitle") ?? ""),
                        honors: String(form.get("honors") ?? ""),
                        signatureName: String(form.get("signatureName") ?? ""),
                        signatureTitle: String(form.get("signatureTitle") ?? ""),
                        signatureUrl: String(form.get("signatureUrl") ?? ""),
                        template: String(form.get("template") ?? "royal"),
                      });
                    }}
                  >
                    <Field name="recipientName" label="اسم المتدرّب" defaultValue={cert.recipient_name} />
                    <Field name="courseTitle" label="اسم البرنامج" defaultValue={cert.course_title} />
                    <Field name="honors" label="مرتبة الشرف" defaultValue={cert.honors ?? ""} />
                    <Field name="signatureName" label="اسم الموقّع" defaultValue={cert.signature_name ?? ""} />
                    <Field name="signatureTitle" label="صفة الموقّع" defaultValue={cert.signature_title ?? ""} />
                    <Field name="signatureUrl" label="رابط صورة التوقيع" defaultValue={cert.signature_url ?? ""} />
                    <label className="block text-xs font-black text-duo-muted">
                      قالب الشهادة
                      <select
                        name="template"
                        defaultValue={cert.template ?? "royal"}
                        className="mt-1 w-full rounded-xl border-2 border-duo-line bg-duo-ink px-3 py-2 text-sm font-bold text-duo-text"
                      >
                        {CERTIFICATE_TEMPLATES.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button type="submit" disabled={designMut.isPending} className="duo-btn text-sm">
                      حفظ التصميم
                    </button>
                  </form>
                ) : null}

                <div className="overflow-x-auto">
                  <CertificateSheet data={cert as CertificateData} />
                </div>
              </article>
            ))
          : null}

        {tab === "users" ? (
          <section className="duo-card space-y-3 p-5">
            <input
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="ابحث بالاسم…"
              className="w-full rounded-xl border-2 border-duo-line bg-duo-ink px-3 py-2 text-sm font-bold"
            />
            {userRows.map((user) => (
              <div key={user.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-duo-surface-2 p-3">
                <div>
                  <p className="text-sm font-black">{user.display_name || "بدون اسم"}</p>
                  <p className="text-xs text-duo-muted">{user.roles.join(", ") || "user"}</p>
                  {user.is_banned ? <p className="text-xs font-black text-duo-red">محظور: {user.ban_reason}</p> : null}
                </div>
                <button
                  type="button"
                  className="duo-btn duo-btn-ghost text-xs"
                  onClick={() =>
                    banMut.mutate({
                      userId: user.id,
                      banned: !user.is_banned,
                      reason: user.is_banned ? "" : window.prompt("سبب الحظر؟") || "مخالفة الشروط",
                    })
                  }
                >
                  <Ban className="h-4 w-4" /> {user.is_banned ? "رفع الحظر" : "حظر"}
                </button>
              </div>
            ))}
          </section>
        ) : null}

        {tab === "codes" ? (
          <section className="duo-card space-y-3 p-5">
            <h2 className="flex items-center gap-2 text-sm font-black">
              <KeyRound className="h-5 w-5" /> توليد أكواد تفعيل
            </h2>
            <div className="flex flex-wrap gap-2">
              <input
                value={codeProduct}
                onChange={(e) => setCodeProduct(e.target.value)}
                className="flex-1 rounded-xl border-2 border-duo-line bg-duo-ink px-3 py-2 text-sm font-mono"
              />
              <input
                type="number"
                min={1}
                max={50}
                value={codeCount}
                onChange={(e) => setCodeCount(Number(e.target.value))}
                className="w-24 rounded-xl border-2 border-duo-line bg-duo-ink px-3 py-2 text-sm font-bold"
              />
              <button type="button" className="duo-btn text-sm" onClick={() => codesMut.mutate()}>
                توليد
              </button>
            </div>
            <div className="space-y-1">
              {codeRows.map((row) => (
                <p key={row.code} className="rounded-lg bg-duo-surface-2 px-3 py-2 font-mono text-xs">
                  {row.code} — {row.product_id} {row.used_at ? "(مستخدم)" : ""}
                </p>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </DuoLayout>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-duo-surface-2 p-3">
      <p className="text-lg font-black text-duo-green">{value}</p>
      <p className="text-[11px] font-bold text-duo-muted">{label}</p>
    </div>
  );
}

function Field({ name, label, defaultValue }: { name: string; label: string; defaultValue: string }) {
  return (
    <label className="block text-xs font-bold text-duo-muted">
      {label}
      <input
        name={name}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-xl border-2 border-duo-line bg-duo-ink px-3 py-2 text-sm font-bold text-duo-text"
      />
    </label>
  );
}
