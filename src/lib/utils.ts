import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** اسم عرض آمن: بلا روابط/بريد، ومحدود بعدد حروف. */
export function safeDisplayName(value: string | null | undefined, max = 18): string {
  let name = (value ?? "").trim();
  if (!name) return "متدرّب";
  if (/^https?:\/\//i.test(name) || name.includes("://")) name = "متدرّب";
  if (name.includes("@")) name = name.split("@")[0] ?? "متدرّب";
  name = name.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ");
  return name.length > max ? `${name.slice(0, max)}…` : name;
}
