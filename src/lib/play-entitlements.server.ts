import type { PlayPurchaseState } from "./play.server";

type ApplyArgs = {
  userId: string | null;
  purchaseToken: string;
  purchase: PlayPurchaseState;
  fallbackProductId?: string;
};

// Single source of truth for writing entitlements. Only ever called from
// server code after a successful Google Play verification.
export async function applyPlayPurchase({
  userId,
  purchaseToken,
  purchase,
  fallbackProductId,
}: ApplyArgs) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const productId = purchase.productId || fallbackProductId || "unknown";

  const { data: existing } = await supabaseAdmin
    .from("purchases")
    .select("user_id")
    .eq("purchase_token", purchaseToken)
    .maybeSingle();

  const ownerId = userId ?? existing?.user_id ?? null;

  // A token already claimed by another account cannot be re-claimed.
  if (userId && existing?.user_id && existing.user_id !== userId) {
    throw new Error("This purchase is already linked to another account");
  }

  await supabaseAdmin.from("purchases").upsert(
    {
      user_id: ownerId,
      platform: "google_play",
      product_id: productId,
      purchase_token: purchaseToken,
      order_id: purchase.orderId,
      state: purchase.status,
      expires_at: purchase.expiresAt,
      raw: purchase.raw as never,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "purchase_token" },
  );

  if (!ownerId) return { granted: false, productId, status: purchase.status };

  await supabaseAdmin.from("entitlements").upsert(
    {
      user_id: ownerId,
      product_id: productId,
      source: "google_play",
      status: purchase.status === "active" ? "active" : "inactive",
      expires_at: purchase.expiresAt,
      auto_renewing: purchase.autoRenewing,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,product_id" },
  );

  return { granted: purchase.status === "active", productId, status: purchase.status };
}