import { auth } from "@/lib/auth";
import { listGoals } from "@/lib/services/goals";
import { Topbar } from "@/components/layout/Topbar";
import { GoalCard } from "@/components/metas/GoalCard";
import { GoalForm } from "@/components/metas/GoalForm";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default async function MetasPage() {
  const session = await auth();
  const month = currentMonth();
  const { items: goals } = await listGoals({ month });

  const myActiveGoals = goals.filter((g) => g.userId === session?.user.id && g.status === "ACTIVA");
  const hasFewGoals = myActiveGoals.length < 3;

  return (
    <>
      <Topbar title="Metas" roleTag={session?.user.roleTag} />
      <main className="p-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">Metas del mes</h1>
            <p className="text-sm text-[var(--text-muted)]">
              Mínimo 3 metas por colaborador · personales o de equipo
            </p>
          </div>
          <GoalForm month={month} />
        </div>

        {hasFewGoals && (
          <p className="mb-6 flex items-center gap-2 text-sm text-[var(--amber)]">
            ⚠ Tenés menos de 3 metas activas este mes.
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>

        {goals.length === 0 && <p className="text-sm text-[var(--text-faint)]">Sin metas este mes todavía.</p>}
      </main>
    </>
  );
}
