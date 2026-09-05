import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("FORBIDDEN: هذه العملية للإدارة فقط");
}

/** Admin-only edits to the printed content of a certificate (incl. signature). */
export const adminUpdateCertificateDesign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        recipientName: z.string().trim().min(2).max(80),
        courseTitle: z.string().trim().min(2).max(120),
        honors: z.string().trim().max(60).default(""),
        signatureName: z.string().trim().max(80).default(""),
        signatureTitle: z.string().trim().max(80).default(""),
        signatureUrl: z.string().trim().max(500).default(""),
        template: z.enum(["royal", "modern", "classic"]).default("royal"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    const { error } = await context.supabase
      .from("certificates")
      .update({
        recipient_name: data.recipientName,
        course_title: data.courseTitle,
        honors: data.honors || null,
        signature_name: data.signatureName || null,
        signature_title: data.signatureTitle || null,
        signature_url: data.signatureUrl || null,
        template: data.template,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** إصدار شهادة يدويًا من لوحة الإدارة (بدون طلب من المتدرّب). */
export const adminIssueCertificate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        pathId: z.string().trim().min(2).max(40).default("custom"),
        courseTitle: z.string().trim().min(2).max(120),
        recipientName: z.string().trim().min(2).max(80),
        lessonsCompleted: z.number().int().min(0).max(999).default(0),
        quizAverage: z.number().int().min(0).max(100).default(100),
        honors: z.string().trim().max(60).default(""),
        signatureName: z.string().trim().max(80).default(""),
        signatureTitle: z.string().trim().max(80).default(""),
        signatureUrl: z.string().trim().max(500).default(""),
        template: z.enum(["royal", "modern", "classic"]).default("royal"),
        approve: z.boolean().default(true),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin
      .from("certificates")
      .insert({
        user_id: data.userId,
        path_id: data.pathId,
        course_title: data.courseTitle,
        recipient_name: data.recipientName,
        lessons_completed: data.lessonsCompleted,
        quiz_average: data.quizAverage,
        honors: data.honors || null,
        signature_name: data.signatureName || null,
        signature_title: data.signatureTitle || null,
        signature_url: data.signatureUrl || null,
        template: data.template,
        status: data.approve ? "approved" : "pending",
        reviewed_by: data.approve ? context.userId : null,
        reviewed_at: data.approve ? new Date().toISOString() : null,
      })
      .select("serial")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, serial: created.serial };
  });

/** طلبات الشهادات المُحتجزة (بانتظار المراجعة) مع تفاصيل الطالب واشتراكاته. */
export const adminListCertificateRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: certs, error } = await supabaseAdmin
      .from("certificates")
      .select(
        "id, user_id, serial, recipient_name, course_title, path_id, lessons_completed, quiz_average, status, issued_at, template, honors, signature_name, signature_title, signature_url",
      )
      .eq("status", "pending")
      .order("issued_at", { ascending: true })
      .limit(100);
    if (error) throw new Error(error.message);

    const rows = certs ?? [];
    const userIds = [...new Set(rows.map((r) => r.user_id))];
    if (userIds.length === 0) return [];

    const [profiles, entitlements, quizzes, labs] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, display_name, avatar_url, is_banned").in("id", userIds),
      supabaseAdmin
        .from("entitlements")
        .select("user_id, product_id, status, expires_at, auto_renewing, source")
        .in("user_id", userIds),
      supabaseAdmin.from("quiz_results").select("user_id, score, total, path_id").in("user_id", userIds),
      supabaseAdmin.from("lab_completions").select("user_id, path_id").in("user_id", userIds),
    ]);

    const emails = new Map<string, string>();
    await Promise.all(
      userIds.map(async (id) => {
        const { data } = await supabaseAdmin.auth.admin.getUserById(id);
        if (data?.user?.email) emails.set(id, data.user.email);
      }),
    );

    return rows.map((cert) => {
      const profile = (profiles.data ?? []).find((p) => p.id === cert.user_id);
      const userQuizzes = (quizzes.data ?? []).filter((q) => q.user_id === cert.user_id);
      const average = userQuizzes.length
        ? Math.round(
            (userQuizzes.reduce((sum, q) => sum + (q.total ? q.score / q.total : 0), 0) / userQuizzes.length) * 100,
          )
        : 0;
      return {
        ...cert,
        email: emails.get(cert.user_id) ?? null,
        display_name: profile?.display_name ?? null,
        avatar_url: profile?.avatar_url ?? null,
        is_banned: Boolean(profile?.is_banned),
        quiz_count: userQuizzes.length,
        quiz_overall_average: average,
        labs_count: (labs.data ?? []).filter((l) => l.user_id === cert.user_id).length,
        entitlements: (entitlements.data ?? [])
          .filter((e) => e.user_id === cert.user_id)
          .map((e) => ({
            product_id: e.product_id,
            status: e.status,
            expires_at: e.expires_at,
            auto_renewing: e.auto_renewing,
            source: e.source,
            expired: Boolean(e.expires_at && new Date(e.expires_at).getTime() < Date.now()),
          })),
      };
    });
  });
