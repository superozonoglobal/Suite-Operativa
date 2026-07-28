"use client";

import { useState } from "react";

type ChecklistItem = { id: string; label: string; done: boolean };

type Goal = {
  id: string;
  title: string;
  type: string;
  target: number | null;
  current: number;
  checklistItems: ChecklistItem[];
  user: { name: string } | null;
};

export function GoalCard({ goal }: { goal: Goal }) {
  const [current, setCurrent] = useState(goal.current);
  const [items, setItems] = useState(goal.checklistItems);

  async function saveProgress(value: number) {
    setCurrent(value);
    await fetch(`/api/goals/${goal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current: value }),
    });
  }

  async function toggleItem(itemId: string) {
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)));
    await fetch(`/api/goals/checklist-items/${itemId}`, { method: "PATCH" });
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="font-medium text-[var(--text)]">{goal.title}</p>
      <p className="mb-3 text-xs text-[var(--text-muted)]">{goal.user ? goal.user.name : "Meta de equipo"}</p>

      {(goal.type === "NUMERO" || goal.type === "PORCENTAJE") && (
        <>
          <div className="h-2 rounded-full bg-[var(--border-soft)]">
            <div
              className="h-2 rounded-full bg-[var(--accent)]"
              style={{ width: `${goal.target ? Math.min(100, (current / goal.target) * 100) : 0}%` }}
            />
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <input
              type="number"
              value={current}
              onChange={(e) => saveProgress(Number(e.target.value))}
              className="w-16 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 text-[var(--text)]"
            />
            <span>
              / {goal.target}
              {goal.type === "PORCENTAJE" ? "%" : ""}
            </span>
          </div>
        </>
      )}

      {goal.type === "CHECKLIST" && (
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-2 text-sm text-[var(--text)]">
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => toggleItem(item.id)}
                className="accent-[var(--accent)]"
              />
              <span className={item.done ? "line-through text-[var(--text-faint)]" : ""}>{item.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
