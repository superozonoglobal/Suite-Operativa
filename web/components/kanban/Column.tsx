"use client";

import { useState } from "react";
import type { TaskWithRelations } from "@/lib/services/tasks";
import { Card } from "@/components/kanban/Card";

export function Column({
  label,
  status,
  tasks,
  onDragStart,
  onDrop,
}: {
  label: string;
  status: string;
  tasks: TaskWithRelations[];
  onDragStart: (taskId: string) => void;
  onDrop: (status: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={() => {
        setDragOver(false);
        onDrop(status);
      }}
      className={`flex min-h-[200px] w-72 shrink-0 flex-col gap-2 rounded-xl border p-3 transition-colors ${
        dragOver ? "border-[var(--accent)] bg-[var(--surface-hover)]" : "border-[var(--border)] bg-[var(--surface)]"
      }`}
    >
      <div className="flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        <span>{label}</span>
        <span>{tasks.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <Card key={task.id} task={task} onDragStart={onDragStart} />
        ))}
      </div>
    </div>
  );
}
