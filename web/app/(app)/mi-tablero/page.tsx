import { auth } from "@/lib/auth";
import { listTasks } from "@/lib/services/tasks";
import { Topbar } from "@/components/layout/Topbar";
import { Board } from "@/components/kanban/Board";

export default async function MiTableroPage() {
  const session = await auth();
  const { items } = await listTasks({ assigneeId: session?.user.id });

  return (
    <>
      <Topbar title="Mi Tablero" roleTag={session?.user.roleTag} />
      <Board initialTasks={items} />
    </>
  );
}
