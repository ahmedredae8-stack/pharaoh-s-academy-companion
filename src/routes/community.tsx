import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  Heart,
  Image as ImageIcon,
  MessageCircle,
  Search,
  Send,
  ShieldOff,
  Sparkles,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useAccount } from "@/components/account/AccountProvider";
import { Avatar } from "@/components/community/Avatar";
import { DuoLayout } from "@/components/duo/DuoLayout";
import {
  addComment,
  blockUser,
  createPost,
  createStory,
  deletePost,
  getComments,
  getFeed,
  getNotifications,
  getStories,
  getThread,
  listFriends,
  markNotificationsRead,
  respondFriendRequest,
  searchPeople,
  sendFriendRequest,
  sendMessage,
  toggleLike,
} from "@/lib/community.functions";
import { uploadMedia, mediaUrl } from "@/lib/media";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "مجتمع فرعون Ai — أصدقاء ومنشورات" },
      {
        name: "description",
        content: "شارك منشوراتك وحالاتك اليومية، ابحث عن أصدقاء، وتراسل خاصة داخل مجتمع فرعون Ai للأمن السيبراني.",
      },
      { property: "og:title", content: "مجتمع فرعون Ai — أصدقاء ومنشورات" },
      {
        property: "og:description",
        content: "منشورات، حالات ٢٤ ساعة، رسائل خاصة وبحث عن أصدقاء داخل مجتمع فرعون Ai.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CommunityPage,
});

type Tab = "feed" | "friends" | "messages";

