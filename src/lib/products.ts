// Client-safe product catalog. Product ids must match Google Play Console ids.
export type ProductId =
  | "pro_monthly"
  | "pro_yearly"
  | "lifetime"
  | "path_intermediate"
  | "path_upper_intermediate"
  | "path_advanced";

export type PathId = "beginner" | "intermediate" | "upperIntermediate" | "advanced";

export type Product = {
  id: ProductId;
  title: string;
  subtitle: string;
  price: string;
  kind: "subscription" | "one_time";
  highlight?: boolean;
};

export const PRODUCTS: Product[] = [
  {
    id: "pro_monthly",
    title: "Pro شهري",
    subtitle: "كل المسارات ومعامل غير محدودة",
    price: "٤.٩٩$ / شهر",
    kind: "subscription",
  },
  {
    id: "pro_yearly",
    title: "Pro سنوي",
    subtitle: "وفّر أكثر من 40% + شهادة إتمام",
    price: "٣٤.٩٩$ / سنة",
    kind: "subscription",
    highlight: true,
  },
  {
    id: "lifetime",
    title: "مدى الحياة",
    subtitle: "دفعة واحدة، وصول دائم لكل المحتوى",
    price: "٧٩.٩٩$",
    kind: "one_time",
  },
];

export const FREE_PATHS: PathId[] = ["beginner"];

export const PATH_PRODUCT: Record<Exclude<PathId, "beginner">, ProductId> = {
  intermediate: "path_intermediate",
  upperIntermediate: "path_upper_intermediate",
  advanced: "path_advanced",
};

export const PATH_LABELS: Record<PathId, string> = {
  beginner: "مسار الحارس المبتدئ",
  intermediate: "المسار المتوسط",
  upperIntermediate: "المسار فوق المتوسط",
  advanced: "المسار المتقدم",
};

export const PRO_PRODUCTS: ProductId[] = ["pro_monthly", "pro_yearly", "lifetime"];

export type Entitlement = {
  product_id: string;
  status: string;
  expires_at: string | null;
  source: string;
};

export function isActive(entitlement: Entitlement): boolean {
  if (entitlement.status !== "active") return false;
  if (!entitlement.expires_at) return true;
  return new Date(entitlement.expires_at).getTime() > Date.now();
}

export function hasPro(entitlements: Entitlement[]): boolean {
  return entitlements.some((e) => isActive(e) && PRO_PRODUCTS.includes(e.product_id as ProductId));
}

export function isPathUnlocked(entitlements: Entitlement[], pathId: PathId): boolean {
  if (FREE_PATHS.includes(pathId)) return true;
  if (hasPro(entitlements)) return true;
  const product = PATH_PRODUCT[pathId as Exclude<PathId, "beginner">];
  return entitlements.some((e) => isActive(e) && e.product_id === product);
}