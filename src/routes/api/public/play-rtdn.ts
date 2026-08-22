import { createFileRoute } from "@tanstack/react-router";

// Google Play Real-time Developer Notifications (Pub/Sub push endpoint).
// Keeps entitlements in sync on renewal, cancellation, refund and grace period.
type PubSubEnvelope = {
  message?: { data?: string; messageId?: string };
};

type DeveloperNotification = {
  packageName?: string;
  subscriptionNotification?: { purchaseToken?: string; subscriptionId?: string };
  voidedPurchaseNotification?: { purchaseToken?: string };
  oneTimeProductNotification?: { purchaseToken?: string; sku?: string };
};

export const Route = createFileRoute("/api/public/play-rtdn")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["PLAY_RTDN_SECRET"];
        if (secret) {
          const provided = new URL(request.url).searchParams.get("token");
          if (provided !== secret) return new Response("Unauthorized", { status: 401 });
        }

        let notification: DeveloperNotification;
        try {
          const envelope = (await request.json()) as PubSubEnvelope;
          const encoded = envelope.message?.data;
          if (!encoded) return new Response("ok", { status: 200 });
          notification = JSON.parse(atob(encoded)) as DeveloperNotification;
        } catch {
          return new Response("Bad request", { status: 400 });
        }

        const { verifySubscription, verifyProductPurchase } = await import("@/lib/play.server");
        const { applyPlayPurchase } = await import("@/lib/play-entitlements.server");

        try {
          const sub = notification.subscriptionNotification;
          const oneTime = notification.oneTimeProductNotification;
          const voided = notification.voidedPurchaseNotification;

          if (sub?.purchaseToken) {
            const purchase = await verifySubscription(sub.purchaseToken);
            await applyPlayPurchase({
              userId: null,
              purchaseToken: sub.purchaseToken,
              purchase,
              ...(sub.subscriptionId ? { fallbackProductId: sub.subscriptionId } : {}),
            });
          } else if (oneTime?.purchaseToken && oneTime.sku) {
            const purchase = await verifyProductPurchase(oneTime.sku, oneTime.purchaseToken);
            await applyPlayPurchase({
              userId: null,
              purchaseToken: oneTime.purchaseToken,
              purchase,
              fallbackProductId: oneTime.sku,
            });
          } else if (voided?.purchaseToken) {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const { data: row } = await supabaseAdmin
              .from("purchases")
              .select("user_id, product_id")
              .eq("purchase_token", voided.purchaseToken)
              .maybeSingle();
            if (row?.user_id) {
              await supabaseAdmin
                .from("entitlements")
                .update({ status: "revoked", updated_at: new Date().toISOString() })
                .eq("user_id", row.user_id)
                .eq("product_id", row.product_id);
            }
            await supabaseAdmin
              .from("purchases")
              .update({ state: "voided" })
              .eq("purchase_token", voided.purchaseToken);
          }
        } catch (error) {
          console.error("play-rtdn handling failed:", error);
          // 500 makes Pub/Sub retry the notification.
          return new Response("Retry", { status: 500 });
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});