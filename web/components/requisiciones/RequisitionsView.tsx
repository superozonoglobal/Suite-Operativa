"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type User = { id: string; name: string };
type Requisition = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  motivo: string | null;
  fromUser: User;
  toUser: User;
};

export function RequisitionsView({
  received,
  sent,
  otherUsers,
}: {
  received: Requisition[];
  sent: Requisition[];
  otherUsers: User[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"received" | "sent">("received");
  const [formOpen, setFormOpen] = useState(false);
  const list = tab === "received" ? received : sent;

  async function respond(id: string, status: "ACEPTADA" | "RECHAZADA") {
    await fetch(`/api/requisitions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  async function submitNew(formData: FormData) {
    await fetch("/api/requisitions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toUserId: formData.get("toUserId"),
        title: formData.get("title"),
        description: formData.get("description") || undefined,
      }),
    });
    setFormOpen(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center justify-between px-6 pt-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Requisiciones</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Pedí trabajo a otro miembro — debe aceptarla antes de volverse tarea.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          className="rounded-full bg-gradient-to-br from-[var(--accent-dim)] to-[#00a050] px-4 py-2 text-sm font-semibold text-white"
        >
          + Nueva requisición
        </button>
      </div>

      {formOpen && (
        <form
          action={submitNew}
          className="mx-6 mt-4 flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
        >
          <select
            name="toUserId"
            required
            className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text)]"
          >
            <option value="">Para quién...</option>
            {otherUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <input
            name="title"
            placeholder="Qué necesitás"
            required
            className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text)]"
          />
          <textarea
            name="description"
            placeholder="Detalles (opcional)"
            rows={2}
            className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text)]"
          />
          <button
            type="submit"
            className="self-start rounded-lg bg-gradient-to-br from-[var(--accent-dim)] to-[#00a050] px-4 py-2 text-sm font-semibold text-white"
          >
            Enviar
          </button>
        </form>
      )}

      <div className="flex gap-2 px-6 pt-6">
        <button
          type="button"
          onClick={() => setTab("received")}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
            tab === "received" ? "bg-[var(--accent)] text-[var(--accent-ink)]" : "border border-[var(--border)] text-[var(--text-muted)]"
          }`}
        >
          Recibidas ({received.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("sent")}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
            tab === "sent" ? "bg-[var(--accent)] text-[var(--accent-ink)]" : "border border-[var(--border)] text-[var(--text-muted)]"
          }`}
        >
          Enviadas ({sent.length})
        </button>
      </div>

      <div className="flex flex-col gap-3 p-6">
        {list.length === 0 && <p className="text-sm text-[var(--text-faint)]">No hay requisiciones aquí.</p>}
        {list.map((req) => (
          <div key={req.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-[var(--text)]">{req.title}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {tab === "received" ? `De ${req.fromUser.name}` : `Para ${req.toUser.name}`}
                </p>
                {req.description && <p className="mt-1 text-sm text-[var(--text-muted)]">{req.description}</p>}
                {req.motivo && <p className="mt-1 text-xs text-[var(--danger)]">Motivo: {req.motivo}</p>}
              </div>
              <span className="rounded-full border border-[var(--border)] bg-[var(--surface-hover)] px-2 py-0.5 text-[10px] uppercase text-[var(--text-muted)]">
                {req.status}
              </span>
            </div>
            {tab === "received" && req.status === "PENDIENTE" && (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => respond(req.id, "ACEPTADA")}
                  className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-ink)]"
                >
                  Aceptar
                </button>
                <button
                  type="button"
                  onClick={() => respond(req.id, "RECHAZADA")}
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-muted)]"
                >
                  Rechazar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
