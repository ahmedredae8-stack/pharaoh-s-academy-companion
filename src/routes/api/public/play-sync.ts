import { createFileRoute } from "@tanstack/react-router";

// Temporary maintenance endpoint: verifies the Play service account and
// creates/updates the in-app products. Guarded by PLAY_RTDN_SECRET.
type Managed = { id: string; label: string; priceUsd: number };

const ONE_TIME: Managed[] = [
  { id: "lifetime", label: "Lifetime access", priceUsd: 79.99 },
  { id: "path_intermediate", label: "Intermediate path", priceUsd: 9.99 },
  { id: "path_upper_intermediate", label: "Upper intermediate path", priceUsd: 12.99 },
  { id: "path_advanced", label: "Advanced path", priceUsd: 14.99 },
  { id: "course_cyber_range", label: "Pharaoh Cyber Range course", priceUsd: 19.99 },
  { id: "certificate_official", label: "Official certificate", priceUsd: 9.99 },
  { id: "labs_pack_10", label: "10 extra labs pack", priceUsd: 6.99 },
];

async function api(token: string, path: string, init: RequestInit = {}) {
  const response = await fetch(`https://androidpublisher.googleapis.com/androidpublisher/v3/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "content-type": "application/json", ...(init.headers ?? {}) },
  });
  return { status: response.status, body: await response.text() };
}

export const Route = createFileRoute("/api/public/play-sync")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env["PLAY_RTDN_SECRET"];
        const url = new URL(request.url);
        if (!secret || url.searchParams.get("token") !== secret) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { getPlayAccessToken, readPackageName } = await import("@/lib/play.server");
        const packageName = readPackageName();
        let token: string;
        try {
          token = await getPlayAccessToken();
        } catch (error) {
          return Response.json({ step: "token", error: String(error) }, { status: 500 });
        }

        const results: Record<string, unknown> = {};
        results["list"] = await api(token, `applications/${encodeURIComponent(packageName)}/inappproducts`);

        if (url.searchParams.get("create") === "1") {
          const created: Record<string, unknown> = {};
          for (const product of ONE_TIME) {
            const payload = {
              packageName,
              sku: product.id,
              status: "active",
              purchaseType: "managedUser",
              defaultLanguage: "en-US",
              listings: { "en-US": { title: product.label, description: product.label } },
              defaultPrice: {
                priceMicros: String(Math.round(product.priceUsd * 1_000_000)),
                currency: "USD",
              },
            };
            const insert = await api(
              token,
              `applications/${encodeURIComponent(packageName)}/inappproducts?autoConvertMissingPrices=true`,
              { method: "POST", body: JSON.stringify(payload) },
            );
            created[product.id] =
              insert.status === 409 || insert.status === 400
                ? await api(
                    token,
                    `applications/${encodeURIComponent(packageName)}/inappproducts/${product.id}?autoConvertMissingPrices=true`,
                    { method: "PUT", body: JSON.stringify(payload) },
                  )
                : insert;
          }
          results["created"] = created;
        }

        return Response.json(results);
      },
    },
  },
});
