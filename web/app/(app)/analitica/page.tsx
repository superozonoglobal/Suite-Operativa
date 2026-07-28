import { auth } from "@/lib/auth";
import { getAnalyticsSummary } from "@/lib/services/analytics";
import { Topbar } from "@/components/layout/Topbar";
import { StatusDonut } from "@/components/analitica/StatusDonut";

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</h2>
      <p className="text-4xl font-bold text-[var(--accent)]">{value}</p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>
    </div>
  );
}

function MemberBarPanel({
  title,
  members,
  value,
  suffix,
}: {
  title: string;
  members: { userId: string; name: string; value: number }[];
  value: string;
  suffix: string;
}) {
  const max = Math.max(1, ...members.map((m) => m.value));
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{title}</h2>
      <div className="flex flex-col gap-2">
        {members.map((m) => (
          <div key={m.userId} className="flex items-center gap-3 text-sm">
            <span className="w-20 shrink-0 truncate text-[var(--text)]">{m.name}</span>
            <div className="h-2 flex-1 rounded-full bg-[var(--border-soft)]">
              <div className="h-2 rounded-full bg-[var(--accent)]" style={{ width: `${(m.value / max) * 100}%` }} />
            </div>
            <span className="w-10 text-right text-[var(--text-muted)]">
              {m.value}
              {suffix}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-[var(--text-faint)]">{value}</p>
    </div>
  );
}

export default async function AnaliticaPage() {
  const session = await auth();
  const summary = await getAnalyticsSummary();

  return (
    <>
      <Topbar title="Analítica" roleTag={session?.user.roleTag} />
      <main className="p-6">
        <p className="mb-6 text-sm text-[var(--text-muted)]">
          Métricas de toda la operación, calculadas en tiempo real sobre tareas y aprobaciones.
        </p>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <StatusDonut statusCounts={summary.statusCounts} total={summary.totalTasks} />
          </div>
          <StatCard
            label="Tareas totales"
            value={String(summary.totalTasks)}
            hint={`${summary.completedCount} completadas (${summary.completedPercent}%)`}
          />
          <StatCard
            label="% Entregas a tiempo"
            value={`${summary.onTimeRate}%`}
            hint="sobre tareas ya aprobadas"
          />
          <StatCard
            label="Tiempo de entrega promedio"
            value={String(summary.avgDeliveryDays)}
            hint="días, de creación a aprobación"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <StatCard
            label="Tasa de retrabajo"
            value={`${summary.reworkRate}%`}
            hint="devueltas con cambios antes de aprobarse"
          />
          <StatCard
            label="Tareas estancadas"
            value={String(summary.stagnantCount)}
            hint="sin actividad hace 4+ días"
          />
          <StatCard
            label="Cumplimiento de metas"
            value={`${summary.goalsCompletionAvg}%`}
            hint="promedio sobre metas aprobadas"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <MemberBarPanel
            title="Tiempo de entrega promedio por miembro (días)"
            members={summary.perMember.map((m) => ({ userId: m.userId, name: m.name, value: m.avgDeliveryDays }))}
            value=""
            suffix=""
          />
          <MemberBarPanel
            title="Tasa de retrabajo por miembro (%)"
            members={summary.perMember.map((m) => ({ userId: m.userId, name: m.name, value: m.reworkRate }))}
            value=""
            suffix="%"
          />
        </div>
      </main>
    </>
  );
}
