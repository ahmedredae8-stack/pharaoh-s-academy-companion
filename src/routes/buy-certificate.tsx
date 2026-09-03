import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { BadgeCheck, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useAccount } from "@/components/account/AccountProvider";
import { DuoLayout } from "@/components/duo/DuoLayout";
import { restorePurchases, verifyPlayPurchase } from "@/lib/billing.functions";
import { BillingUnavailableError, launchNativePurchase } from "@/lib/native-billing";
import { CERTIFICATE_PRODUCT, hasProduct } from "@/lib/products";

export const Route = createFileRoute("/buy-certificate")({
  head: () => ({
    meta: [
      { title: "شراء الشهادة الرسمية — فرعون Ai" },
      {
        name: "description",
        content: "افتح شراء الشهادة الرسمية المعتمدة عبر Google Play وفعّلها فورًا على حسابك في فرعون Ai.",
      },
      { property: "og:title", content: "شراء الشهادة الرسمية — فرعون Ai" },
      {
        property: "og:description",
        content: "شهادة احترافية موقّعة برقم تسلسلي قابل للتحقق، تُفعّل تلقائيًا بعد الدفع عبر Google Play.",
      },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BuyCertificatePage,
});

const BENEFITS = [
  "شهادة PDF احترافية بثلاثة قوالب رسمية",
  "رقم تسلسلي فريد قابل للتحقق من صفحة /verify",
  "توقيع رسمي معتمد من إدارة المنصة",
  "مراجعة سريعة من فريق الإدارة قبل الاعتماد",
];

function BuyCertificatePage() {
  const { session, entitlements, refresh } = useAccount();
  const router = useRouter();
  const [busy, setBusy] = useState<"buy" | "restore" | null>(null);

  const owned = hasProduct(entitlements ?? [], CERTIFICATE_PRODUCT.id);

  async function buy() {
    if (!session) {
      void router.navigate({ to: "/auth", search: { redirect: "/buy-certificate" } as never });
      return;
    }
    setBusy("buy");
    try {
      const result = await launchNativePurchase(CERTIFICATE_PRODUCT.id, "one_time");
      // الخادم وحده يتحقق من الإيصال ويكتب الاشتراك في قاعدة البيانات.
      await verifyPlayPurchase({
        data: {
          productId: result.productId || CERTIFICATE_PRODUCT.id,
          purchaseToken: result.purchaseToken,
          kind: "one_time",
        },
      });
      await refresh();
      toast.success("تم تفعيل الشهادة على حسابك");
    } catch (error) {
      if (error instanceof BillingUnavailableError) {
        toast.info("الشراء متاح داخل تطبيق أندرويد من متجر Google Play");
      } else {
        console.error(error);
        toast.error("تعذّر إتمام الشراء، حاول مرة أخرى");
      }
    } finally {
      setBusy(null);
    }
  }

  async function restore() {
    if (!session) return;
    setBusy("restore");
    try {
      const { restored } = await restorePurchases();
      await refresh();
      toast.success(restored ? `تم استرجاع ${restored} عملية شراء` : "لا توجد مشتريات لاسترجاعها");
    } catch {
      toast.error("تعذّر الاسترجاع الآن");
    } finally {
      setBusy(null);
    }
  }

  return (
    <DuoLayout>
      <div className="space-y-4">
        <header className="duo-card space-y-2 p-6 text-center">
          <BadgeCheck className="mx-auto h-12 w-12 text-duo-yellow" />
          <h1 className="text-2xl font-black">{CERTIFICATE_PRODUCT.title}</h1>
          <p className="text-sm text-duo-muted">{CERTIFICATE_PRODUCT.subtitle}</p>
          <p className="text-xl font-black text-duo-green">{CERTIFICATE_PRODUCT.price}</p>
        </header>

        <section className="duo-card space-y-2 p-5">
          <h2 className="flex items-center gap-2 text-sm font-black">
            <Sparkles className="h-5 w-5 text-duo-yellow" /> ماذا تحصل عليه
          </h2>
          <ul className="space-y-2 text-sm text-duo-muted">
            {BENEFITS.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-duo-green" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="duo-card space-y-3 p-5">
          {owned ? (
            <>
              <p className="text-sm font-black text-duo-green">الشهادة مفعّلة بالفعل على حسابك.</p>
              <Link to="/certificates" className="duo-btn inline-flex text-sm">
                اذهب إلى شهاداتي
              </Link>
            </>
          ) : (
            <button type="button" onClick={buy} disabled={busy !== null} className="duo-btn w-full disabled:opacity-50">
              {busy === "buy" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              الشراء عبر Google Play
            </button>
          )}

          <button
            type="button"
            onClick={restore}
            disabled={busy !== null || !session}
            className="duo-btn duo-btn-ghost w-full text-sm disabled:opacity-50"
          >
            استرجاع المشتريات
          </button>

          <p className="text-[11px] leading-5 text-duo-muted">
            تتم كل عمليات الدفع عبر Google Play داخل تطبيق أندرويد. يتحقق الخادم من الإيصال لدى Google قبل تفعيل أي
            صلاحية، ولا يمنح التطبيق أي وصول من جهة العميل.
          </p>
        </section>
      </div>
    </DuoLayout>
  );
}
