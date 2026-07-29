"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ChecklistItem = { id: string; label: string; done: boolean };

type Goal = {
  id: string;
  title: string;
  type: string;
  target: number | null;
  current: number;
  status: string;
  checklistItems: ChecklistItem[];
  user: { name: string } | null;
};

export function GoalCard({ goal, canApprove = false }: { goal: Goal; canApprove?: boolean }) {
  const [current, setCurrent] = useState(goal.current);
  const [items, setItems] = useState(goal.checklistItems);
  const [approving, setApproving] = useState(false);
  const router = useRouter();

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

  async function approve() {
    setApproving(true);
    const res = await fetch(`/api/goals/${goal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "APROBADA" }),
    });
    setApproving(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="mb-1 flex items-start justify-between gap-2">
        <p className="font-medium text-[var(--text)]">{goal.title}</p>
        {goal.status === "APROBADA" ? (
          <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-xs font-semibold text-[var(--accent-ink)]">
            Aprobada
          </span>
        ) : (
          canApprove && (
            <button
              type="button"
              onClick={approve}
              disabled={approving}
              className="rounded-full border border-[var(--border)] px-2 py-0.5 text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
            >
              {approving ? "Aprobando..." : "Aprobar"}
            </button>
          )
        )}
      </div>
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
