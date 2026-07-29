"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewProductForm({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setError(null);
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: formData.get("name"), projectId }),
    });

    if (!res.ok) {
      const json = await res.json();
      setError(json.errors?.[0]?.message ?? "No se pudo crear el producto.");
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
        className="rounded-lg border border-[var(--border)] px-3 py-1 text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
      >
        + Nuevo producto
      </button>
    );
  }

  return (
    <form
      action={handleSubmit}
      className="flex flex-col gap-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-elevated)] p-3"
    >
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
      <input
        name="name"
        placeholder="Nombre del producto"
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
