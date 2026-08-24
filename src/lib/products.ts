// Client-safe product catalog. Product ids must match Google Play Console ids.
export type ProductId =
  | "pro_monthly"
  | "pro_quarterly"
  | "pro_yearly"
  | "lifetime"
  | "path_intermediate"
  | "path_upper_intermediate"
  | "path_advanced"
  | "course_cyber_range"
  | "certificate_official"
  | "labs_pack_10";

export type PathId = "beginner" | "intermediate" | "upperIntermediate" | "advanced";

export type Product = {
  id: ProductId;
  title: string;
  subtitle: string;
  price: string;
  kind: "subscription" | "one_time";
  highlight?: boolean;
};

/** كل معرفات المنتجات المطلوب إنشاؤها في Google Play Console (بنفس الترتيب والنوع). */
export const PLAY_PRODUCT_IDS: { id: ProductId; kind: "subscription" | "one_time"; label: string }[] = [
  { id: "pro_monthly", kind: "subscription", label: "اشتراك Pro شهري" },
  { id: "pro_quarterly", kind: "subscription", label: "اشتراك Pro ربع سنوي" },
  { id: "pro_yearly", kind: "subscription", label: "اشتراك Pro سنوي" },
  { id: "lifetime", kind: "one_time", label: "وصول مدى الحياة" },
  { id: "path_intermediate", kind: "one_time", label: "المسار المتوسط" },
  { id: "path_upper_intermediate", kind: "one_time", label: "المسار فوق المتوسط" },
  { id: "path_advanced", kind: "one_time", label: "المسار المتقدم" },
  { id: "course_cyber_range", kind: "one_time", label: "كورس Pharaoh Cyber Range" },
  { id: "certificate_official", kind: "one_time", label: "الشهادة الرسمية المعتمدة" },
  { id: "labs_pack_10", kind: "one_time", label: "باقة 10 معامل إضافية" },
];

export const PRODUCTS: Product[] = [
  {
    id: "pro_monthly",
    title: "Pro شهري",
    subtitle: "كل المسارات ومعامل غير محدودة",
    price: "٤.٩٩$ / شهر",
    kind: "subscription",
  },
  {
    id: "pro_quarterly",
    title: "Pro ربع سنوي",
    subtitle: "٣ شهور بسعر أقل مع كل المزايا",
    price: "١٢.٩٩$ / ٣ شهور",
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
  {
    id: "labs_pack_10",
    title: "باقة معامل إضافية",
    subtitle: "١٠ معامل محاكاة إضافية تُضاف لحسابك",
    price: "٦.٩٩$",
    kind: "one_time",
  },
];

/** منتج الشهادة الرسمية — يُشترى من داخل صفحة الشهادات. */
export const CERTIFICATE_PRODUCT: Product = {
  id: "certificate_official",
  title: "الشهادة الرسمية المعتمدة",
  subtitle: "شهادة احترافية موقّعة برقم تسلسلي قابل للتحقق",
  price: "٩.٩٩$",
  kind: "one_time",
};

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

export const PRO_PRODUCTS: ProductId[] = ["pro_monthly", "pro_quarterly", "pro_yearly", "lifetime"];

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

export function hasProduct(entitlements: Entitlement[], productId: ProductId): boolean {
  return entitlements.some((e) => isActive(e) && e.product_id === productId);
}

export function isPathUnlocked(entitlements: Entitlement[], pathId: PathId): boolean {
  if (FREE_PATHS.includes(pathId)) return true;
  if (hasPro(entitlements)) return true;
  const product = PATH_PRODUCT[pathId as Exclude<PathId, "beginner">];
  return entitlements.some((e) => isActive(e) && e.product_id === product);
}
