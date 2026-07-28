import { auth } from "@/lib/auth";
import { listRequisitions } from "@/lib/services/requisitions";
import { listUsers } from "@/lib/services/users";
import { Topbar } from "@/components/layout/Topbar";
import { RequisitionsView } from "@/components/requisiciones/RequisitionsView";

export default async function RequisicionesPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [{ items: received }, { items: sent }, users] = await Promise.all([
    listRequisitions({ toUserId: userId }),
    listRequisitions({ fromUserId: userId }),
    listUsers(),
  ]);

  const otherUsers = users.filter((u) => u.id !== userId);

  return (
    <>
      <Topbar title="Requisiciones" roleTag={session?.user.roleTag} />
      <RequisitionsView received={received} sent={sent} otherUsers={otherUsers} />
    </>
  );
}
