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
