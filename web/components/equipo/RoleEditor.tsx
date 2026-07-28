"use client";

import { useState } from "react";
import { ROLES, LEVELS } from "@/lib/constants";

export function RoleEditor({
  userId,
  initialRoleTag,
  initialLevel,
}: {
  userId: string;
  initialRoleTag: string | null;
  initialLevel: string;
}) {
  const [roleTag, setRoleTag] = useState(initialRoleTag ?? "");
  const [level, setLevel] = useState(initialLevel);
  const [saving, setSaving] = useState(false);

  async function save(next: { roleTag?: string; level?: string }) {
    setSaving(true);
    await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    setSaving(false);
  }

  return (
    <div className="flex gap-2">
      <select
        value={roleTag}
        disabled={saving}
        onChange={(e) => {
          setRoleTag(e.target.value);
          save({ roleTag: e.target.value });
        }}
        className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 text-xs text-[var(--text)]"
      >
        <option value="">Sin rol</option>
        {ROLES.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
      <select
        value={level}
        disabled={saving}
        onChange={(e) => {
          setLevel(e.target.value);
          save({ level: e.target.value });
        }}
        className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 text-xs text-[var(--text)]"
      >
        {LEVELS.map((l) => (
          <option key={l.id} value={l.id}>
            {l.label}
          </option>
        ))}
      </select>
    </div>
  );
}
