// Thin bridge to Google Play Billing when the app runs inside the Android
// (Capacitor) shell. On the web there is no Play Billing, so callers get a
// clear, catchable signal instead of a crash.
export class BillingUnavailableError extends Error {
  constructor() {
    super("Google Play Billing غير متاح خارج تطبيق أندرويد");
    this.name = "BillingUnavailableError";
  }
}

type NativePurchaseResult = { productId: string; purchaseToken: string };

type BillingPlugin = {
  purchase?: (options: { productId: string; type: string }) => Promise<NativePurchaseResult>;
  getPurchases?: () => Promise<{ purchases: NativePurchaseResult[] }>;
};

function getPlugin(): BillingPlugin | null {
  if (typeof window === "undefined") return null;
  const capacitor = (window as unknown as { Capacitor?: { Plugins?: Record<string, unknown> } })
    .Capacitor;
  const plugin = capacitor?.Plugins?.["InAppPurchase"] ?? capacitor?.Plugins?.["Purchases"];
  return (plugin as BillingPlugin | undefined) ?? null;
}

export function isNativeBillingAvailable(): boolean {
  return Boolean(getPlugin()?.purchase);
}

export async function launchNativePurchase(
  productId: string,
  kind: "subscription" | "one_time",
): Promise<NativePurchaseResult> {
  const plugin = getPlugin();
  if (!plugin?.purchase) throw new BillingUnavailableError();
  return plugin.purchase({ productId, type: kind === "subscription" ? "subs" : "inapp" });
}

export async function listNativePurchases(): Promise<NativePurchaseResult[]> {
  const plugin = getPlugin();
  if (!plugin?.getPurchases) return [];
  const result = await plugin.getPurchases();
  return result.purchases ?? [];
}