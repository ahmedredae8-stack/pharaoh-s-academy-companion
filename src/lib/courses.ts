// برنامج عملي أسبوعي: 24 أسبوعًا من الصفر إلى مستوى قابل للتوظيف.
import type { PathId } from "./products";

export type Week = {
  week: number;
  title: string;
  goal: string;
  lab: string;
  resource: string;
  deliverable: string;
  hours: number;
};

export type Term = {
  id: string;
  pathId: PathId;
  title: string;
  subtitle: string;
  weeks: Week[];
};

export const PROGRAM: Term[] = [
  {
    id: "t1",
    pathId: "beginner",
    title: "الفصل الأول — الأساسات التقنية",
    subtitle: "لينكس، الشبكات، التشفير. لا تُختصر ولا تُقفز.",
    weeks: [
      {
        week: 1,
        title: "إعداد معملك المنزلي",
        goal: "بيئة آمنة معزولة تجرّب فيها كل شيء دون خطر.",
        lab: "VirtualBox + Ubuntu + Kali على شبكة داخلية Host-Only، ولقطة Snapshot لكل جهاز.",
        resource: "توثيق VirtualBox الرسمي + Kali Docs",
        deliverable: "مخطط شبكة معملك مع لقطة شاشة لكل جهاز يعمل.",
        hours: 6,
      },
      {
        week: 2,
        title: "سطر أوامر لينكس",
        goal: "تتحرك في النظام دون واجهة رسومية بثقة.",
        lab: "OverTheWire: Bandit من المستوى 0 إلى 15.",
        resource: "OverTheWire Bandit (مجاني)",
        deliverable: "ملف Markdown يشرح حل كل مستوى بكلماتك.",
        hours: 8,
      },
      {
        week: 3,
        title: "المستخدمون والصلاحيات والسجلات",
        goal: "تفهم لماذا تُخترق الأنظمة بسبب صلاحية واحدة خاطئة.",
        lab: "إنشاء مستخدمين، ضبط sudoers، تتبّع محاولات الدخول عبر journalctl و auth.log.",
        resource: "Linux Journey — Permissions",
        deliverable: "سكربت Bash يرصد محاولات دخول فاشلة ويُنبّه.",
        hours: 7,
      },
      {
        week: 4,
        title: "الشبكات: TCP/IP عمليًا",
        goal: "تقرأ حزمة وتعرف ماذا حدث بالضبط.",
        lab: "التقاط جلسة HTTP وأخرى HTTPS بـ Wireshark ومقارنة ما يظهر.",
        resource: "Wireshark Sample Captures + Practical Networking",
        deliverable: "تحليل مكتوب لعملية TCP Handshake من التقاطك أنت.",
        hours: 8,
      },
      {
        week: 5,
        title: "المسح والاستكشاف",
        goal: "تعرف ما يعمل على الشبكة قبل أي شيء آخر.",
        lab: "nmap على معملك: اكتشاف المضيفين، المنافذ، إصدارات الخدمات.",
        resource: "Nmap Reference Guide",
        deliverable: "جرد أصول (Asset Inventory) لمعملك مع المخاطر المحتملة.",
        hours: 6,
      },
      {
        week: 6,
        title: "التشفير والهوية",
        goal: "تفرّق بين التجزئة والتشفير وتستخدم كليهما صح.",
        lab: "توليد مفاتيح GPG، توقيع ملف، إصدار شهادة TLS ذاتية بـ OpenSSL.",
        resource: "Crypto 101 (كتاب مجاني)",
        deliverable: "خادم ويب محلي يعمل بـ HTTPS من شهادتك.",
        hours: 7,
      },
    ],
  },
  {
    id: "t2",
    pathId: "intermediate",
    title: "الفصل الثاني — الدفاع (Blue Team)",
    subtitle: "أسرع طريق لوظيفة حقيقية: محلل SOC.",
    weeks: [
      {
        week: 7,
        title: "بناء SIEM في معملك",
        goal: "تجمع سجلات عدة أجهزة في مكان واحد.",
        lab: "تثبيت Elastic/Wazuh وربط عميل ويندوز ولينكس.",
        resource: "Wazuh Quickstart",
        deliverable: "لوحة تعرض أحداث الدخول من كل الأجهزة.",
        hours: 10,
      },
      {
        week: 8,
        title: "كشف الهجمات وكتابة القواعد",
        goal: "تحوّل سلوكًا مشبوهًا إلى تنبيه دقيق.",
        lab: "توليد هجوم Brute Force ثم كتابة قاعدة Sigma تكشفه.",
        resource: "Sigma HQ Rules",
        deliverable: "ثلاث قواعد كشف من كتابتك مع دليل نجاحها.",
        hours: 9,
      },
      {
        week: 9,
        title: "MITRE ATT&CK عمليًا",
        goal: "تُسمّي ما فعله المهاجم بلغة الصناعة.",
        lab: "تنفيذ تقنيات من Atomic Red Team ومطابقتها بالسجلات.",
        resource: "MITRE ATT&CK Navigator",
        deliverable: "خريطة تغطية كشف لمعملك.",
        hours: 8,
      },
      {
        week: 10,
        title: "الاستجابة للحوادث",
        goal: "تعرف ماذا تفعل في أول 30 دقيقة.",
        lab: "محاكاة جهاز مصاب: احتواء، جمع أدلة، استئصال.",
        resource: "SANS Incident Handler's Handbook",
        deliverable: "تقرير حادث بصيغة احترافية (Timeline + IOCs).",
        hours: 9,
      },
      {
        week: 11,
        title: "التحليل الجنائي المبدئي",
        goal: "تستخرج الحقيقة من ذاكرة أو قرص.",
        lab: "تحليل صورة ذاكرة بـ Volatility وقرص بـ Autopsy.",
        resource: "Volatility Foundation Labs",
        deliverable: "تقرير يحدد العملية الخبيثة وأصلها.",
        hours: 10,
      },
      {
        week: 12,
        title: "إدارة الثغرات والتقسية",
        goal: "تُغلق الباب قبل أن يُطرق.",
        lab: "فحص بـ OpenVAS ثم تقسية الخادم وفق CIS وإعادة الفحص.",
        resource: "CIS Benchmarks",
        deliverable: "مقارنة قبل/بعد بالأرقام.",
        hours: 8,
      },
    ],
  },
  {
    id: "t3",
    pathId: "upperIntermediate",
    title: "الفصل الثالث — الهجوم الأخلاقي",
    subtitle: "تفكر كمهاجم لتغلق ما يفتحه.",
    weeks: [
      {
        week: 13,
        title: "أمن الويب: الحقن والمصادقة",
        goal: "تستغل وتفهم الجذر لا الأداة.",
        lab: "Juice Shop: SQLi، كسر مصادقة، IDOR — يدويًا عبر Burp.",
        resource: "PortSwigger Web Security Academy (مجاني)",
        deliverable: "PoC موثّق لكل ثغرة مع الإصلاح البرمجي.",
        hours: 10,
      },
      {
        week: 14,
        title: "XSS وSSRF ورفع الملفات",
        goal: "تربط ثغرة صغيرة بأثر كبير.",
        lab: "سلسلة استغلال من XSS مخزّن إلى سرقة جلسة إداري.",
        resource: "PortSwigger Labs — XSS / SSRF",
        deliverable: "تقرير سلسلة هجوم كاملة.",
        hours: 9,
      },
      {
        week: 15,
        title: "استغلال الأنظمة",
        goal: "من منفذ مفتوح إلى Shell.",
        lab: "Metasploitable / آلات HackTheBox سهلة.",
        resource: "TryHackMe — Offensive Pentesting",
        deliverable: "خمس آلات مُخترقة بتوثيق خطوة بخطوة.",
        hours: 12,
      },
      {
        week: 16,
        title: "تصعيد الصلاحيات",
        goal: "من مستخدم عادي إلى root/SYSTEM.",
        lab: "LinPEAS وWinPEAS وفهم كل نتيجة قبل استغلالها.",
        resource: "GTFOBins + LOLBAS",
        deliverable: "قائمة مراجعة تصعيد صلاحيات من صنعك.",
        hours: 10,
      },
      {
        week: 17,
        title: "Active Directory",
        goal: "أغلب الشركات تُخترق من هنا.",
        lab: "معمل AD: Kerberoasting، Pass-the-Hash، BloodHound.",
        resource: "TryHackMe — AD Basics",
        deliverable: "مسار هجوم من مستخدم عادي إلى Domain Admin.",
        hours: 12,
      },
      {
        week: 18,
        title: "التقرير الاحترافي",
        goal: "التقرير هو المنتج، لا الاختراق.",
        lab: "كتابة تقرير كامل: ملخص تنفيذي، مخاطر، إثباتات، توصيات.",
        resource: "قوالب تقارير OffSec",
        deliverable: "تقرير اختبار اختراق بمستوى تسليم لعميل.",
        hours: 8,
      },
    ],
  },
  {
    id: "t4",
    pathId: "advanced",
    title: "الفصل الرابع — التخصص والتوظيف",
    subtitle: "اختر مسارًا واحدًا وتعمّق، ثم اصنع ملفك المهني.",
    weeks: [
      {
        week: 19,
        title: "تحليل البرمجيات الخبيثة",
        goal: "تفهم ماذا يفعل الملف قبل أن يعمل.",
        lab: "تحليل ساكن وديناميكي لعيّنة في بيئة معزولة.",
        resource: "Practical Malware Analysis (labs)",
        deliverable: "قاعدة YARA تكشف العائلة.",
        hours: 12,
      },
      {
        week: 20,
        title: "أمن السحابة",
        goal: "أخطاء IAM سبب معظم تسريبات اليوم.",
        lab: "flaws.cloud + مراجعة صلاحيات مشروع حقيقي لك.",
        resource: "flaws.cloud (مجاني)",
        deliverable: "تقرير مراجعة صلاحيات مع سياسات مُصحّحة.",
        hours: 10,
      },
      {
        week: 21,
        title: "DevSecOps",
        goal: "الأمن داخل خط الإنتاج لا بعده.",
        lab: "GitHub Actions مع Trivy وSemgrep يرفض الدمج عند ثغرة حرجة.",
        resource: "OWASP DevSecOps Guideline",
        deliverable: "مستودع يعمل فيه الفحص تلقائيًا.",
        hours: 9,
      },
      {
        week: 22,
        title: "الأتمتة بـ Python",
        goal: "تبني أدواتك بدل انتظارها.",
        lab: "أداة تفحص نطاقًا، تجمع النتائج، وتُصدر تقرير HTML.",
        resource: "Black Hat Python (تمارين)",
        deliverable: "أداة منشورة على GitHub مع README.",
        hours: 10,
      },
      {
        week: 23,
        title: "الشهادة والاختبار",
        goal: "تثبت ما تعرفه بورقة معترف بها.",
        lab: "محاكاة اختبار: eJPT أو Security+ حسب مسارك.",
        resource: "بنوك أسئلة رسمية",
        deliverable: "نتيجة اختبار تجريبي فوق 85%.",
        hours: 10,
      },
      {
        week: 24,
        title: "ملف مهني ومقابلة عمل",
        goal: "تتحوّل من متعلم إلى مرشّح.",
        lab: "تنظيف GitHub، سيرة ذاتية أمنية، LinkedIn، تدريب على أسئلة SOC.",
        resource: "قوائم أسئلة مقابلات SOC/Pentest",
        deliverable: "ملف كامل + 10 طلبات توظيف مُرسلة.",
        hours: 8,
      },
    ],
  },
];

export const TOTAL_WEEKS = PROGRAM.reduce((s, t) => s + t.weeks.length, 0);
export const TOTAL_HOURS = PROGRAM.reduce(
  (s, t) => s + t.weeks.reduce((w, x) => w + x.hours, 0),
  0,
);
