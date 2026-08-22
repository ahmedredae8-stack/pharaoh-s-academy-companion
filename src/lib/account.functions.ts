import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const progressSchema = z.object({
  data: z.record(z.string(), z.unknown()),
  lessonSkipCount: z.number().int().min(0).max(999),
});

export const getMyAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [profile, progress, entitlements] = await Promise.all([
      supabase.from("profiles").select("id, display_name, avatar_url").eq("id", userId).maybeSingle(),
      supabase
        .from("progress")
        .select("data, lesson_skip_count, updated_at")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase.from("entitlements").select("product_id, status, expires_at, source").eq("user_id", userId),
    ]);

    return {
      profile: profile.data ?? null,
      progress: progress.data ?? null,
      entitlements: entitlements.data ?? [],
    };
  });

export const saveMyProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => progressSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("progress").upsert(
      {
        user_id: context.userId,
        data: data.data as never,
        lesson_skip_count: data.lessonSkipCount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const recordQuizResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        pathId: z.string().max(64),
        lessonIndex: z.number().int().min(0).max(9999),
        score: z.number().int().min(0).max(9999),
        total: z.number().int().min(0).max(9999),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("quiz_results").insert({
      user_id: context.userId,
      path_id: data.pathId,
      lesson_index: data.lessonIndex,
      score: data.score,
      total: data.total,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const recordLabCompletion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        pathId: z.string().max(64),
        lessonIndex: z.number().int().min(0).max(9999),
        labId: z.string().max(64).default("default"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await context.supabase.from("lab_completions").upsert(
      {
        user_id: context.userId,
        path_id: data.pathId,
        lesson_index: data.lessonIndex,
        lab_id: data.labId,
      },
      { onConflict: "user_id,path_id,lesson_index,lab_id", ignoreDuplicates: true },
    );
    return { ok: true };
  });