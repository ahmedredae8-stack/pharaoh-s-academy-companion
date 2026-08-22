import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const verifySchema = z.object({
  productId: z.string().min(1).max(128),
  purchaseToken: z.string().min(10).max(4096),
  kind: z.enum(["subscription", "one_time"]),
});

// The client never grants anything: it only hands the receipt to the server,
// which verifies it against Google Play before writing an entitlement.
export const verifyPlayPurchase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => verifySchema.parse(input))
  .handler(async ({ data, context }) => {
    const { verifySubscription, verifyProductPurchase } = await import("./play.server");
    const { applyPlayPurchase } = await import("./play-entitlements.server");

    const purchase =
      data.kind === "subscription"
        ? await verifySubscription(data.purchaseToken)
        : await verifyProductPurchase(data.productId, data.purchaseToken);

    return applyPlayPurchase({
      userId: context.userId,
      purchaseToken: data.purchaseToken,
      purchase,
      fallbackProductId: data.productId,
    });
  });

// Re-checks every receipt already linked to this account (device change / restore).
export const restorePurchases = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { verifySubscription, verifyProductPurchase } = await import("./play.server");
    const { applyPlayPurchase } = await import("./play-entitlements.server");

    const { data: rows } = await context.supabase
      .from("purchases")
      .select("product_id, purchase_token, expires_at")
      .eq("user_id", context.userId);

    let restored = 0;
    for (const row of rows ?? []) {
      try {
        const purchase = row.expires_at
          ? await verifySubscription(row.purchase_token)
          : await verifyProductPurchase(row.product_id, row.purchase_token);
        const result = await applyPlayPurchase({
          userId: context.userId,
          purchaseToken: row.purchase_token,
          purchase,
          fallbackProductId: row.product_id,
        });
        if (result.granted) restored++;
      } catch (error) {
        console.error("restorePurchases failed for a receipt:", error);
      }
    }
    return { restored };
  });