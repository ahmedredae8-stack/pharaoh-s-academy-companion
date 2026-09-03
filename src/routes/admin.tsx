import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Ban, Bell, KeyRound, PackageSearch, RefreshCw, ShieldCheck, Signature } from "lucide-react";
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
  adminListProducts,
  adminListPurchases,
  adminListRedeemCodes,
  adminListUsers,
  adminRefreshPurchase,
  adminSaveProduct,
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
  const listPurchases = useServerFn(adminListPurchases);
  const refreshPurchase = useServerFn(adminRefreshPurchase);
  const listProducts = useServerFn(adminListProducts);
  const saveProduct = useServerFn(adminSaveProduct);

  const [tab, setTab] = useState<"certs" | "issue" | "users" | "codes" | "play" | "products">("certs");
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
  const play = useQuery({
    queryKey: ["admin-play"],
    queryFn: () => listPurchases(),
    enabled: isAdmin && tab === "play",
    refetchInterval: tab === "play" ? 30_000 : false,
  });
  const products = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => listProducts(),
    enabled: isAdmin && tab === "products",
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

  const issueFn = useServerFn(adminIssueCertificate);
  const issueMut = useMutation({
    mutationFn: () => issueFn({ data: issueForm }),
    onSuccess: (result: any) => {
      toast.success(`تم إصدار الشهادة: ${result?.serial ?? ""}`);
      queryClient.invalidateQueries({ queryKey: ["admin-certs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
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

  const refreshPurchaseMut = useMutation({
    mutationFn: (purchaseToken: string) => refreshPurchase({ data: { purchaseToken } }),
    onSuccess: (result: any) => {
      toast.success(result?.granted ? "الاشتراك ما زال ساريًا" : "تم تحديث حالة الاشتراك");
      queryClient.invalidateQueries({ queryKey: ["admin-play"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const productMut = useMutation({
    mutationFn: (input: any) => saveProduct({ data: input }),
    onSuccess: () => {
      toast.success("تم حفظ بيانات المنتج");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
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
  const playData = (play.data ?? { purchases: [], entitlements: [] }) as {
    purchases: any[];
    entitlements: any[];
  };
  const productRows = (products.data ?? []) as any[];
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
                ["play", "إشعارات Play"],
                ["products", "إدارة المنتجات"],
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
                  <CertificateSheet data={cert as CertificateData} template={cert.template ?? "royal"} />
                </div>
              </article>
            ))
          : null}

        {tab === "issue" ? (
          <section className="duo-card space-y-4 p-5">
            <h2 className="text-base font-black">إصدار شهادة يدويًا</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <IssueField label="معرّف المستخدم (UUID)" value={issueForm.userId} onChange={(v) => setIssueForm((f) => ({ ...f, userId: v }))} />
              <IssueField label="اسم المتدرّب" value={issueForm.recipientName} onChange={(v) => setIssueForm((f) => ({ ...f, recipientName: v }))} />
              <IssueField label="اسم البرنامج" value={issueForm.courseTitle} onChange={(v) => setIssueForm((f) => ({ ...f, courseTitle: v }))} />
              <IssueField label="المسار" value={issueForm.pathId} onChange={(v) => setIssueForm((f) => ({ ...f, pathId: v }))} />
              <IssueField
                label="عدد الدروس"
                value={String(issueForm.lessonsCompleted)}
                onChange={(v) => setIssueForm((f) => ({ ...f, lessonsCompleted: Number(v) || 0 }))}
              />
              <IssueField
                label="المعدّل %"
                value={String(issueForm.quizAverage)}
                onChange={(v) => setIssueForm((f) => ({ ...f, quizAverage: Number(v) || 0 }))}
              />
              <IssueField label="مرتبة الشرف" value={issueForm.honors} onChange={(v) => setIssueForm((f) => ({ ...f, honors: v }))} />
              <IssueField label="اسم الموقّع" value={issueForm.signatureName} onChange={(v) => setIssueForm((f) => ({ ...f, signatureName: v }))} />
              <IssueField label="صفة الموقّع" value={issueForm.signatureTitle} onChange={(v) => setIssueForm((f) => ({ ...f, signatureTitle: v }))} />
              <IssueField label="رابط صورة التوقيع" value={issueForm.signatureUrl} onChange={(v) => setIssueForm((f) => ({ ...f, signatureUrl: v }))} />
              <label className="block text-xs font-black text-duo-muted">
                القالب
                <select
                  value={issueForm.template}
                  onChange={(e) => setIssueForm((f) => ({ ...f, template: e.target.value as CertificateTemplate }))}
                  className="mt-1 w-full rounded-xl border-2 border-duo-line bg-duo-ink px-3 py-2 text-sm font-bold text-duo-text"
                >
                  {CERTIFICATE_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-xs font-black text-duo-muted">
                <input
                  type="checkbox"
                  checked={issueForm.approve}
                  onChange={(e) => setIssueForm((f) => ({ ...f, approve: e.target.checked }))}
                />
                اعتماد فوري بدون مراجعة
              </label>
            </div>

            <button
              type="button"
              disabled={issueMut.isPending || !issueForm.userId || !issueForm.recipientName}
              onClick={() => issueMut.mutate()}
              className="duo-btn text-sm disabled:opacity-50"
            >
              إصدار الشهادة
            </button>

            <div className="overflow-x-auto">
              <CertificateSheet
                template={issueForm.template}
                data={{
                  serial: "PH-PREVIEW-0000",
                  recipient_name: issueForm.recipientName || "Trainee Name",
                  course_title: issueForm.courseTitle,
                  path_id: issueForm.pathId,
                  lessons_completed: issueForm.lessonsCompleted,
                  quiz_average: issueForm.quizAverage,
                  issued_at: new Date().toISOString(),
                  honors: issueForm.honors,
                  signature_name: issueForm.signatureName,
                  signature_title: issueForm.signatureTitle,
                  signature_url: issueForm.signatureUrl,
                } as CertificateData}
              />
            </div>
          </section>
        ) : null}


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


        {tab === "play" ? (
          <section className="duo-card space-y-4 p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-black">
                <Bell className="h-5 w-5 text-duo-yellow" /> إشعارات اشتراكات Google Play
              </h2>
              <button
                type="button"
                className="duo-btn duo-btn-ghost text-xs"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-play"] })}
              >
                <RefreshCw className="h-4 w-4" /> تحديث
              </button>
            </div>
            <p className="text-xs text-duo-muted">
              تُحدَّث القائمة تلقائيًا كل 30 ثانية وتصل إشعارات Play اللحظية على نقطة الاستقبال الخاصة بالتطبيق.
            </p>

            <div className="space-y-2">
              {playData.purchases.length === 0 ? (
                <p className="rounded-xl bg-duo-surface-2 p-4 text-center text-xs text-duo-muted">لا توجد عمليات شراء بعد.</p>
              ) : null}
              {playData.purchases.map((row) => {
                const expired = row.expires_at ? new Date(row.expires_at).getTime() < Date.now() : false;
                return (
                  <div key={row.purchase_token} className="space-y-1 rounded-xl bg-duo-surface-2 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-black">{row.product_id}</p>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-black ${
                          row.state === "active" && !expired ? "bg-duo-green/20 text-duo-green" : "bg-duo-red/20 text-duo-red"
                        }`}
                      >
                        {expired ? "منتهي" : row.state}
                      </span>
                    </div>
                    <p className="text-[11px] text-duo-muted">
                      {row.expires_at ? `ينتهي: ${new Date(row.expires_at).toLocaleString("ar-EG")}` : "شراء لمرة واحدة"}
                    </p>
                    <p className="font-mono text-[10px] text-duo-muted">{row.purchase_token.slice(0, 28)}…</p>
                    <button
                      type="button"
                      className="duo-btn duo-btn-ghost text-[11px]"
                      disabled={refreshPurchaseMut.isPending}
                      onClick={() => refreshPurchaseMut.mutate(row.purchase_token)}
                    >
                      <RefreshCw className="h-3 w-3" /> إعادة التحقق من Google
                    </button>
                  </div>
                );
              })}
            </div>

            <h3 className="text-sm font-black">الصلاحيات النشطة</h3>
            <div className="space-y-1">
              {playData.entitlements.map((row) => (
                <p key={`${row.user_id}-${row.product_id}`} className="rounded-lg bg-duo-surface-2 px-3 py-2 text-xs font-bold">
                  {row.product_id} — {row.status}
                  {row.expires_at ? ` حتى ${new Date(row.expires_at).toLocaleDateString("ar-EG")}` : ""}
                </p>
              ))}
            </div>
          </section>
        ) : null}

        {tab === "products" ? (
          <section className="duo-card space-y-4 p-5">
            <h2 className="flex items-center gap-2 text-sm font-black">
              <PackageSearch className="h-5 w-5 text-duo-blue" /> إدارة المنتجات والأسعار
            </h2>
            <p className="text-xs text-duo-muted">
              الأسعار المحفوظة هنا تُستخدم تلقائيًا عند فتح شاشات الشراء داخل التطبيق ومزامنتها مع معرفات متجر Play.
            </p>

            {productRows.map((product) => (
              <form
                key={product.id ?? product.product_id}
                className="grid gap-2 rounded-2xl bg-duo-surface-2 p-4 sm:grid-cols-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  productMut.mutate({
                    id: product.id,
                    productId: String(form.get("productId") ?? ""),
                    title: String(form.get("title") ?? ""),
                    description: String(form.get("description") ?? ""),
                    priceCents: Number(form.get("price") ?? 0) * 100,
                    currency: String(form.get("currency") ?? "USD"),
                    kind: product.kind === "subscription" ? "subscription" : "one_time",
                    provider: product.provider ?? "google_play",
                    active: form.get("active") === "on",
                  });
                }}
              >
                <Field name="productId" label="معرّف Play" defaultValue={product.product_id} />
                <Field name="title" label="الاسم" defaultValue={product.title} />
                <Field name="description" label="الوصف" defaultValue={product.description ?? ""} />
                <Field name="price" label="السعر (بالدولار)" defaultValue={String((product.price_cents ?? 0) / 100)} />
                <Field name="currency" label="العملة" defaultValue={product.currency ?? "USD"} />
                <label className="flex items-center gap-2 self-end text-xs font-black text-duo-muted">
                  <input type="checkbox" name="active" defaultChecked={product.active !== false} /> مُفعّل في المتجر
                </label>
                <button type="submit" disabled={productMut.isPending} className="duo-btn text-sm sm:col-span-2">
                  حفظ المنتج
                </button>
              </form>
            ))}

            <form
              className="grid gap-2 rounded-2xl border-2 border-dashed border-duo-line p-4 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                productMut.mutate({
                  productId: String(form.get("productId") ?? ""),
                  title: String(form.get("title") ?? ""),
                  description: String(form.get("description") ?? ""),
                  priceCents: Number(form.get("price") ?? 0) * 100,
                  currency: String(form.get("currency") ?? "USD"),
                  kind: String(form.get("kind") ?? "one_time") === "subscription" ? "subscription" : "one_time",
                  provider: "google_play",
                  active: true,
                });
                event.currentTarget.reset();
              }}
            >
              <p className="text-xs font-black text-duo-muted sm:col-span-2">إضافة منتج جديد</p>
              <Field name="productId" label="معرّف Play" defaultValue="certificate_official" />
              <Field name="title" label="الاسم" defaultValue="" />
              <Field name="description" label="الوصف" defaultValue="" />
              <Field name="price" label="السعر (بالدولار)" defaultValue="9.99" />
              <Field name="currency" label="العملة" defaultValue="USD" />
              <label className="block text-xs font-black text-duo-muted">
                النوع
                <select
                  name="kind"
                  defaultValue="one_time"
                  className="mt-1 w-full rounded-xl border-2 border-duo-line bg-duo-ink px-3 py-2 text-sm font-bold text-duo-text"
                >
                  <option value="one_time">شراء لمرة واحدة</option>
                  <option value="subscription">اشتراك</option>
                </select>
              </label>
              <button type="submit" className="duo-btn text-sm sm:col-span-2">
                إضافة
              </button>
            </form>
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

function IssueField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-xs font-black text-duo-muted">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border-2 border-duo-line bg-duo-ink px-3 py-2 text-sm font-bold text-duo-text"
      />
    </label>
  );
}
