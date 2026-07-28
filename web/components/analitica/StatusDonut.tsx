const SEGMENTS = [
  { key: "TODO", label: "Por Hacer", color: "var(--text-faint)" },
  { key: "PROGRESS", label: "En Proceso", color: "var(--sky)" },
  { key: "REVIEW", label: "En Revisión", color: "var(--amber)" },
  { key: "DONE", label: "Aprobado / Listo", color: "var(--accent)" },
] as const;

export function StatusDonut({ statusCounts, total }: { statusCounts: Record<string, number>; total: number }) {
  let cumulative = 0;
  const stops = SEGMENTS.map((seg) => {
    const count = statusCounts[seg.key] ?? 0;
    const pct = total === 0 ? 0 : (count / total) * 100;
    const start = cumulative;
    cumulative += pct;
    return `${seg.color} ${start}% ${cumulative}%`;
  }).join(", ");

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative h-28 w-28 shrink-0 rounded-full"
        style={{ background: total === 0 ? "var(--border-soft)" : `conic-gradient(${stops})` }}
      >
        <div className="absolute inset-3 flex items-center justify-center rounded-full bg-[var(--surface)] text-xl font-bold text-[var(--text)]">
          {total}
        </div>
      </div>
      <ul className="flex flex-col gap-1 text-sm">
        {SEGMENTS.map((seg) => (
          <li key={seg.key} className="flex items-center gap-2 text-[var(--text-muted)]">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: seg.color }} />
            {seg.label}: {statusCounts[seg.key] ?? 0}
          </li>
        ))}
      </ul>
    </div>
  );
}