function CommunityPage() {
  const { session, loading } = useAccount();
  const [tab, setTab] = useState<Tab>("feed");

  if (loading) {
    return (
      <DuoLayout>
        <p className="py-16 text-center text-duo-muted">جارٍ التحميل…</p>
      </DuoLayout>
    );
  }

  if (!session) {
    return (
      <DuoLayout>
        <div className="duo-card space-y-3 p-6 text-center">
          <h1 className="text-xl font-black">مجتمع فرعون Ai</h1>
          <p className="text-sm text-duo-muted">سجّل الدخول للمشاركة في المنشورات والحالات والرسائل الخاصة.</p>
          <Link to="/auth" search={{ redirect: "/community" }} className="duo-btn inline-block">
            تسجيل الدخول
          </Link>
        </div>
      </DuoLayout>
    );
  }

  return (
    <DuoLayout>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-black">المجتمع</h1>
        <NotificationsBell />
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2 rounded-2xl border-2 border-duo-line bg-duo-surface p-1 text-sm font-bold">
        {(
          [
            ["feed", "المنشورات"],
            ["friends", "الأصدقاء"],
            ["messages", "الرسائل"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-xl py-2 ${tab === key ? "bg-duo-surface-2 text-duo-green" : "text-duo-muted"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "feed" ? <FeedTab /> : null}
      {tab === "friends" ? <FriendsTab /> : null}
      {tab === "messages" ? <MessagesTab /> : null}
    </DuoLayout>
  );
}

/* ------------------------------ notifications ----------------------------- */

function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotifications(),
    refetchInterval: 30_000,
  });
  const unread = data.filter((n: any) => !n.read_at).length;

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (unread) void markNotificationsRead().then(() => queryClient.invalidateQueries({ queryKey: ["notifications"] }));
        }}
        className="relative rounded-full border-2 border-duo-line bg-duo-surface p-2"
        aria-label="الإشعارات"
      >
        <Bell className="h-5 w-5 text-duo-blue" />
        {unread ? (
          <span className="absolute -top-1 -left-1 min-w-5 rounded-full bg-duo-red px-1 text-[10px] font-black text-white">
            {unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute left-0 z-50 mt-2 max-h-96 w-72 overflow-y-auto rounded-2xl border-2 border-duo-line bg-duo-surface p-2 shadow-xl">
          {data.length === 0 ? (
            <p className="p-4 text-center text-xs text-duo-muted">لا توجد إشعارات بعد</p>
          ) : (
            data.map((n: any) => (
              <div key={n.id} className="rounded-xl p-2 text-right hover:bg-duo-surface-2">
                <p className="text-sm font-bold">{n.title}</p>
                {n.body ? <p className="text-xs text-duo-muted">{n.body}</p> : null}
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

/* ---------------------------------- feed ---------------------------------- */

function FeedTab() {
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [openComments, setOpenComments] = useState<string | null>(null);

  const { data: posts = [], isLoading } = useQuery({ queryKey: ["feed"], queryFn: () => getFeed({ data: {} }) });

  const publish = async () => {
    if (!content.trim()) return;
    setBusy(true);
    try {
      const imageUrl = file ? await uploadMedia(file, "posts") : undefined;
      await createPost({ data: { content: content.trim(), ...(imageUrl ? { imageUrl } : {}) } });
      setContent("");
      setFile(null);
      await queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast.success("تم نشر المنشور");
    } catch (error) {
      toast.error(humanError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Stories />

      <div className="duo-card space-y-3 p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="بم تفكّر يا محارب؟"
          className="w-full resize-none rounded-xl border-2 border-duo-line bg-duo-surface-2 p-3 text-sm outline-none"
        />
        <div className="flex items-center justify-between gap-2">
          <label className="flex cursor-pointer items-center gap-1 text-xs font-bold text-duo-blue">
            <ImageIcon className="h-4 w-4" />
            {file ? file.name.slice(0, 18) : "إضافة صورة"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <button onClick={publish} disabled={busy || !content.trim()} className="duo-btn disabled:opacity-50">
            {busy ? "جارٍ النشر…" : "نشر"}
          </button>
        </div>
      </div>

      {isLoading ? <p className="text-center text-duo-muted">جارٍ تحميل المنشورات…</p> : null}
      {posts.map((post: any) => (
        <article key={post.id} className="duo-card space-y-3 p-4">
          <header className="flex items-center gap-2">
            <Avatar value={post.avatar_url} name={post.display_name} />
            <div className="flex-1">
              <p className="text-sm font-black">{post.display_name}</p>
              <p className="text-[11px] text-duo-muted">{formatDate(post.created_at)}</p>
            </div>
          </header>
          <p className="whitespace-pre-wrap text-sm leading-6">{post.content}</p>
          {post.image_url ? <PostImage path={post.image_url} /> : null}
          <div className="flex items-center gap-4 border-t-2 border-duo-line pt-2 text-xs font-bold">
            <button
              onClick={async () => {
                await toggleLike({ data: { postId: post.id, liked: post.liked } });
                await queryClient.invalidateQueries({ queryKey: ["feed"] });
              }}
              className={`flex items-center gap-1 ${post.liked ? "text-duo-red" : "text-duo-muted"}`}
            >
              <Heart className={`h-4 w-4 ${post.liked ? "fill-current" : ""}`} /> {post.likes}
            </button>
            <button
              onClick={() => setOpenComments(openComments === post.id ? null : post.id)}
              className="flex items-center gap-1 text-duo-muted"
            >
              <MessageCircle className="h-4 w-4" /> {post.comments}
            </button>
            <button
              onClick={async () => {
                if (!confirm("حذف المنشور؟")) return;
                try {
                  await deletePost({ data: { postId: post.id } });
                  await queryClient.invalidateQueries({ queryKey: ["feed"] });
                } catch (error) {
                  toast.error(humanError(error));
                }
              }}
              className="mr-auto flex items-center gap-1 text-duo-muted"
              aria-label="حذف"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          {openComments === post.id ? <Comments postId={post.id} /> : null}
        </article>
      ))}
    </div>
  );
}

function PostImage({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    void mediaUrl(path).then(setUrl);
  }, [path]);
  if (!url) return null;
  return <img src={url} alt="صورة المنشور" loading="lazy" className="w-full rounded-xl border-2 border-duo-line object-cover" />;
}

function Comments({ postId }: { postId: string }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const { data = [] } = useQuery({ queryKey: ["comments", postId], queryFn: () => getComments({ data: { postId } }) });

  return (
    <div className="space-y-2 border-t-2 border-duo-line pt-3">
      {data.map((c: any) => (
        <div key={c.id} className="flex items-start gap-2">
          <Avatar value={c.avatar_url} name={c.display_name} size={28} />
          <div className="flex-1 rounded-xl bg-duo-surface-2 p-2">
            <p className="text-xs font-black">{c.display_name}</p>
            <p className="text-sm">{c.content}</p>
          </div>
        </div>
      ))}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!text.trim()) return;
          try {
            await addComment({ data: { postId, content: text.trim() } });
            setText("");
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ["comments", postId] }),
              queryClient.invalidateQueries({ queryKey: ["feed"] }),
            ]);
          } catch (error) {
            toast.error(humanError(error));
          }
        }}
        className="flex gap-2"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
          placeholder="اكتب تعليقًا…"
          className="flex-1 rounded-xl border-2 border-duo-line bg-duo-surface-2 px-3 py-2 text-sm outline-none"
        />
        <button className="rounded-xl border-2 border-duo-line px-3" aria-label="إرسال">
          <Send className="h-4 w-4 text-duo-green" />
        </button>
      </form>
    </div>
  );
}

/* --------------------------------- stories -------------------------------- */

function Stories() {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data = [] } = useQuery({ queryKey: ["stories"], queryFn: () => getStories() });

  return (
    <div className="duo-card p-3">
      <div className="mb-2 flex items-center gap-1 text-xs font-black text-duo-muted">
        <Sparkles className="h-4 w-4 text-duo-yellow" /> حالات آخر ٢٤ ساعة
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex w-16 shrink-0 flex-col items-center gap-1 text-[10px] font-bold text-duo-muted"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-duo-green text-xl text-duo-green">
            +
          </span>
          {busy ? "جارٍ…" : "حالتي"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const selected = e.target.files?.[0];
            if (!selected) return;
            setBusy(true);
            try {
              const path = await uploadMedia(selected, "stories");
              const caption = prompt("نص الحالة (اختياري)") ?? "";
              await createStory({ data: { mediaUrl: path, ...(caption ? { content: caption } : {}) } });
              await queryClient.invalidateQueries({ queryKey: ["stories"] });
              toast.success("نُشرت حالتك وتختفي بعد ٢٤ ساعة");
            } catch (error) {
              toast.error(humanError(error));
            } finally {
              setBusy(false);
              if (inputRef.current) inputRef.current.value = "";
            }
          }}
        />
        {data.map((story: any) => (
          <StoryBubble key={story.id} story={story} />
        ))}
      </div>
    </div>
  );
}

