import { supabase } from "@/integrations/supabase/client";

const BUCKET = "media";
const signedCache = new Map<string, { url: string; expires: number }>();

/** Uploads a user file into their own folder and returns the storage path. */
export async function uploadMedia(file: File, folder: "avatars" | "posts" | "stories"): Promise<string> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("سجّل الدخول أولًا");
  if (file.size > 5 * 1024 * 1024) throw new Error("الحد الأقصى لحجم الملف 5 ميجابايت");
  if (!/^image\//.test(file.type)) throw new Error("يُسمح بالصور فقط");

  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${uid}/${folder}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw new Error(error.message);
  return path;
}

/** Resolves a stored path to a temporary signed URL (cached in memory). */
export async function mediaUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  if (/^(https?:|data:)/.test(path)) return path;
  const cached = signedCache.get(path);
  if (cached && cached.expires > Date.now()) return cached.url;

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) return null;
  signedCache.set(path, { url: data.signedUrl, expires: Date.now() + 55 * 60 * 1000 });
  return data.signedUrl;
}

/** True when the avatar value is an emoji rather than an uploaded file. */
export function isEmojiAvatar(value: string | null | undefined): boolean {
  return Boolean(value) && !String(value).includes("/") && String(value).length <= 8;
}
