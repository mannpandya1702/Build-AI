"use client";

// Notification bell (spec §8): unread count + dropdown list, poll-based locally.
import { useEffect, useState } from "react";

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
    return () => {
      live = false;
      clearInterval(t);
    };
  }, []);

  async function markRead() {
    await fetch("/api/notifications", { method: "POST" });
    setUnread(0);
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen(!open);
          if (!open && unread > 0) markRead();
        }}
        className="relative rounded px-2 py-1 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
      >
        Notifications
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute left-0 z-50 mt-2 w-80 rounded-lg border border-zinc-800 bg-zinc-950 p-2 shadow-xl">
          {notes.length === 0 && <p className="p-2 text-sm text-zinc-600">Nothing yet.</p>}
          {notes.map((n) => (
            <div key={n.id} className="rounded p-2 hover:bg-zinc-900">
              <p className="text-sm font-semibold text-zinc-200">{n.title}</p>
              <p className="text-xs text-zinc-500">
                {n.type} · {new Date(n.created_at).toLocaleTimeString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
