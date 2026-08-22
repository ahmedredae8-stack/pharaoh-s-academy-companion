import { useEffect, useState } from "react";

import { isEmojiAvatar, mediaUrl } from "@/lib/media";

export function Avatar({
  value,
  name,
  size = 40,
}: {
  value?: string | null;
  name?: string | null;
  size?: number;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (value && !isEmojiAvatar(value)) {
      void mediaUrl(value).then((resolved) => {
        if (active) setUrl(resolved);
      });
    } else {
      setUrl(null);
    }
    return () => {
      active = false;
    };
  }, [value]);

  const style = { width: size, height: size, fontSize: size * 0.5 };

  if (url) {
    return (
      <img
        src={url}
        alt={name ? `صورة ${name}` : "صورة المستخدم"}
        style={style}
        className="rounded-full border-2 border-duo-line object-cover"
      />
    );
  }

  return (
    <span
      style={style}
      className="flex items-center justify-center rounded-full border-2 border-duo-line bg-duo-surface-2 leading-none"
      aria-hidden={!name}
    >
      {isEmojiAvatar(value) ? value : (name?.trim()?.[0] ?? "🕵️")}
    </span>
  );
}
