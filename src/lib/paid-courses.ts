// Paid course catalog shown as cards on /courses.
export type PaidCourse = {
  id: string;
  title: string;
  subtitle: string;
  level: string;
  hours: number;
  lessons: number;
  price: string;
  oldPrice?: string;
  badge?: string;
  emoji: string;
};

export const PAID_COURSES: PaidCourse[] = [
  {
    id: "soc-analyst",
    title: "محلل مركز عمليات أمنية (SOC L1)",
    subtitle: "تحليل السجلات، SIEM، والتعامل مع الحوادث خطوة بخطوة.",
    level: "مبتدئ → متوسط",
    hours: 28,
    lessons: 42,
    price: "٢٤.٩٩$",
    oldPrice: "٤٩.٩٩$",
    badge: "الأكثر طلبًا",
    emoji: "🛡️",
  },
  {
    id: "network-security",
    title: "أساسيات أمن الشبكات",
    subtitle: "TCP/IP، الجدران النارية، اكتشاف التسلل ومعمل منزلي كامل.",
    level: "مبتدئ",
    hours: 18,
    lessons: 30,
    price: "١٩.٩٩$",
    emoji: "🌐",
  },
  {
    id: "ethical-hacking",
    title: "الاختراق الأخلاقي العملي",
    subtitle: "استطلاع، استغلال ثغرات الويب، وتقرير اختبار اختراق حقيقي.",
    level: "متوسط",
    hours: 32,
    lessons: 48,
    price: "٢٩.٩٩$",
    oldPrice: "٥٩.٩٩$",
    emoji: "🐉",
  },
  {
    id: "digital-forensics",
    title: "التحليل الجنائي الرقمي",
    subtitle: "استخراج الأدلة من الأقراص والذاكرة وبناء الخط الزمني للحادث.",
    level: "متوسط → متقدم",
    hours: 24,
    lessons: 36,
    price: "٢٧.٩٩$",
    emoji: "🔎",
  },
  {
    id: "cloud-security",
    title: "أمن السحابة",
    subtitle: "تأمين الهوية والصلاحيات والحاويات على البيئات السحابية.",
    level: "متقدم",
    hours: 22,
    lessons: 34,
    price: "٣٤.٩٩$",
    badge: "جديد",
    emoji: "☁️",
  },
  {
    id: "malware-analysis",
    title: "تحليل البرمجيات الخبيثة",
    subtitle: "تحليل ساكن وديناميكي داخل بيئة معزولة آمنة.",
    level: "متقدم",
    hours: 26,
    lessons: 38,
    price: "٣٩.٩٩$",
    emoji: "🦠",
  },
];
