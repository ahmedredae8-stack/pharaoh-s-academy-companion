import { createFileRoute } from "@tanstack/react-router";

import {
  CERTIFICATE_TEMPLATES,
  CertificateSheet,
  type CertificateData,
} from "@/components/certificate/CertificateSheet";

export const Route = createFileRoute("/cert-preview")({
  head: () => ({
    meta: [
      { title: "معاينة قوالب الشهادات — فرعون Ai" },
      { name: "description", content: "معاينة القوالب الثلاثة للشهادات الرسمية." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => {
    const data: CertificateData = {
      serial: "PH-2026-000123",
      recipient_name: "Ahmed Reda",
      course_title: "Applied Cybersecurity — Practitioner Track",
      path_id: "intermediate",
      lessons_completed: 42,
      quiz_average: 96,
      issued_at: new Date().toISOString(),
      signature_name: "Ahmed Reda",
      signature_title: "Program Director, Pharaoh Ai",
    };
    return (
      <div className="space-y-8 p-6">
        {CERTIFICATE_TEMPLATES.map((t) => (
          <div key={t.id} className="space-y-2">
            <p className="text-sm font-black">{t.label}</p>
            <CertificateSheet data={data} template={t.id} />
          </div>
        ))}
      </div>
    );
  },
});
