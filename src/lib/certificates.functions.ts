import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { LESSON_COUNTS, PATH_CERT_TITLES } from "@/lib/certificate-catalog";

const CERT_COLUMNS =
  "id, path_id, course_title, recipient_name, serial, lessons_completed, quiz_average, issued_at, status, review_note, reviewed_at, signature_name, signature_title, signature_url, honors";

export const getMyCertificates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("certificates")
      .select(CERT_COLUMNS)
      .eq("user_id", context.userId)
      .order("issued_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Public verification by serial — only approved certificates are returned. */
export const verifyCertificateSerial = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ serial: z.string().trim().min(4).max(64) }).parse(input))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const client = createClient(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input: any, init?: any) => {
          const headers = new Headers(init?.headers);
          if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
            headers.delete("Authorization");
          }
          headers.set("apikey", key);
          return fetch(input, { ...init, headers });
        },
      },
    });
    const { data: rows, error } = await client.rpc("verify_certificate", { p_serial: data.serial });
    if (error) throw new Error(error.message);
    const row = Array.isArray(rows) ? rows[0] : rows;
    return { found: Boolean(row), certificate: (row ?? null) as Record<string, any> | null };
  });

export const issueCertificate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ pathId: z.enum(["beginner", "intermediate", "upperIntermediate", "advanced"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const total = LESSON_COUNTS[data.pathId];

    const [existing, progress, profile, quizzes] = await Promise.all([
      supabase
        .from("certificates")
        .select("id, serial")
        .eq("user_id", userId)
        .eq("path_id", data.pathId)
        .maybeSingle(),
      supabase.from("progress").select("data").eq("user_id", userId).maybeSingle(),
      supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle(),
      supabase.from("quiz_results").select("score, total").eq("user_id", userId).eq("path_id", data.pathId),
    ]);

    if (existing.data) return { ok: true as const, alreadyIssued: true as const, serial: existing.data.serial };

    const raw = (progress.data?.data ?? {}) as Record<string, unknown>;
    const unlocked = Number(raw[`${data.pathId}UnlockedLesson`] ?? -1);
    if (!Number.isFinite(unlocked) || unlocked < total) {
      return { ok: false as const, reason: "incomplete" as const, done: Math.max(unlocked, 0), total };
    }

    const rows = quizzes.data ?? [];
    const average = rows.length
      ? Math.round((rows.reduce((sum, q) => sum + (q.total ? q.score / q.total : 0), 0) / rows.length) * 100)
      : 0;

    const { data: created, error } = await supabase
      .from("certificates")
      .insert({
        user_id: userId,
        path_id: data.pathId,
        course_title: PATH_CERT_TITLES[data.pathId],
        recipient_name: profile.data?.display_name?.trim() || "متدرّب فرعون Ai",
        lessons_completed: total,
        quiz_average: average,
      })
      .select("serial")
      .single();
    if (error) throw new Error(error.message);

    return { ok: true as const, alreadyIssued: false as const, serial: created.serial };
  });
