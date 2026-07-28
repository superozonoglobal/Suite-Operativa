import { auth } from "@/lib/auth";
import { listUsers } from "@/lib/services/users";
import { ROLES, LEVELS } from "@/lib/constants";
import { Topbar } from "@/components/layout/Topbar";
import { RoleEditor } from "@/components/equipo/RoleEditor";

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function EquipoPage() {
  const session = await auth();
  const users = await listUsers();
  const canEdit = session?.user.level !== "COLABORADOR";

  return (
    <>
      <Topbar title="Equipo" roleTag={session?.user.roleTag} />
      <main className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => {
          const roleName = ROLES.find((r) => r.id === user.roleTag)?.name;
          const levelLabel = LEVELS.find((l) => l.id === user.level)?.label ?? user.level;

          return (
            <div key={user.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-[var(--accent-ink)]">
                  {initialsOf(user.name)}
                </span>
                <div>
                  <p className="font-medium text-[var(--text)]">{user.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{roleName ?? "Sin rol asignado"}</p>
                </div>
              </div>
              <p className="mt-3 rounded-full border border-[var(--border)] bg-[var(--surface-hover)] px-2 py-0.5 text-center text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                {levelLabel}
              </p>
              {canEdit && (
                <div className="mt-3">
                  <RoleEditor userId={user.id} initialRoleTag={user.roleTag} initialLevel={user.level} />
                </div>
              )}
            </div>
          );
        })}
      </main>
    </>
  );
}
