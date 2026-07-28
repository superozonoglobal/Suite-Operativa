"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { WEEKDAY_LABELS, buildMonthGrid } from "@/lib/calendarGrid";
import { PLATFORMS } from "@/lib/constants";

type Post = {
  id: string;
  title: string;
  platform: string;
  scheduledDate: string | Date | null;
};

type SchedulableTask = {
  id: string;
  title: string;
};

export function CalendarGrid({
  year,
  month,
  posts,
  schedulableTasks,
}: {
  year: number;
  month: number;
  posts: Post[];
  schedulableTasks: SchedulableTask[];
}) {
  const router = useRouter();
  const draggedTaskId = useRef<string | null>(null);
  const [dragOverIso, setDragOverIso] = useState<string | null>(null);

  const weeks = buildMonthGrid(year, month);

  const postsByDay = new Map<string, Post[]>();
  for (const post of posts) {
    if (!post.scheduledDate) continue;
    const iso = new Date(post.scheduledDate).toISOString().slice(0, 10);
    postsByDay.set(iso, [...(postsByDay.get(iso) ?? []), post]);
  }

  async function handleDrop(iso: string) {
    const taskId = draggedTaskId.current;
    setDragOverIso(null);
    if (!taskId) return;

    await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, platform: "INSTAGRAM", scheduledDate: iso }),
    });
    router.refresh();
  }

  return (
    <div className="flex gap-4 p-6">
      <div className="flex-1">
        <div className="grid grid-cols-7 gap-2">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="px-1 text-xs font-semibold text-[var(--text-faint)]">
              {label}
            </div>
          ))}
          {weeks.flat().map((cell, i) => {
            if (!cell) return <div key={i} />;
            const dayPosts = postsByDay.get(cell.iso) ?? [];
            const isOver = dragOverIso === cell.iso;

            return (
              <div
                key={cell.iso}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverIso(cell.iso);
                }}
                onDragLeave={() => setDragOverIso(null)}
                onDrop={() => handleDrop(cell.iso)}
                className={`min-h-[110px] rounded-lg border p-2 transition-colors ${
                  isOver ? "border-[var(--accent)] bg-[var(--surface-hover)]" : "border-[var(--border-soft)] bg-[var(--bg-elevated)]"
                }`}
              >
                <p className="mb-1 text-xs text-[var(--text-faint)]">{cell.day}</p>
                <div className="flex flex-col gap-1">
                  {dayPosts.map((post) => {
                    const color = PLATFORMS.find((p) => p.id === post.platform)?.color ?? "var(--accent)";
                    return (
                      <span
                        key={post.id}
                        className="truncate rounded px-1.5 py-0.5 text-[10px] font-medium text-[var(--bg)]"
                        style={{ backgroundColor: color }}
                      >
                        {post.title}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <aside className="w-72 shrink-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Piezas listas para programar
        </h2>
        {schedulableTasks.length === 0 ? (
          <p className="text-sm text-[var(--text-faint)]">
            No hay piezas aprobadas pendientes de programar.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {schedulableTasks.map((task) => (
              <div
                key={task.id}
                draggable
                onDragStart={() => {
                  draggedTaskId.current = task.id;
                }}
                className="cursor-grab rounded-lg border border-[var(--border-soft)] bg-[var(--bg-elevated)] p-2 text-sm text-[var(--text)]"
              >
                {task.title}
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-[var(--text-faint)]">
          Arrastrá una pieza a un día del calendario para programarla.
        </p>
      </aside>
    </div>
  );
}
