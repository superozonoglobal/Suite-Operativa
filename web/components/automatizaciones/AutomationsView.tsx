"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Automation = { id: string; name: string; description: string | null; trigger: string; enabled: boolean };

const TRIGGER_OPTIONS = [
  { value: "task:due_soon", label: "Tarea por vencer" },
  { value: "task:overdue", label: "Tarea vencida" },
  { value: "task:recurring", label: "Tarea recurrente" },
  { value: "requisition:pending", label: "Requisición pendiente" },
];

export function AutomationsView({ automations, canEdit }: { automations: Automation[]; canEdit: boolean }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);

  async function submitNew(formData: FormData) {
    await fetch("/api/automations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        trigger: formData.get("trigger"),
        action: { description: formData.get("action") },
      }),
    });
    setFormOpen(false);
    router.refresh();
  }

  async function toggle(id: string, enabled: boolean) {
    await fetch(`/api/automations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    router.refresh();
  }

  return (
    <>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Automatizaciones</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Reglas &quot;cuando X entonces Y&quot; — sin pedir un cambio de código cada vez.
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setFormOpen((v) => !v)}
            className="rounded-full bg-gradient-to-br from-[var(--accent-dim)] to-[#00a050] px-4 py-2 text-sm font-semibold text-white"
          >
            + Nueva automatización
          </button>
        )}
      </div>

      {formOpen && (
        <form
          action={submitNew}
          className="mt-4 flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
        >
          <input
            name="name"
            placeholder="Nombre de la regla"
            required
            className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text)]"
          />
          <select
            name="trigger"
            required
            className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text)]"
          >
            {TRIGGER_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <textarea
            name="action"
            placeholder="Qué debería pasar (ej: avisar por notificación)"
            rows={2}
            required
            className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text)]"
          />
          <button
            type="submit"
            className="self-start rounded-lg bg-gradient-to-br from-[var(--accent-dim)] to-[#00a050] px-4 py-2 text-sm font-semibold text-white"
          >
            Guardar
          </button>
        </form>
      )}

      {automations.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-2 text-center">
          <span className="text-3xl">🛡️</span>
          <p className="text-lg font-semibold text-[var(--text)]">Sin automatizaciones todavía</p>
          <p className="text-sm text-[var(--text-muted)]">Creá una regla para que la app avise o genere tareas por vos.</p>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {automations.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div>
                <p className="font-medium text-[var(--text)]">{a.name}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {TRIGGER_OPTIONS.find((t) => t.value === a.trigger)?.label ?? a.trigger}
                </p>
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => toggle(a.id, !a.enabled)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    a.enabled ? "bg-[var(--accent)] text-[var(--accent-ink)]" : "border border-[var(--border)] text-[var(--text-muted)]"
                  }`}
                >
                  {a.enabled ? "Activa" : "Inactiva"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="mt-8 max-w-2xl text-xs text-[var(--text-faint)]">
        Por ahora estas reglas quedan guardadas pero no se ejecutan solas todavía — activarlas de verdad (que la
        app avise o genere tareas automáticamente) es un paso siguiente, no incluido en esta versión.
      </p>
    </>
  );
}
