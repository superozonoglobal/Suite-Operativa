"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GoalForm({ month }: { month: string }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("NUMERO");
  const [scope, setScope] = useState("PERSONAL");
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    const checklistRaw = formData.get("checklist") as string;
    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: formData.get("title"),
        type,
        scope,
        target: type !== "CHECKLIST" ? Number(formData.get("target")) : undefined,
        month,
        checklist:
          type === "CHECKLIST"
            ? checklistRaw.split("\n").map((s) => s.trim()).filter(Boolean)
            : undefined,
      }),
    });
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-gradient-to-br from-[var(--accent-dim)] to-[#00a050] px-4 py-2 text-sm font-semibold text-white"
      >
        + Proponer meta
      </button>
    );
  }

  return (
    <form
      action={handleSubmit}
      className="flex w-full max-w-md flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
    >
      <input
        name="title"
        placeholder="Título de la meta"
        required
        className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text)]"
      />
      <div className="flex gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="flex-1 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 text-sm text-[var(--text)]"
        >
          <option value="NUMERO">Número</option>
          <option value="PORCENTAJE">Porcentaje</option>
          <option value="CHECKLIST">Checklist</option>
        </select>
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          className="flex-1 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 text-sm text-[var(--text)]"
        >
          <option value="PERSONAL">Personal</option>
          <option value="EQUIPO">Equipo</option>
        </select>
      </div>

      {type !== "CHECKLIST" ? (
        <input
          name="target"
          type="number"
          placeholder="Meta objetivo"
          required
          className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text)]"
        />
      ) : (
        <textarea
          name="checklist"
          placeholder="Un ítem por línea"
          rows={3}
          className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text)]"
        />
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-lg bg-gradient-to-br from-[var(--accent-dim)] to-[#00a050] px-4 py-2 text-sm font-semibold text-white"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-muted)]"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
