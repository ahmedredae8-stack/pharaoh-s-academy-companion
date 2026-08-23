import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, ShieldX } from "lucide-react";
import { useState } from "react";

import { CertificateSheet, type CertificateData } from "@/components/certificate/CertificateSheet";
import { DuoLayout } from "@/components/duo/DuoLayout";
import { verifyCertificateSerial } from "@/lib/certificates.functions";

export const Route = createFileRoute("/verify")({
  head: () => ({
    meta: [
      { title: "التحقق من الشهادات — فرعون Ai" },
      {
        name: "description",
        content: "أدخل الرقم التسلسلي للتحقق من صحة شهادة فرعون Ai المعتمدة وعرض تفاصيلها الرسمية.",
      },
      { property: "og:title", content: "التحقق من الشهادات — فرعون Ai" },
      { property: "og:description", content: "تحقّق من صحة أي شهادة صادرة عن فرعون Ai عبر رقمها التسلسلي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VerifyPage,
});

function VerifyPage() {
  const verify = useServerFn(verifyCertificateSerial);
  const [serial, setSerial] = useState("");
  const [state, setState] = useState<{ loading: boolean; checked: boolean; cert: CertificateData | null }>({
    loading: false,
    checked: false,
    cert: null,
  });

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = serial.trim();
    if (value.length < 4) return;
    setState({ loading: true, checked: false, cert: null });
    try {
      const result = await verify({ data: { serial: value } });
      setState({ loading: false, checked: true, cert: (result.certificate as CertificateData | null) ?? null });
    } catch {
      setState({ loading: false, checked: true, cert: null });
    }
  }

  return (
    <DuoLayout>
      <div className="space-y-4">
        <header className="duo-card space-y-2 p-5">
          <h1 className="flex items-center gap-2 text-xl font-black">
            <ShieldCheck className="h-6 w-6 text-duo-green" /> التحقق من الشهادات
          </h1>
          <p className="text-sm text-duo-muted">
            أدخل الرقم التسلسلي الموجود أسفل الشهادة للتأكد من اعتمادها من إدارة فرعون Ai.
          </p>
          <form onSubmit={onSubmit} className="flex flex-wrap gap-2">
            <input
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              placeholder="مثال: PH-2026-XXXX"
              className="min-w-[220px] flex-1 rounded-xl border-2 border-duo-surface-2 bg-duo-surface px-3 py-2 font-mono text-sm"
            />
            <button type="submit" disabled={state.loading} className="duo-btn text-sm">
              {state.loading ? "جارٍ التحقق…" : "تحقّق"}
            </button>
          </form>
        </header>

        {state.checked && !state.cert ? (
          <p className="duo-card flex items-center justify-center gap-2 p-6 text-sm font-black text-duo-red">
            <ShieldX className="h-5 w-5" /> لا توجد شهادة معتمدة بهذا الرقم.
          </p>
        ) : null}

        {state.cert ? (
          <div className="duo-card space-y-3 p-5">
            <p className="flex items-center gap-2 text-sm font-black text-duo-green-dark">
              <ShieldCheck className="h-5 w-5" /> شهادة معتمدة وصالحة
            </p>
            <div className="overflow-x-auto">
              <CertificateSheet data={state.cert} />
            </div>
          </div>
        ) : null}
      </div>
    </DuoLayout>
  );
}
