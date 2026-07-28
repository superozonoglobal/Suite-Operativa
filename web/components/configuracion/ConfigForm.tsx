"use client";

import { useState } from "react";

export function ConfigForm({
  initialDomain,
  initialEmails,
}: {
  initialDomain: string;
  initialEmails: string[];
}) {
  const [domain, setDomain] = useState(initialDomain);
  const [emails, setEmails] = useState(initialEmails.join("\n"));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        allowedEmailDomain: domain,
        allowedEmails: emails.split("\n").map((e) => e.trim()).filter(Boolean),
      }),
    });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <label className="flex flex-col gap-1 text-sm text-[var(--text-muted)]">
        Dominio permitido para registro/login
        <input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="superozonoglobal.com"
          className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-[var(--text)]"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-[var(--text-muted)]">
        Emails adicionales autorizados (uno por línea)
        <textarea
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
          rows={4}
          className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-[var(--text)]"
        />
      </label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="self-start rounded-lg bg-gradient-to-br from-[var(--accent-dim)] to-[#00a050] px-4 py-2 text-sm font-semibold text-white"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
        {saved && <span className="text-xs text-[var(--accent)]">Guardado.</span>}
      </div>
    </div>
  );
}
