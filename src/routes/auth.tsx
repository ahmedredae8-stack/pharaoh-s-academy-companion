import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

type AuthSearch = { redirect?: string | undefined };

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): AuthSearch => ({
    redirect: typeof search["redirect"] === "string" ? search["redirect"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "تسجيل الدخول - فرعون Ai" },
      {
        name: "description",
        content: "سجّل الدخول لحفظ تقدّمك في فرعون Ai على السحابة والوصول لاشتراكك من أي جهاز.",
      },
      { property: "og:title", content: "تسجيل الدخول - فرعون Ai" },
      {
        property: "og:description",
        content: "احفظ تقدّمك واستعد اشتراكك على أي جهاز في منصة فرعون Ai.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function safeRedirect(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function scorePassword(value: string): number {
  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= 12) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  return Math.min(score, 4);
}

const STRENGTH_LABEL = ["ضعيفة جدًا", "ضعيفة", "متوسطة", "قوية", "قوية جدًا"];
const STRENGTH_COLOR = [
  "bg-duo-red",
  "bg-duo-red",
  "bg-duo-yellow",
  "bg-duo-blue",
  "bg-duo-green",
];

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const destination = safeRedirect(search.redirect);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [useCode, setUseCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [otp, setOtp] = useState("");

  const strength = useMemo(() => scorePassword(password), [password]);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

  useEffect(() => {
    document.documentElement.lang = "ar";
    document.documentElement.dir = "rtl";
  }, []);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") void navigate({ to: destination });
    });
    return () => data.subscription.unsubscribe();
  }, [destination, navigate]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!emailValid) {
      toast.error("أدخل بريدًا إلكترونيًا صحيحًا");
      return;
    }
    if (mode === "signup") {
      if (strength < 2) {
        toast.error("اختر كلمة مرور أقوى (8 أحرف على الأقل مع أرقام ورموز)");
        return;
      }
      if (password !== confirm) {
        toast.error("كلمتا المرور غير متطابقتين");
        return;
      }
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}${destination}` },
        });
        if (error) throw error;
        if (!data.session) {
          setSentTo(email);
          toast.success("تم إنشاء الحساب. أرسلنا رسالة تأكيد إلى بريدك.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذّر إتمام العملية");
    } finally {
      setBusy(false);
    }
  }

  async function sendCode() {
    if (!emailValid) {
      toast.error("أدخل بريدًا إلكترونيًا صحيحًا");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      setCodeSent(true);
      toast.success("أرسلنا رمز الدخول إلى بريدك الإلكتروني");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذّر إرسال الرمز");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    const token = otp.replace(/\D/g, "");
    if (token.length < 6) {
      toast.error("أدخل الرمز المكوّن من 6 أرقام");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
      if (error) throw error;
      toast.success("تم تسجيل الدخول");
      void navigate({ to: destination });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "الرمز غير صحيح أو منتهي");
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    if (!emailValid) {
      toast.error("اكتب بريدك أولًا لإرسال رابط الاستعادة");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      toast.success("أرسلنا رابط استعادة كلمة المرور إلى بريدك");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذّر إرسال الرابط");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    try {
      sessionStorage.setItem("pharaoh:after-auth", destination);
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("تعذّر تسجيل الدخول عبر Google");
        return;
      }
      if (result.redirected) return;
      void navigate({ to: destination });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-duo-ink px-4 py-10">
      <div className="duo-card w-full max-w-sm p-6">
        <img
          src="/mascot.png"
          alt="تميمة فرعون Ai"
          className="duo-bounce mx-auto h-24 w-24 object-contain"
        />
        <h1 className="mt-2 text-center text-2xl font-black text-duo-text">فرعون Ai</h1>
        <p className="mt-1 text-center text-sm font-bold text-duo-muted">
          {mode === "signin" ? "سجّل الدخول لحفظ تقدّمك" : "أنشئ حسابًا جديدًا"}
        </p>

        <div className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-duo-surface-2 px-3 py-2 text-[11px] font-bold text-duo-muted">
          <ShieldCheck className="h-4 w-4 text-duo-green" />
          حسابك محمي وتشفير كامل لبياناتك
        </div>

        {sentTo ? (
          <div className="mt-4 space-y-1 rounded-2xl border-2 border-duo-green bg-duo-surface-2 p-4 text-center">
            <p className="text-sm font-black text-duo-green">تحقّق من بريدك الإلكتروني</p>
            <p className="text-xs font-bold text-duo-muted">
              أرسلنا رسالة تأكيد إلى <span className="font-mono">{sentTo}</span>. افتح الرابط داخل الرسالة لتفعيل حسابك،
              ثم عد لتسجيل الدخول. تفقّد مجلد الرسائل غير المرغوب فيها إن لم تجدها.
            </p>
          </div>
        ) : null}

        <button
          onClick={() => void google()}
          disabled={busy}
          className="duo-btn-blue mt-6 w-full px-4 py-3 text-sm disabled:opacity-50"
        >
          المتابعة باستخدام Google
        </button>

        <div className="my-4 text-center text-xs font-bold text-duo-muted">أو</div>

        <button
          type="button"
          onClick={() => {
            setUseCode((v) => !v);
            setCodeSent(false);
            setOtp("");
          }}
          className="mb-3 w-full rounded-2xl border-2 border-duo-line px-4 py-2 text-xs font-black text-duo-blue"
        >
          {useCode ? "الدخول بكلمة المرور" : "الدخول برمز يصل إلى بريدك"}
        </button>

        {useCode ? (
          <div className="space-y-3">
            <div className="relative">
              <Mail className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-duo-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="البريد الإلكتروني"
                className="w-full rounded-2xl border-2 border-duo-line bg-duo-surface px-4 py-3 pr-10 text-sm font-bold text-duo-text outline-none focus:border-duo-blue"
              />
            </div>
            {codeSent ? (
              <>
                <input
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="••••••"
                  className="w-full rounded-2xl border-2 border-duo-line bg-duo-surface px-4 py-3 text-center font-mono text-lg font-black tracking-[0.5em] text-duo-text outline-none focus:border-duo-blue"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void verifyCode()}
                  className="duo-btn w-full px-4 py-3 text-sm disabled:opacity-50"
                >
                  تأكيد الرمز والدخول
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void sendCode()}
                  className="w-full text-center text-xs font-bold text-duo-muted underline"
                >
                  إعادة إرسال الرمز
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => void sendCode()}
                className="duo-btn w-full px-4 py-3 text-sm disabled:opacity-50"
              >
                إرسال رمز الدخول
              </button>
            )}
          </div>
        ) : null}

        <form onSubmit={submit} className={`space-y-3 ${useCode ? "hidden" : ""}`}>
          <div className="relative">
            <Mail className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-duo-muted" />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="البريد الإلكتروني"
              className="w-full rounded-2xl border-2 border-duo-line bg-duo-surface px-4 py-3 pr-10 text-sm font-bold text-duo-text outline-none focus:border-duo-blue"
            />
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-duo-muted" />
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              className="w-full rounded-2xl border-2 border-duo-line bg-duo-surface px-4 py-3 pl-10 pr-10 text-sm font-bold text-duo-text outline-none focus:border-duo-blue"
            />
            <button
              type="button"
              aria-label="إظهار كلمة المرور"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-duo-muted"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {mode === "signup" ? (
            <>
              <div className="flex items-center gap-2">
                <div className="flex h-2 flex-1 gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`h-2 flex-1 rounded-full ${
                        i < strength ? STRENGTH_COLOR[strength] : "bg-duo-line"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-bold text-duo-muted">
                  {STRENGTH_LABEL[strength]}
                </span>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-duo-muted" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="تأكيد كلمة المرور"
                  className="w-full rounded-2xl border-2 border-duo-line bg-duo-surface px-4 py-3 pr-10 text-sm font-bold text-duo-text outline-none focus:border-duo-blue"
                />
              </div>
            </>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="duo-btn w-full px-4 py-3 text-sm disabled:opacity-50"
          >
            {mode === "signin" ? "دخول" : "إنشاء حساب"}
          </button>
        </form>

        {mode === "signin" ? (
          <button
            onClick={() => void resetPassword()}
            disabled={busy}
            className="mt-3 w-full text-center text-xs font-bold text-duo-muted underline"
          >
            نسيت كلمة المرور؟
          </button>
        ) : null}

        <div className="mt-4 flex items-center justify-between text-xs font-bold">
          <button
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setConfirm("");
            }}
            className="text-duo-blue underline"
          >
            {mode === "signin" ? "ليس لديك حساب؟ سجّل الآن" : "لديك حساب؟ سجّل الدخول"}
          </button>
          <a href="/" className="text-duo-muted hover:text-duo-text">
            المتابعة كضيف
          </a>
        </div>
      </div>
    </main>
  );
}