function StoryBubble({ story }: { story: any }) {
  const [url, setUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    void mediaUrl(story.media_url).then(setUrl);
  }, [story.media_url]);

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex w-16 shrink-0 flex-col items-center gap-1 text-[10px] font-bold">
        <span className="rounded-full p-[2px] ring-2 ring-duo-yellow">
          {url ? (
            <img src={url} alt="حالة" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <Avatar value={story.avatar_url} name={story.display_name} size={56} />
          )}
        </span>
        <span className="truncate">{story.display_name}</span>
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setOpen(false)}
        >
          <div className="max-w-sm space-y-2 text-center">
            {url ? <img src={url} alt="حالة" className="max-h-[70vh] rounded-2xl object-contain" /> : null}
            {story.content ? <p className="text-sm font-bold text-white">{story.content}</p> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

/* --------------------------------- friends -------------------------------- */

function FriendsTab() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const { data: friends = [] } = useQuery({ queryKey: ["friends"], queryFn: () => listFriends() });

  const search = useMutation({
    mutationFn: (value: string) => searchPeople({ data: { query: value } }),
    onSuccess: (rows) => setResults(rows as any[]),
    onError: (error) => toast.error(humanError(error)),
  });

  const incoming = friends.filter((f: any) => f.status === "pending" && f.direction === "incoming");
  const accepted = friends.filter((f: any) => f.status === "accepted");
  const outgoing = friends.filter((f: any) => f.status === "pending" && f.direction === "outgoing");

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim().length < 2) {
            toast.error("اكتب حرفين على الأقل");
            return;
          }
          search.mutate(query.trim());
        }}
        className="duo-card flex gap-2 p-3"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث باسم المستخدم…"
          className="flex-1 rounded-xl border-2 border-duo-line bg-duo-surface-2 px-3 py-2 text-sm outline-none"
        />
        <button className="rounded-xl border-2 border-duo-line px-3" aria-label="بحث">
          <Search className="h-4 w-4 text-duo-blue" />
        </button>
      </form>

      {results.length > 0 ? (
        <section className="duo-card space-y-2 p-4">
          <h2 className="text-sm font-black">نتائج البحث</h2>
          {results.map((person) => (
            <div key={person.id} className="flex items-center gap-2">
              <Avatar value={person.avatar_url} name={person.display_name} size={36} />
              <span className="flex-1 text-sm font-bold">{person.display_name ?? "متدرّب"}</span>
              {person.friend_status === "none" ? (
                <button
                  onClick={async () => {
                    try {
                      await sendFriendRequest({ data: { userId: person.id } });
                      toast.success("تم إرسال طلب الصداقة");
                      setResults((rows) => rows.map((r) => (r.id === person.id ? { ...r, friend_status: "pending" } : r)));
                    } catch (error) {
                      toast.error(humanError(error));
                    }
                  }}
                  className="flex items-center gap-1 rounded-xl border-2 border-duo-line px-3 py-1 text-xs font-bold text-duo-green"
                >
                  <UserPlus className="h-4 w-4" /> إضافة
                </button>
              ) : (
                <span className="text-xs text-duo-muted">
                  {person.friend_status === "accepted" ? "صديق" : "بانتظار الرد"}
                </span>
              )}
            </div>
          ))}
        </section>
      ) : null}

      {incoming.length > 0 ? (
        <section className="duo-card space-y-2 p-4">
          <h2 className="text-sm font-black">طلبات واردة</h2>
          {incoming.map((f: any) => (
            <div key={f.friendship_id} className="flex items-center gap-2">
              <Avatar value={f.avatar_url} name={f.display_name} size={36} />
              <span className="flex-1 text-sm font-bold">{f.display_name}</span>
              <button
                onClick={async () => {
                  await respondFriendRequest({ data: { friendshipId: f.friendship_id, accept: true } });
                  await queryClient.invalidateQueries({ queryKey: ["friends"] });
                }}
                className="rounded-xl bg-duo-green px-3 py-1 text-xs font-black text-white"
              >
                قبول
              </button>
              <button
                onClick={async () => {
                  await respondFriendRequest({ data: { friendshipId: f.friendship_id, accept: false } });
                  await queryClient.invalidateQueries({ queryKey: ["friends"] });
                }}
                className="rounded-xl border-2 border-duo-line px-3 py-1 text-xs font-bold text-duo-muted"
              >
                رفض
              </button>
            </div>
          ))}
        </section>
      ) : null}

      <section className="duo-card space-y-2 p-4">
        <h2 className="text-sm font-black">أصدقائي ({accepted.length})</h2>
        {accepted.length === 0 ? <p className="text-xs text-duo-muted">لا يوجد أصدقاء بعد — ابحث وأرسل طلبًا.</p> : null}
        {accepted.map((f: any) => (
          <div key={f.friendship_id} className="flex items-center gap-2">
            <Avatar value={f.avatar_url} name={f.display_name} size={36} />
            <span className="flex-1 text-sm font-bold">{f.display_name}</span>
            <button
              onClick={async () => {
                if (!confirm(`حظر ${f.display_name}؟`)) return;
                await blockUser({ data: { userId: f.user_id, block: true } });
                await queryClient.invalidateQueries({ queryKey: ["friends"] });
                toast.success("تم الحظر");
              }}
              className="flex items-center gap-1 text-xs font-bold text-duo-red"
            >
              <ShieldOff className="h-4 w-4" /> حظر
            </button>
          </div>
        ))}
        {outgoing.length > 0 ? (
          <p className="pt-2 text-xs text-duo-muted">طلبات مُرسَلة بانتظار الرد: {outgoing.length}</p>
        ) : null}
      </section>
    </div>
  );
}

