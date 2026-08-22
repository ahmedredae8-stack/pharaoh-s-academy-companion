import { forwardRef } from "react";

export type CertificateData = {
  serial: string;
  recipient_name: string;
  course_title: string;
  path_id?: string | null;
  lessons_completed?: number | null;
  quiz_average?: number | null;
  issued_at?: string | null;
  signature_name?: string | null;
  signature_title?: string | null;
  signature_url?: string | null;
  honors?: string | null;
};

export const PATH_TITLES_EN: Record<string, string> = {
  beginner: "Cybersecurity Foundations — Guardian Track",
  intermediate: "Applied Cybersecurity — Practitioner Track",
  upperIntermediate: "Advanced Defense & Analysis Track",
  advanced: "Cybersecurity Mastery — Expert Track",
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function honorsLabel(data: CertificateData) {
  if (data.honors) return data.honors;
  const score = data.quiz_average ?? 0;
  if (score >= 95) return "With Highest Distinction";
  if (score >= 85) return "With Distinction";
  if (score >= 70) return "With Merit";
  return "Successfully Completed";
}

/** Institutional English certificate sheet (A4 landscape ratio). */
export const CertificateSheet = forwardRef<HTMLDivElement, { data: CertificateData; watermark?: string }>(
  function CertificateSheet({ data, watermark }, ref) {
    const title = data.course_title || PATH_TITLES_EN[data.path_id ?? ""] || "Cybersecurity Program";
    const english = PATH_TITLES_EN[data.path_id ?? ""];

    return (
      <div ref={ref} dir="ltr" className="cert-sheet">
        <div className="cert-frame">
          {watermark ? <span className="cert-watermark">{watermark}</span> : null}

          <header className="cert-head">
            <img src="/mascot.png" alt="Pharaoh Ai emblem" className="cert-emblem" />
            <div>
              <p className="cert-org">PHARAOH&nbsp;AI</p>
              <p className="cert-org-sub">Institute of Cyber Defense Training</p>
            </div>
          </header>

          <p className="cert-kicker">Certificate of Completion</p>
          <p className="cert-intro">This is to certify that</p>
          <h1 className="cert-name">{data.recipient_name}</h1>
          <p className="cert-intro">has successfully completed the program</p>
          <h2 className="cert-course">{english ?? title}</h2>
          {english && title !== english ? <p className="cert-course-ar">{title}</p> : null}
          <p className="cert-honors">{honorsLabel(data)}</p>

          <div className="cert-metrics">
            <span>
              <strong>{data.lessons_completed ?? 0}</strong> Lessons
            </span>
            <span>
              <strong>{data.quiz_average ?? 0}%</strong> Assessment Average
            </span>
            <span>
              <strong>{formatDate(data.issued_at)}</strong> Issued
            </span>
          </div>

          <footer className="cert-foot">
            <div className="cert-sign">
              {data.signature_url ? (
                <img src={data.signature_url} alt="Authorized signature" className="cert-sign-img" />
              ) : (
                <span className="cert-sign-placeholder">signature</span>
              )}
              <span className="cert-sign-line" />
              <p className="cert-sign-name">{data.signature_name || "Authorized Signatory"}</p>
              <p className="cert-sign-title">{data.signature_title || "Program Director, Pharaoh Ai"}</p>
            </div>

            <div className="cert-seal">
              <span>VERIFIED</span>
              <strong>PHARAOH AI</strong>
              <span>SECURE</span>
            </div>

            <div className="cert-serial">
              <p className="cert-serial-label">Certificate Serial</p>
              <p className="cert-serial-value">{data.serial}</p>
              <p className="cert-serial-hint">Verify at /verify</p>
            </div>
          </footer>
        </div>
      </div>
    );
  },
);
