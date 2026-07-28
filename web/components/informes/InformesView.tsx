"use client";

import { useEffect, useMemo, useState } from "react";
import { ROLES, STATUS_COLUMNS } from "@/lib/constants";
import { filterTasks, type ReportTask } from "@/lib/reports/filterTasks";
import { buildActivityReportDoc } from "@/lib/reports/buildActivityReportDoc";

export function InformesView({ generatedByName }: { generatedByName: string }) {
  const [tasks, setTasks] = useState<ReportTask[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((json) => setTasks(json.data ?? []));
  }, []);

  const opts = {
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    roleFilter: roleFilter || undefined,
    statusFilter: statusFilter || undefined,
  };

  const filtered = useMemo(() => filterTasks(tasks, opts), [tasks, fromDate, toDate, roleFilter, statusFilter]);
  const rolesInPlay = useMemo(
    () => new Set(filtered.map((t) => t.roleTag).filter(Boolean)).size,
    [filtered]
  );

  function download() {
    const doc = buildActivityReportDoc(tasks, { ...opts, generatedByName });
    const today = new Date().toISOString().slice(0, 10);
    doc.save(`informe-super-ozono-${today}.pdf`);
  }

  return (
    <>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Filtros del informe
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs text-[var(--text-muted)]">
            Desde
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1.5 text-sm text-[var(--text)]"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-[var(--text-muted)]">
            Hasta
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1.5 text-sm text-[var(--text)]"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-[var(--text-muted)]">
            Rol / cargo
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1.5 text-sm text-[var(--text)]"
            >
              <option value="">Todos los roles</option>
              {ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-[var(--text-muted)]">
            Estado
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1.5 text-sm text-[var(--text)]"
            >
              <option value="">Todos los estados</option>
              {STATUS_COLUMNS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={download}
            className="rounded-full bg-gradient-to-br from-[var(--accent-dim)] to-[#00a050] px-4 py-2 text-sm font-semibold text-white"
          >
            Descargar PDF
          </button>
          <span className="text-sm text-[var(--text-muted)]">
            {filtered.length} actividades en {rolesInPlay} roles con este filtro
          </span>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-soft)] text-left text-xs uppercase text-[var(--text-faint)]">
              <th className="px-4 py-3">Tarea</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Responsable</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Vence</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, i) => (
              <tr key={i} className="border-b border-[var(--border-soft)] last:border-0">
                <td className="px-4 py-3 font-medium text-[var(--text)]">{t.title}</td>
                <td className="px-4 py-3 text-[var(--text-muted)]">
                  {ROLES.find((r) => r.id === t.roleTag)?.name ?? "—"}
                </td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{t.assignee?.name ?? "—"}</td>
                <td className="px-4 py-3 text-[var(--text-muted)]">
                  {STATUS_COLUMNS.find((s) => s.id === t.status)?.label ?? t.status}
                </td>
                <td className="px-4 py-3 text-[var(--text-muted)]">
                  {t.dueDate ? new Date(t.dueDate).toLocaleDateString("es-MX", { day: "2-digit", month: "short" }) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="p-4 text-sm text-[var(--text-faint)]">Sin actividades para este filtro.</p>
        )}
      </div>
    </>
  );
}
