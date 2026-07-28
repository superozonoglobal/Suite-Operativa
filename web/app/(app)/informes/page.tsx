import { auth } from "@/lib/auth";
import { Topbar } from "@/components/layout/Topbar";
import { InformesView } from "@/components/informes/InformesView";

export default async function InformesPage() {
  const session = await auth();

  return (
    <>
      <Topbar title="Informes" roleTag={session?.user.roleTag} />
      <main className="p-6">
        <h1 className="mb-1 text-2xl font-bold text-[var(--text)]">Informes</h1>
        <p className="mb-6 text-sm text-[var(--text-muted)]">
          Generá un PDF con un resumen por rol/cargo y el listado completo de actividades.
        </p>
        <InformesView generatedByName={session?.user.name ?? ""} />
      </main>
    </>
  );
}
