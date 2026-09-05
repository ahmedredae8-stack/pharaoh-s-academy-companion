import { createFileRoute } from "@tanstack/react-router";

// Maintenance endpoint: verifies the Play service account and creates /
// updates the store products with the new Play publishing API.
// Guarded by PLAY_RTDN_SECRET.
const REGIONS_VERSION = "2022/02";

type Money = { currencyCode: string; units?: string; nanos?: number };

const ONE_TIME: { id: string; title: string; description: string; usd: number }[] = [
  { id: "lifetime", title: "Lifetime Access", description: "One payment, permanent access to all learning paths.", usd: 79.99 },
  { id: "path_intermediate", title: "Intermediate Path", description: "Unlock the intermediate cybersecurity path.", usd: 9.99 },
  { id: "path_upper_intermediate", title: "Upper Intermediate Path", description: "Unlock the upper intermediate cybersecurity path.", usd: 12.99 },
  { id: "path_advanced", title: "Advanced Path", description: "Unlock the advanced cybersecurity path.", usd: 14.99 },
  { id: "course_cyber_range", title: "Pharaoh Cyber Range", description: "Hands-on labs course with AI guidance.", usd: 19.99 },
  { id: "certificate_official", title: "Official Certificate", description: "Signed certificate with a verifiable serial number.", usd: 9.99 },
  { id: "labs_pack_10", title: "10 Extra Labs", description: "Adds 10 extra simulation labs to your account.", usd: 6.99 },
];

const SUBSCRIPTIONS: { id: string; basePlanId: string; title: string; period: string; usd: number }[] = [
  { id: "pro_monthly", basePlanId: "monthly", title: "Pharaoh Pro Monthly", period: "P1M", usd: 4.99 },
  { id: "pro_quarterly", basePlanId: "quarterly", title: "Pharaoh Pro Quarterly", period: "P3M", usd: 12.99 },
  { id: "pro_yearly", basePlanId: "yearly", title: "Pharaoh Pro Yearly", period: "P1Y", usd: 34.99 },
];

function money(usd: number): Money {
  return { currencyCode: "USD", units: String(Math.floor(usd)), nanos: Math.round((usd % 1) * 1e9) };
}


function badRegion(body: unknown): string | null {
  const message = typeof body === "object" && body !== null ? (body as { error?: { message?: string } }).error?.message ?? "" : String(body);
  const match = /region code ([A-Z]{2})/i.exec(message);
  return match?.[1] ?? null;
}

async function withRegionRetry(
  send: (regions: { regionCode: string; price: Money }[]) => Promise<{ status: number; body: unknown }>,
  regions: { regionCode: string; price: Money }[],
) {
  let current = regions;
  const dropped: string[] = [];
  for (let attempt = 0; attempt < 60; attempt++) {
    const result = await send(current);
    if (result.status < 300) return { ...result, dropped };
    const region = badRegion(result.body);
    if (!region) return { ...result, dropped };
    dropped.push(region);
    current = current.filter((r) => r.regionCode !== region);
  }
  return { status: 400, body: "too many region errors", dropped };
}

