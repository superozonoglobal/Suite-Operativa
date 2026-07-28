import Link from "next/link";
import { auth } from "@/lib/auth";
import { listThread, getAdminRecipient } from "@/lib/services/messages";
import { listUsers } from "@/lib/services/users";
import { Topbar } from "@/components/layout/Topbar";
import { ThreadView } from "@/components/mensajes/ThreadView";

export default async function MensajesPage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string }>;
}) {
  const session = await auth();
  const currentUserId = session!.user.id;
  const isColaborador = session?.user.level === "COLABORADOR";
  const { with: withParam } = await searchParams;

  if (isColaborador) {
    const admin = await getAdminRecipient();
    const thread = admin ? await listThread(currentUserId, admin.id) : [];

    return (
      <>
        <Topbar title="Mensajes" roleTag={session?.user.roleTag} />
        <main className="p-6">
          <h1 className="mb-1 text-2xl font-bold text-[var(--text)]">Mensajes</h1>
          <p className="mb-6 text-sm text-[var(--text-muted)]">
            Conversación directa con {admin?.name ?? "el equipo"} — podés responder acá mismo.
          </p>
          {admin ? (
            <ThreadView
              currentUserId={currentUserId}
              otherUserId={admin.id}
              otherUserName={admin.name}
              initialMessages={thread}
            />
          ) : (
            <p className="text-sm text-[var(--text-faint)]">Todavía no hay un Project Manager asignado.</p>
          )}
        </main>
      </>
    );
  }

  const users = await listUsers();
  const otherUsers = users.filter((u) => u.id !== currentUserId);
  const selected = otherUsers.find((u) => u.id === withParam);
  const thread = selected ? await listThread(currentUserId, selected.id) : [];

  return (
    <>
      <Topbar title="Mensajes" roleTag={session?.user.roleTag} />
      <main className="flex gap-6 p-6">
        <aside className="w-56 shrink-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2">
          {otherUsers.map((u) => (
            <Link
              key={u.id}
              href={`/mensajes?with=${u.id}`}
              className={`block rounded-md px-3 py-2 text-sm ${
                selected?.id === u.id
                  ? "bg-[var(--surface-hover)] text-[var(--accent)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              {u.name}
            </Link>
          ))}
        </aside>

        {selected ? (
          <ThreadView
            currentUserId={currentUserId}
            otherUserId={selected.id}
            otherUserName={selected.name}
            initialMessages={thread}
          />
        ) : (
          <p className="text-sm text-[var(--text-faint)]">Elegí una conversación.</p>
        )}
      </main>
    </>
  );
}
