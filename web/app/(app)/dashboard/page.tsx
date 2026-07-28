import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Topbar } from "@/components/layout/Topbar";

export default async function DashboardPage() {
  const session = await auth();

  const [tasks, users] = await Promise.all([
    prisma.task.findMany({ include: { assignee: true } }),
    prisma.user.findMany(),
  ]);

  const workloadByUser = users
    .map((user) => ({
      user,
      count: tasks.filter((t) => t.assigneeId === user.id && t.status !== "DONE").length,
    }))
    .sort((a, b) => b.count - a.count);

  const maxCount = Math.max(1, ...workloadByUser.map((w) => w.count));

  const now = new Date();
  const overdueOrBlocked = tasks.filter(
    (t) => t.status !== "DONE" && t.dueDate && new Date(t.dueDate) < now
  );

  const byStatus = {
    TODO: tasks.filter((t) => t.status === "TODO").length,
    PROGRESS: tasks.filter((t) => t.status === "PROGRESS").length,
    REVIEW: tasks.filter((t) => t.status === "REVIEW").length,
    DONE: tasks.filter((t) => t.status === "DONE").length,
  };

  return (
    <>
      <Topbar title="Dashboard" roleTag={session?.user.roleTag} />
      <main className="p-6">
        <p className="mb-6 text-sm text-[var(--text-muted)]">Vista general de toda la operación.</p>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Carga de trabajo por miembro
            </h2>
            <div className="flex flex-col gap-2">
              {workloadByUser.map(({ user, count }) => (
                <div key={user.id} className="flex items-center gap-3 text-sm">
                  <span className="w-24 shrink-0 truncate text-[var(--text)]">{user.name}</span>
                  <div className="h-2 flex-1 rounded-full bg-[var(--border-soft)]">
                    <div
                      className="h-2 rounded-full bg-[var(--accent)]"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-[var(--text-muted)]">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Resumen de tareas
            </h2>
            <p className="mb-1 text-4xl font-bold text-[var(--accent)]">{tasks.length}</p>
            <p className="mb-4 text-sm text-[var(--text-muted)]">tareas totales</p>
            <div className="flex flex-col gap-1 text-sm text-[var(--text-muted)]">
              <span>Por hacer: {byStatus.TODO}</span>
              <span>En proceso: {byStatus.PROGRESS}</span>
              <span>En revisión: {byStatus.REVIEW}</span>
              <span>Aprobadas: {byStatus.DONE}</span>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Tareas retrasadas / bloqueadas
            </h2>
            {overdueOrBlocked.length === 0 ? (
              <p className="text-sm text-[var(--text-faint)]">Sin tareas retrasadas.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {overdueOrBlocked.map((t) => (
                  <li key={t.id} className="text-[var(--danger)]">
                    {t.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <p className="mt-6 text-xs text-[var(--text-faint)]">
          Los resúmenes por proyecto y metas se agregan cuando esos módulos estén construidos (Fase 3).
        </p>
      </main>
    </>
  );
}
