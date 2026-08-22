import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const uuid = z.string().uuid();

/* ---------------------------------- feed ---------------------------------- */

export const getFeed = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ limit: z.number().int().min(1).max(50).default(30), offset: z.number().int().min(0).default(0) }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.rpc("community_feed", {
      p_limit: data.limit,
      p_offset: data.offset,
    });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        content: z.string().trim().min(1).max(1000),
        imageUrl: z.string().trim().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("posts").insert({
      user_id: context.userId,
      content: data.content,
      image_url: data.imageUrl ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ postId: uuid }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("posts").delete().eq("id", data.postId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleLike = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ postId: uuid, liked: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    if (data.liked) {
      await context.supabase.from("post_likes").delete().eq("post_id", data.postId).eq("user_id", context.userId);
    } else {
      await context.supabase
        .from("post_likes")
        .upsert({ post_id: data.postId, user_id: context.userId }, { onConflict: "post_id,user_id", ignoreDuplicates: true });
    }
    return { ok: true };
  });

export const getComments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ postId: uuid }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.rpc("post_comments_feed", { p_post_id: data.postId });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const addComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ postId: uuid, content: z.string().trim().min(1).max(500) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("post_comments")
      .insert({ post_id: data.postId, user_id: context.userId, content: data.content });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* --------------------------------- stories -------------------------------- */

export const getStories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("active_stories");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createStory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        content: z.string().trim().max(280).optional(),
        mediaUrl: z.string().trim().max(500).optional(),
      })
      .refine((v) => Boolean(v.content || v.mediaUrl), { message: "story requires text or media" })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("stories").insert({
      user_id: context.userId,
      content: data.content ?? null,
      media_url: data.mediaUrl ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* --------------------------------- friends -------------------------------- */

export const searchPeople = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ query: z.string().trim().min(2).max(60) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.rpc("search_profiles", { p_query: data.query });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const listFriends = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("my_friends");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const sendFriendRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ userId: uuid }).parse(input))
  .handler(async ({ data, context }) => {
    if (data.userId === context.userId) throw new Error("لا يمكنك إضافة نفسك");
    const { error } = await context.supabase
      .from("friendships")
      .insert({ requester_id: context.userId, addressee_id: data.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const respondFriendRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ friendshipId: uuid, accept: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    if (data.accept) {
      const { error } = await context.supabase
        .from("friendships")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("id", data.friendshipId);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("friendships").delete().eq("id", data.friendshipId);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

/* -------------------------------- messages -------------------------------- */

export const getThread = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ userId: uuid }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase
      .from("messages")
      .select("id, sender_id, recipient_id, content, created_at, read_at")
      .or(
        `and(sender_id.eq.${userId},recipient_id.eq.${data.userId}),and(sender_id.eq.${data.userId},recipient_id.eq.${userId})`,
      )
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) throw new Error(error.message);

    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("recipient_id", userId)
      .eq("sender_id", data.userId)
      .is("read_at", null);

    return rows ?? [];
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ userId: uuid, content: z.string().trim().min(1).max(1000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("messages")
      .insert({ sender_id: context.userId, recipient_id: data.userId, content: data.content });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* --------------------------------- blocks --------------------------------- */

export const blockUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ userId: uuid, block: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    if (data.block) {
      await context.supabase
        .from("blocks")
        .upsert({ blocker_id: context.userId, blocked_id: data.userId }, { onConflict: "blocker_id,blocked_id", ignoreDuplicates: true });
      await context.supabase
        .from("friendships")
        .delete()
        .or(
          `and(requester_id.eq.${context.userId},addressee_id.eq.${data.userId}),and(requester_id.eq.${data.userId},addressee_id.eq.${context.userId})`,
        );
    } else {
      await context.supabase.from("blocks").delete().eq("blocker_id", context.userId).eq("blocked_id", data.userId);
    }
    return { ok: true };
  });

/* ------------------------------ notifications ----------------------------- */

export const getNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("notifications")
      .select("id, type, title, body, link, read_at, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(40);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const markNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", context.userId)
      .is("read_at", null);
    return { ok: true };
  });
