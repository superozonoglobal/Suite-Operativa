"use client";

import { useState, useRef } from "react";
import { STATUS_COLUMNS } from "@/lib/constants";
import type { TaskWithRelations } from "@/lib/services/tasks";
import { Column } from "@/components/kanban/Column";

export function Board({ initialTasks }: { initialTasks: TaskWithRelations[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const draggedTaskId = useRef<string | null>(null);

  async function handleDrop(newStatus: string) {
    const taskId = draggedTaskId.current;
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus as TaskWithRelations["status"] } : t))
    );

    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!res.ok) {
      // revert on failure
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: task.status } : t)));
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto p-6">
      {STATUS_COLUMNS.map((col) => (
        <Column
          key={col.id}
          label={col.label}
          status={col.id}
          tasks={tasks.filter((t) => t.status === col.id)}
          onDragStart={(taskId) => {
            draggedTaskId.current = taskId;
          }}
          onDrop={handleDrop}
        />
      ))}
    </div>
  );
}
