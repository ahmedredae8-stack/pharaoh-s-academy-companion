import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const LESSON_COLUMNS =
  "id, course_id, position, title, body, audio_url, video_url, image_url, published, created_at, updated_at";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("FORBIDDEN: هذه العملية للإدارة فقط");
}

/** دروس منشورة لكورس معيّن (للمتدرّبين). */
export const listCourseLessons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ courseId: z.string().trim().min(1).max(60) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("course_lessons")
      .select(LESSON_COLUMNS)
      .eq("course_id", data.courseId)
      .eq("published", true)
      .order("position", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

/** كل الدروس (بما فيها المسودّات) — للإدارة فقط. */
export const adminListCourseLessons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ courseId: z.string().trim().min(1).max(60).default("course_cyber_range") }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: rows, error } = await context.supabase
      .from("course_lessons")
      .select(LESSON_COLUMNS)
      .eq("course_id", data.courseId)
      .order("position", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const adminSaveCourseLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        courseId: z.string().trim().min(1).max(60),
        position: z.number().int().min(0).max(999),
        title: z.string().trim().min(2).max(140),
        body: z.string().trim().max(20000).default(""),
        audioUrl: z.string().trim().max(600).default(""),
        videoUrl: z.string().trim().max(600).default(""),
        imageUrl: z.string().trim().max(600).default(""),
        published: z.boolean().default(false),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const row = {
      course_id: data.courseId,
      position: data.position,
      title: data.title,
      body: data.body,
      audio_url: data.audioUrl || null,
      video_url: data.videoUrl || null,
      image_url: data.imageUrl || null,
      published: data.published,
      created_by: context.userId,
    };
    const { error } = data.id
      ? await context.supabase.from("course_lessons").update(row).eq("id", data.id)
      : await context.supabase.from("course_lessons").insert(row);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteCourseLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("course_lessons").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