async function api(token: string, path: string, init: RequestInit = {}) {
  const response = await fetch(`https://androidpublisher.googleapis.com/androidpublisher/v3/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "content-type": "application/json", ...(init.headers ?? {}) },
  });
  const body = await response.text();
  let parsed: unknown = body;
  try {
    parsed = JSON.parse(body);
  } catch {
    /* keep raw */
  }
  return { status: response.status, body: parsed };
}

async function convertPrices(token: string, pkg: string, usd: number) {
  const result = await api(token, `applications/${pkg}/pricing:convertRegionPrices`, {
    method: "POST",
    body: JSON.stringify({ price: money(usd) }),
  });
  const data = result.body as {
    convertedRegionPrices?: Record<string, { regionCode?: string; price?: Money }>;
    convertedOtherRegionsPrice?: { usdPrice?: Money; eurPrice?: Money };
  };
  const regions = Object.entries(data.convertedRegionPrices ?? {}).map(([regionCode, value]) => ({
    regionCode: value.regionCode ?? regionCode,
    price: value.price!,
  }));
  return { regions, other: data.convertedOtherRegionsPrice, error: regions.length ? null : result };
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
        const pkg = encodeURIComponent(readPackageName());
        let token: string;
        try {
          token = await getPlayAccessToken();
        } catch (error) {
          return Response.json({ step: "token", error: String(error) }, { status: 500 });
        }

        const results: Record<string, unknown> = {};
        const rv = url.searchParams.get("rv") ?? REGIONS_VERSION;

        if (url.searchParams.get("probe") === "1") {
          const probe: Record<string, unknown> = {};
          probe["patch-lower"] = await api(token, `applications/${pkg}/onetimeproducts/probe_x?allowMissing=true&regionsVersion.version=${rv}`, { method: "PATCH", body: "{}" });
          probe["skip1"] = await api(token, `applications/${pkg}/oneTimeProducts/probe_x`, { method: "PATCH", body: "{}" });
          probe["patch-camel-mask"] = await api(token, `applications/${pkg}/oneTimeProducts/probe_x?allowMissing=true&updateMask=listings&regionsVersion.version=${rv}`, { method: "PATCH", body: "{}" });
          probe["sub-rv"] = await api(token, `applications/${pkg}/subscriptions?productId=probe_x&regionsVersion.version=${rv}`, { method: "POST", body: "{}" });
          return Response.json(probe);
        }

        if (url.searchParams.get("create") === "1") {
          const oneTime: Record<string, unknown> = {};
          for (const product of ONE_TIME) {
            const priced = await convertPrices(token, pkg, product.usd);
            if (priced.error) {
              oneTime[product.id] = { step: "convertRegionPrices", ...priced.error };
              continue;
            }
            oneTime[product.id] = await withRegionRetry(
              (regions) =>
                api(
                  token,
                  `applications/${pkg}/onetimeproducts/${product.id}?allowMissing=true&updateMask=listings,purchaseOptions&regionsVersion.version=${rv}`,
                  {
                    method: "PATCH",
                    body: JSON.stringify({
                      packageName: readPackageName(),
                      productId: product.id,
                      listings: [
                        { languageCode: "en-US", title: product.title, description: product.description },
                      ],
                      purchaseOptions: [
                        {
                          purchaseOptionId: "default",
                          buyOption: { legacyCompatible: true, multiQuantityEnabled: false },
                          regionalPricingAndAvailabilityConfigs: regions.map((r) => ({
                            regionCode: r.regionCode,
                            price: r.price,
                            availability: "AVAILABLE",
                          })),
                          newRegionsConfig: {
                            availability: "AVAILABLE",
                            usdPrice: priced.other?.usdPrice ?? money(product.usd),
                            eurPrice: priced.other?.eurPrice ?? money(product.usd),
                          },
                        },
                      ],
                    }),
                  },
                ),
              priced.regions,
            );
          }
          results["oneTimeCreated"] = oneTime;

          const subs: Record<string, unknown> = {};
          for (const sub of SUBSCRIPTIONS) {
            const priced = await convertPrices(token, pkg, sub.usd);
            if (priced.error) {
              subs[sub.id] = { step: "convertRegionPrices", ...priced.error };
              continue;
            }
            const created = await withRegionRetry(
              (regions) =>
                api(token, `applications/${pkg}/subscriptions?productId=${sub.id}&regionsVersion.version=${rv}`, {
                  method: "POST",
                  body: JSON.stringify({
                    packageName: readPackageName(),
                    productId: sub.id,
                    listings: [
                      { languageCode: "en-US", title: sub.title, benefits: ["All learning paths", "Unlimited labs"] },
                    ],
                    basePlans: [
                      {
                        basePlanId: sub.basePlanId,
                        autoRenewingBasePlanType: { billingPeriodDuration: sub.period, gracePeriodDuration: "P7D" },
                        regionalConfigs: regions.map((r) => ({
                          regionCode: r.regionCode,
                          price: r.price,
                          newSubscriberAvailability: true,
                        })),
                        otherRegionsConfig: {
                          usdPrice: priced.other?.usdPrice ?? money(sub.usd),
                          eurPrice: priced.other?.eurPrice ?? money(sub.usd),
                          newSubscriberAvailability: true,
                        },
                      },
                    ],
                  }),
                }),
              priced.regions,
            );
            const activated =
              created.status < 300
                ? await api(
                    token,
                    `applications/${pkg}/subscriptions/${sub.id}/basePlans/${sub.basePlanId}:activate`,
                    {
                      method: "POST",
                      body: JSON.stringify({
                        packageName: readPackageName(),
                        productId: sub.id,
                        basePlanId: sub.basePlanId,
                      }),
                    },
                  )
                : null;
            subs[sub.id] = { created, activated };
          }
          results["subscriptionsCreated"] = subs;
        }

        results["oneTime"] = await api(token, `applications/${pkg}/onetimeproducts`);
        results["subscriptions"] = await api(token, `applications/${pkg}/subscriptions`);
        return Response.json(results);
      },
    },
  },
});
