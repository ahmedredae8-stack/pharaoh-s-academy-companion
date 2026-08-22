import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(40),
  avatar: z.string().trim().max(8),
});

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => profileSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ display_name: data.displayName, avatar_url: data.avatar })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
