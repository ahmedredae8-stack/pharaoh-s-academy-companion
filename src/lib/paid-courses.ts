// The single flagship paid course shown on /courses.
import courseCover from "@/assets/course-cyber-range.jpg";

export type PaidCourse = {
  id: string;
  title: string;
  englishTitle: string;
  subtitle: string;
  level: string;
  hours: number;
  lessons: number;
  price: string;
  oldPrice?: string;
  badge: string;
  cover: string;
  highlights: string[];
  comingSoon: boolean;
};

export const FLAGSHIP_COURSE: PaidCourse = {
  id: "course_cyber_range",
  title: "فرعون سايبر رينج — معامل هجوم ودفاع حيّة",
  englishTitle: "Pharaoh Cyber Range",
  subtitle:
    "كورس واحد بمستوى المنصات العالمية: معامل محاكاة آمنة داخل المتصفح، أعلام (Flags)، تقارير حوادث، ومساعد ذكاء اصطناعي يبني لك تحديات جديدة باستمرار.",
  level: "مبتدئ → محترف",
  hours: 60,
  lessons: 120,
  price: "٢٩.٩٩$",
  oldPrice: "٥٩.٩٩$",
  badge: "قريبًا",
  cover: courseCover,
  highlights: [
    "معامل محاكاة آمنة 100% متوافقة مع سياسات Google Play",
    "نظام أعلام ونقاط وتلميحات مثل المنصات العالمية",
    "مساعد ذكاء اصطناعي يشرح ويولّد تحديات جديدة",
    "شهادة احترافية معتمدة بعد مراجعة الإدارة",
  ],
  comingSoon: true,
};

export const PAID_COURSES: PaidCourse[] = [FLAGSHIP_COURSE];
