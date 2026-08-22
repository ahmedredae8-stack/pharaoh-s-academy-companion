import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError) throw new Error(roleError.message);
    if (!isAdmin) throw new Error("FORBIDDEN: هذه العملية للإدارة فقط");

    const { error } = await context.supabase
      .from("certificates")
      .update({
        recipient_name: data.recipientName,
        course_title: data.courseTitle,
        honors: data.honors || null,
        signature_name: data.signatureName || null,
        signature_title: data.signatureTitle || null,
        signature_url: data.signatureUrl || null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
