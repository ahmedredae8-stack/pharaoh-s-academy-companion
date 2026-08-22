// Google Play Developer API client (Worker-compatible: WebCrypto + fetch only).
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/androidpublisher";

type ServiceAccount = { client_email: string; private_key: string };

export type PlayPurchaseState = {
  productId: string;
  status: "active" | "expired" | "canceled" | "pending" | "revoked";
  expiresAt: string | null;
  autoRenewing: boolean;
  orderId: string | null;
  raw: unknown;
};

function readServiceAccount(): ServiceAccount {
  const raw = process.env["PLAY_SERVICE_ACCOUNT_JSON"];
  if (!raw) throw new Error("PLAY_SERVICE_ACCOUNT_JSON is not configured");
  const parsed = JSON.parse(raw) as ServiceAccount;
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("PLAY_SERVICE_ACCOUNT_JSON is missing client_email/private_key");
  }
  return parsed;
}

export function readPackageName(): string {
  const name = process.env["PLAY_PACKAGE_NAME"];
  if (!name) throw new Error("PLAY_PACKAGE_NAME is not configured");
  return name;
}

function base64url(input: ArrayBuffer | string): string {
  const bytes =
    typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const body = pem
    .replace(/\\n/g, "\n")
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return crypto.subtle.importKey(
    "pkcs8",
    bytes.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

let cachedToken: { value: string; expiresAt: number } | undefined;

export async function getPlayAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  const account = readServiceAccount();
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: account.client_email,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );
  const key = await importPrivateKey(account.private_key);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(`${header}.${claims}`),
  );
  const assertion = `${header}.${claims}.${base64url(signature)}`;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!response.ok) {
    throw new Error(`Google token request failed [${response.status}]: ${await response.text()}`);
  }
  const payload = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: payload.access_token,
    expiresAt: Date.now() + payload.expires_in * 1000,
  };
  return payload.access_token;
}

async function playFetch(path: string): Promise<unknown> {
  const token = await getPlayAccessToken();
  const response = await fetch(`https://androidpublisher.googleapis.com/androidpublisher/v3/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Play API failed [${response.status}]: ${await response.text()}`);
  }
  return response.json();
}

type SubscriptionV2 = {
  subscriptionState?: string;
  latestOrderId?: string;
  lineItems?: Array<{
    productId?: string;
    expiryTime?: string;
    autoRenewingPlan?: { autoRenewEnabled?: boolean };
  }>;
};

export async function verifySubscription(purchaseToken: string): Promise<PlayPurchaseState> {
  const packageName = readPackageName();
  const data = (await playFetch(
    `applications/${encodeURIComponent(packageName)}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`,
  )) as SubscriptionV2;

  const line = data.lineItems?.[0];
  const state = data.subscriptionState ?? "SUBSCRIPTION_STATE_UNSPECIFIED";
  const expiresAt = line?.expiryTime ?? null;
  const activeStates = [
    "SUBSCRIPTION_STATE_ACTIVE",
    "SUBSCRIPTION_STATE_IN_GRACE_PERIOD",
    "SUBSCRIPTION_STATE_CANCELED", // still usable until expiry
  ];
  const stillValid = expiresAt ? new Date(expiresAt).getTime() > Date.now() : false;

  return {
    productId: line?.productId ?? "",
    status:
      state === "SUBSCRIPTION_STATE_PENDING"
        ? "pending"
        : state === "SUBSCRIPTION_STATE_EXPIRED" || !stillValid
          ? "expired"
          : activeStates.includes(state)
            ? "active"
            : "revoked",
    expiresAt,
    autoRenewing: Boolean(line?.autoRenewingPlan?.autoRenewEnabled),
    orderId: data.latestOrderId ?? null,
    raw: data,
  };
}

type ProductPurchase = {
  purchaseState?: number; // 0 purchased, 1 canceled, 2 pending
  orderId?: string;
};

export async function verifyProductPurchase(
  productId: string,
  purchaseToken: string,
): Promise<PlayPurchaseState> {
  const packageName = readPackageName();
  const data = (await playFetch(
    `applications/${encodeURIComponent(packageName)}/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`,
  )) as ProductPurchase;

  return {
    productId,
    status: data.purchaseState === 0 ? "active" : data.purchaseState === 2 ? "pending" : "canceled",
    expiresAt: null,
    autoRenewing: false,
    orderId: data.orderId ?? null,
    raw: data,
  };
}