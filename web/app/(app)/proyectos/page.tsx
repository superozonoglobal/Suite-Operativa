import { auth } from "@/lib/auth";
import { listProjectsWithProgress } from "@/lib/services/projects";
import { Topbar } from "@/components/layout/Topbar";

export default async function ProyectosPage() {
  const session = await auth();
  const projects = await listProjectsWithProgress();

  return (
    <>
      <Topbar title="Proyectos" roleTag={session?.user.roleTag} />
      <main className="p-6">
        <p className="mb-6 text-sm text-[var(--text-muted)]">
          SUPER OZONO como marca sombrilla — cada proyecto agrupa uno o varios productos.
        </p>

        <div className="flex flex-col gap-4">
          {projects.map((project) => {
            const totalTasks = project.products.reduce((sum, p) => sum + p.taskCount, 0);

            return (
              <details
                key={project.id}
                open
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between">
                  <span className="text-lg font-semibold text-[var(--text)]">{project.name}</span>
                  <span className="rounded-full border border-[var(--border)] bg-[var(--surface-hover)] px-3 py-1 text-xs text-[var(--text-muted)]">
                    {totalTasks} tareas
                  </span>
                </summary>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {project.products.map((product) => (
                    <div
                      key={product.id}
                      className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-elevated)] p-3"
                    >
                      <p className="font-medium text-[var(--text)]">{product.name}</p>
                      <div className="my-2 h-2 rounded-full bg-[var(--border-soft)]">
                        <div
                          className="h-2 rounded-full bg-[var(--accent)]"
                          style={{
                            width: `${product.taskCount === 0 ? 0 : (product.doneCount / product.taskCount) * 100}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">
                        {product.doneCount}/{product.taskCount} listas
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 border-t border-[var(--border-soft)] pt-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Equipo del proyecto
                  </p>
                  {project.teamMembers.length === 0 ? (
                    <p className="text-sm text-[var(--text-faint)]">Sin miembros asignados todavía.</p>
                  ) : (
                    <p className="text-sm text-[var(--text-muted)]">
                      {project.teamMembers.map((m) => m.name).join(", ")}
                    </p>
                  )}
                </div>
              </details>
            );
          })}

          {projects.length === 0 && (
            <p className="text-sm text-[var(--text-faint)]">Sin proyectos todavía.</p>
          )}
        </div>
      </main>
    </>
  );
}
