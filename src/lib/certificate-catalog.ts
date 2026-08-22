import type { PathId } from "./products";

/** عدد الدروس في كل مسار (مطابق لمحرّك الدروس). */
export const LESSON_COUNTS: Record<PathId, number> = {
  beginner: 16,
  intermediate: 14,
  upperIntermediate: 12,
  advanced: 11,
};

/** العنوان الرسمي الذي يُطبع على الشهادة لكل مسار. */
export const PATH_CERT_TITLES: Record<PathId, string> = {
  beginner: "أساسيات الأمن السيبراني — الحارس المبتدئ",
  intermediate: "الأمن السيبراني التطبيقي — المستوى المتوسط",
  upperIntermediate: "الدفاع والتحليل المتقدّم — فوق المتوسط",
  advanced: "احتراف الأمن السيبراني — المستوى المتقدّم",
};
