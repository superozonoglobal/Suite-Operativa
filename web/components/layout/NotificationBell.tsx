"use client";

import { useEffect, useState } from "react";

type Notification = { id: string; text: string; createdAt: string | Date };

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function fetchUnread() {
      try {
        const res = await fetch("/api/notifications");
        const json = await res.json();
        if (active) setNotifications(json.data ?? []);
      } catch {
        // Network/parse failure: leave the previous list in place rather
        // than clearing it, and try again on the next 30s tick.
      }
    }

    fetchUnread();
    const interval = setInterval(fetchUnread, 30_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  async function handleOpen() {
    const willOpen = !open;
    setOpen(willOpen);
    // Mark as read once opened, but keep showing the current list until the
    // next fetch cycle so it doesn't flash empty while the dropdown is open.
    if (willOpen && notifications.length > 0) {
      await fetch("/api/notifications", { method: "PATCH" });
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notificaciones"
        onClick={handleOpen}
        className="relative rounded-full p-2 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
      >
        🔔
        {notifications.length > 0 && (
          <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-[var(--danger)]" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-10 w-72 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-lg">
          {notifications.length === 0 ? (
            <p className="text-sm text-[var(--text-faint)]">Sin notificaciones nuevas.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {notifications.map((n) => (
                <li key={n.id} className="text-sm text-[var(--text)]">
                  {n.text}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
