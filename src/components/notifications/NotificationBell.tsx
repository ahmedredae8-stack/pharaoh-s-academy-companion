import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { getNotifications, markNotificationsRead } from "@/lib/community.functions";

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export function NotificationBell({ enabled }: { enabled: boolean }) {
  const queryClient = useQueryClient();
  const fetchNotifications = useServerFn(getNotifications);
  const markRead = useServerFn(markNotificationsRead);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const list = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifications(),
    enabled,
    refetchInterval: enabled ? 30000 : false,
  });

  const readMut = useMutation({
    mutationFn: () => markRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!enabled) return null;

  const rows = (list.data ?? []) as NotificationRow[];
  const unread = rows.filter((row) => !row.read_at).length;

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        aria-label="الإشعارات"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next && unread > 0) readMut.mutate();
        }}
        className="relative rounded-xl bg-duo-surface-2 p-2 text-duo-muted"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 ? (
          <span className="absolute -top-1 -left-1 min-w-5 rounded-full bg-duo-red px-1 text-[10px] font-black text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute left-0 z-50 mt-2 max-h-96 w-72 overflow-y-auto rounded-2xl border-2 border-duo-line bg-duo-surface p-2 shadow-xl">
          <p className="px-2 py-1 text-xs font-black text-duo-muted">مركز الإشعارات</p>
          {rows.length === 0 ? (
            <p className="px-2 py-4 text-center text-xs font-bold text-duo-muted">لا توجد إشعارات بعد.</p>
          ) : null}
          {rows.map((row) => {
            const content = (
              <div
                className={`rounded-xl p-2 text-right ${row.read_at ? "bg-transparent" : "bg-duo-surface-2"}`}
              >
                <p className="text-xs font-black text-duo-text">{row.title}</p>
                {row.body ? <p className="text-[11px] font-bold text-duo-muted">{row.body}</p> : null}
                <p className="text-[10px] text-duo-muted">
                  {new Date(row.created_at).toLocaleString("ar-EG")}
                </p>
              </div>
            );
            return row.link ? (
              <Link key={row.id} to={row.link as any} onClick={() => setOpen(false)} className="block">
                {content}
              </Link>
            ) : (
              <div key={row.id}>{content}</div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
