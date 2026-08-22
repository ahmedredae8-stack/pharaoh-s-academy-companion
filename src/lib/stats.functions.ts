import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [labs, quizzes, profile] = await Promise.all([
      supabase
        .from("lab_completions")
        .select("path_id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      supabase
        .from("quiz_results")
        .select("path_id, lesson_index, score, total, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle(),
    ]);

    return {
      labs: labs.data ?? [],
      quizzes: quizzes.data ?? [],
      displayName: profile.data?.display_name ?? null,
    };
  });