/* -------------------------------- messages -------------------------------- */

function MessagesTab() {
  const queryClient = useQueryClient();
  const [active, setActive] = useState<{ id: string; name: string } | null>(null);
  const [text, setText] = useState("");
  const { data: friends = [] } = useQuery({ queryKey: ["friends"], queryFn: () => listFriends() });
  const accepted = friends.filter((f: any) => f.status === "accepted");

  const { data: thread = [] } = useQuery({
    queryKey: ["thread", active?.id],
    queryFn: () => getThread({ data: { userId: active!.id } }),
    enabled: Boolean(active),
    refetchInterval: 8000,
  });

  if (!active) {
    return (
      <div className="duo-card space-y-2 p-4">
        <h2 className="text-sm font-black">محادثاتي</h2>
        {accepted.length === 0 ? <p className="text-xs text-duo-muted">أضف أصدقاء لبدء محادثة خاصة.</p> : null}
        {accepted.map((f: any) => (
          <button
            key={f.friendship_id}
            onClick={() => setActive({ id: f.user_id, name: f.display_name })}
            className="flex w-full items-center gap-2 rounded-xl p-2 text-right hover:bg-duo-surface-2"
          >
            <Avatar value={f.avatar_url} name={f.display_name} size={36} />
            <span className="flex-1 text-sm font-bold">{f.display_name}</span>
            {f.unread ? (
              <span className="rounded-full bg-duo-red px-2 text-[10px] font-black text-white">{f.unread}</span>
            ) : null}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="duo-card flex h-[70vh] flex-col p-3">
      <div className="mb-2 flex items-center gap-2 border-b-2 border-duo-line pb-2">
        <button onClick={() => setActive(null)} className="text-xs font-bold text-duo-blue">
          رجوع
        </button>
        <span className="flex-1 text-sm font-black">{active.name}</span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto">
        {thread.map((m: any) => (
          <div
            key={m.id}
            className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
              m.recipient_id === active.id
                ? "mr-auto bg-duo-green text-white"
                : "ml-auto bg-duo-surface-2"
            }`}
          >
            {m.content}
          </div>
        ))}
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!text.trim()) return;
          try {
            await sendMessage({ data: { userId: active.id, content: text.trim() } });
            setText("");
            await queryClient.invalidateQueries({ queryKey: ["thread", active.id] });
          } catch (error) {
            toast.error(humanError(error));
          }
        }}
        className="mt-2 flex gap-2"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1000}
          placeholder="اكتب رسالة…"
          className="flex-1 rounded-xl border-2 border-duo-line bg-duo-surface-2 px-3 py-2 text-sm outline-none"
        />
        <button className="rounded-xl border-2 border-duo-line px-3" aria-label="إرسال">
          <Send className="h-4 w-4 text-duo-green" />
        </button>
      </form>
    </div>
  );
}

/* --------------------------------- helpers -------------------------------- */

function formatDate(value: string) {
  return new Date(value).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" });
}

function humanError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("RATE_LIMIT")) return "تمهّل قليلًا — عدد كبير من المحاولات";
  if (message.includes("DUPLICATE")) return "نشرت هذا المحتوى بالفعل";
  if (message.includes("row-level security") || message.includes("violates")) return "غير مسموح بهذا الإجراء";
  return message;
}
