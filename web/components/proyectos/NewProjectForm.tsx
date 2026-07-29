"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewProjectForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setError(null);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: formData.get("name") }),
    });

    if (!res.ok) {
      const json = await res.json();
      setError(json.errors?.[0]?.message ?? "No se pudo crear el proyecto.");
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
        className="rounded-full bg-gradient-to-br from-[var(--accent-dim)] to-[#00a050] px-4 py-2 text-sm font-semibold text-white"
      >
        + Nuevo proyecto
      </button>
    );
  }

  return (
    <form
      action={handleSubmit}
      className="flex w-full max-w-md flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
    >
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      <input
        name="name"
        placeholder="Nombre del proyecto"
        required
        className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text)]"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-lg bg-gradient-to-br from-[var(--accent-dim)] to-[#00a050] px-4 py-2 text-sm font-semibold text-white"
        >
          Crear
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
