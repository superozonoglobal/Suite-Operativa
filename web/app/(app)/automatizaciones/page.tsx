import { auth } from "@/lib/auth";
import { listAutomations } from "@/lib/services/automations";
import { Topbar } from "@/components/layout/Topbar";
import { AutomationsView } from "@/components/automatizaciones/AutomationsView";

export default async function AutomatizacionesPage() {
  const session = await auth();
  const { items } = await listAutomations();
  const canEdit = session?.user.level !== "COLABORADOR";

  return (
    <>
      <Topbar title="Automatizaciones" roleTag={session?.user.roleTag} />
      <main className="p-6">
        <AutomationsView automations={items} canEdit={canEdit} />
      </main>
    </>
  );
}
