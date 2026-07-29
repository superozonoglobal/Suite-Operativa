"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewTaskForm({ projectId, productId }: { projectId: string; productId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setError(null);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: formData.get("title"), projectId, productId }),
    });

    if (!res.ok) {
      const json = await res.json();
      setError(json.errors?.[0]?.message ?? "No se pudo crear la tarea.");
      return;
    }

    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-[var(--accent)] hover:underline"
      >
        + Nueva tarea
      </button>
    );
  }

  return (
    <form action={handleSubmit} className="mt-2 flex flex-col gap-2">
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
      <input
        name="title"
        placeholder="Título de la tarea"
        required
        className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-sm text-[var(--text)]"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-[var(--accent-ink)]"
        >
          Crear
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-muted)]"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
