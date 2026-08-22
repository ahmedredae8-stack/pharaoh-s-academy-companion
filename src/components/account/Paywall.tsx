import { useState } from "react";
import { toast } from "sonner";

import { verifyPlayPurchase, restorePurchases } from "@/lib/billing.functions";
import { BillingUnavailableError, launchNativePurchase } from "@/lib/native-billing";
import { PATH_LABELS, PRODUCTS, type PathId } from "@/lib/products";

import { useAccount } from "./AccountProvider";

type Props = {
  pathId: PathId | null;
  onClose: () => void;
  onRequireAuth: () => void;
};

export function Paywall({ pathId, onClose, onRequireAuth }: Props) {
  const { session, refresh } = useAccount();
  const [busy, setBusy] = useState<string | null>(null);

  if (!pathId) return null;

  async function buy(productId: string, kind: "subscription" | "one_time") {
    if (!session) {
      onRequireAuth();
      return;
    }
    setBusy(productId);
    try {
      const result = await launchNativePurchase(productId, kind);
      await verifyPlayPurchase({
        data: { productId: result.productId || productId, purchaseToken: result.purchaseToken, kind },
      });
      await refresh();
      toast.success("تم تفعيل اشتراكك بنجاح");
      onClose();
    } catch (error) {
      if (error instanceof BillingUnavailableError) {
        toast.info("الشراء متاح داخل تطبيق أندرويد من متجر Google Play");
      } else {
        console.error(error);
        toast.error("تعذّر إتمام العملية، حاول مرة أخرى");
      }
    } finally {
      setBusy(null);
    }
  }

  async function restore() {
    if (!session) {
      onRequireAuth();
      return;
    }
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
    <div
      dir="rtl"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur"
    >
      <div className="duo-card w-full max-w-md p-6">
        <img src="/mascot.png" alt="" className="mx-auto h-20 w-20 object-contain" />
        <h2 className="mt-2 text-center text-xl font-black text-duo-text">
          افتح {PATH_LABELS[pathId]}
        </h2>
        <p className="mt-2 text-center text-sm font-bold text-duo-muted">
          اشترك للوصول لكل المسارات والمعامل بلا حدود، بدون إعلانات، مع شهادة إتمام.
        </p>
        <p className="mt-2 text-center text-[11px] font-bold text-duo-muted">
          الدفع عبر Google Play فقط
        </p>

        <div className="mt-5 space-y-3">
          {PRODUCTS.map((product) => (
            <button
              key={product.id}
              disabled={busy !== null}
              onClick={() => void buy(product.id, product.kind)}
              className={`w-full rounded-2xl border-2 p-4 text-right transition disabled:opacity-50 ${
                product.highlight
                  ? "border-duo-yellow bg-duo-surface-2"
                  : "border-duo-line hover:border-duo-yellow"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-duo-text">{product.title}</span>
                <span className="text-sm font-black text-duo-blue">{product.price}</span>
              </div>
              <p className="mt-1 text-xs font-bold text-duo-muted">{product.subtitle}</p>
            </button>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between text-sm font-bold">
          <button onClick={() => void restore()} className="text-duo-blue underline">
            استرجاع المشتريات
          </button>
          <button onClick={onClose} className="text-duo-muted hover:text-duo-text">
            لاحقًا
          </button>
        </div>
      </div>
    </div>
  );
}