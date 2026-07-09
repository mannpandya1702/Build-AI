"use client";

// Notification bell (spec §8): unread count + dropdown, poll-based locally. Icon button with a
// count badge (skill: tab-badge used sparingly, cleared on visit; aria-label on icon-only button).
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";

interface Note {
  id: string;
  type: string;
  title: string;
  body: string | null;
  created_at: string;
  read: boolean;
}

export default function Bell() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let live = true;
    const tick = async () => {
      try {
        const res = await fetch("/api/notifications", { cache: "no-store" });
        const d = await res.json();
        if (live) {
          setNotes(d.notifications);
          setUnread(d.unread);
        }
      } catch {
        /* dashboard boots before db sometimes; ignore */
      }
    };
    tick();
    const t = setInterval(tick, 3000);
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => {
      live = false;
      clearInterval(t);
      document.removeEventListener("mousedown", close);
    };
  }, []);

  async function markRead() {
    await fetch("/api/notifications", { method: "POST" });
    setUnread(0);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen(!open);
          if (!open && unread > 0) markRead();
        }}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        className="relative grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-muted transition-colors duration-150 hover:bg-surface2 hover:text-ink"
      >
        <Icon name="bell" className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-[18px] place-items-center rounded-full bg-accent px-1 font-display text-[10px] font-bold leading-[18px] text-accentink">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute left-0 z-50 mt-2 max-h-96 w-80 overflow-auto rounded-card border border-line bg-surface p-1.5 shadow-2xl shadow-black/40">
          {notes.length === 0 && <p className="p-3 text-sm text-faint">Nothing yet.</p>}
          {notes.map((n) => (
            <div key={n.id} className="rounded-lg p-2.5 transition-colors duration-150 hover:bg-surface2">
              <p className="text-[13px] font-medium leading-snug text-ink">{n.title}</p>
              <p className="mt-0.5 font-display text-[11px] text-faint">
                {n.type} · {new Date(n.created_at).toLocaleTimeString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
