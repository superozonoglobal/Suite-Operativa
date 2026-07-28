"use client";

import type { TaskWithRelations } from "@/lib/services/tasks";

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function colorFor(id: string) {
  const palette = ["#5CC9FF", "#8FE0A8", "#FFD166", "#FF5C5C", "#C77DFF", "#10B981"];
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return palette[hash % palette.length];
}

export function Card({
  task,
  onDragStart,
}: {
  task: TaskWithRelations;
  onDragStart: (taskId: string) => void;
}) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(task.id)}
      className="cursor-grab rounded-lg border border-[var(--border-soft)] bg-[var(--bg-elevated)] p-3 text-sm text-[var(--text)] shadow-sm active:cursor-grabbing"
    >
      <p className="font-medium">{task.title}</p>
      {task.assignee && (
        <div className="mt-2 flex items-center gap-2">
          <span
            className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-[var(--bg)]"
            style={{ backgroundColor: colorFor(task.assignee.id) }}
          >
            {initialsOf(task.assignee.name)}
          </span>
          <span className="text-xs text-[var(--text-muted)]">{task.assignee.name}</span>
        </div>
      )}
    </div>
  );
}
