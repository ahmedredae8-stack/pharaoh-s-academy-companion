import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const uuid = z.string().uuid();

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("FORBIDDEN: هذه الصفحة للإدارة فقط");
}

export const amIAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { admin: Boolean(data) };
  });

/* ---------------------------------- users --------------------------------- */

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ query: z.string().trim().max(60).default("") }).parse(input ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let request = context.supabase
      .from("profiles")
      .select("id, display_name, avatar_url, bio, is_banned, ban_reason, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (data.query) request = request.ilike("display_name", `%${data.query}%`);
    const { data: rows, error } = await request;
    if (error) throw new Error(error.message);

    const { data: roles } = await context.supabase.from("user_roles").select("user_id, role");
    const roleMap = new Map<string, string[]>();
    for (const row of roles ?? []) {
      roleMap.set(row.user_id, [...(roleMap.get(row.user_id) ?? []), row.role]);
    }
    return (rows ?? []).map((row: any) => ({ ...row, roles: roleMap.get(row.id) ?? [] }));
  });

export const adminSetBan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ userId: uuid, banned: z.boolean(), reason: z.string().trim().max(200).default("") }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("profiles")
      .update({ is_banned: data.banned, ban_reason: data.banned ? data.reason || "مخالفة شروط الاستخدام" : null })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSetRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ userId: uuid, role: z.enum(["admin", "moderator", "user"]), grant: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.grant) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.userId, role: data.role }, { onConflict: "user_id,role", ignoreDuplicates: true });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

/* ------------------------------ certificates ------------------------------ */

export const adminListCertificates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("certificates")
      .select("id, user_id, serial, recipient_name, course_title, path_id, lessons_completed, quiz_average, status, issued_at, review_note")
      .order("issued_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminReviewCertificate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ id: uuid, status: z.enum(["approved", "rejected"]), note: z.string().trim().max(200).default("") })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("certificates")
      .update({
        status: data.status,
        review_note: data.note || null,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* --------------------------------- content -------------------------------- */

export const adminDeletePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ postId: uuid }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("posts").delete().eq("id", data.postId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* -------------------------------- products -------------------------------- */

export const adminListProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("products")
      .select("id, product_id, title, description, price_cents, currency, kind, provider, play_status, play_error, active")
      .order("price_cents", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminSaveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: uuid.optional(),
        productId: z.string().trim().min(3).max(60),
        title: z.string().trim().min(2).max(80),
        description: z.string().trim().max(300).default(""),
        priceCents: z.number().int().min(0).max(1_000_000),
        currency: z.string().trim().length(3).default("USD"),
        kind: z.enum(["subscription", "one_time"]),
        provider: z.enum(["google_play", "web", "manual"]),
        active: z.boolean().default(true),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const row = {
      product_id: data.productId,
      title: data.title,
      description: data.description,
      price_cents: data.priceCents,
      currency: data.currency.toUpperCase(),
      kind: data.kind,
      provider: data.provider,
      active: data.active,
      updated_at: new Date().toISOString(),
    };
    const { error } = data.id
      ? await context.supabase.from("products").update(row).eq("id", data.id)
      : await context.supabase.from("products").insert(row);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------ redeem codes ------------------------------ */

export const adminCreateRedeemCodes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        productId: z.string().trim().min(3).max(60),
        count: z.number().int().min(1).max(50),
        note: z.string().trim().max(120).default(""),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const codes = Array.from({ length: data.count }, () => {
      const bytes = crypto.getRandomValues(new Uint8Array(12));
      const raw = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
      return `PH-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
    });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("redeem_codes").insert(
      codes.map((code) => ({
        code,
        product_id: data.productId,
        note: data.note || null,
        created_by: context.userId,
      })),
    );
    if (error) throw new Error(error.message);
    return { codes };
  });

export const adminListRedeemCodes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("redeem_codes")
      .select("code, product_id, note, used_by, used_at, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/* ---------------------------------- stats --------------------------------- */

export const adminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const [users, posts, certs, pending] = await Promise.all([
      context.supabase.from("profiles").select("id", { count: "exact", head: true }),
      context.supabase.from("posts").select("id", { count: "exact", head: true }),
      context.supabase.from("certificates").select("id", { count: "exact", head: true }),
      context.supabase.from("certificates").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]);
    return {
      users: users.count ?? 0,
      posts: posts.count ?? 0,
      certificates: certs.count ?? 0,
      pendingCertificates: pending.count ?? 0,
    };
  });
