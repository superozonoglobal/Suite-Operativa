import Link from "next/link";
import { auth } from "@/lib/auth";
import { listPostsByMonth, listSchedulableTasks } from "@/lib/services/posts";
import { MONTH_LABELS } from "@/lib/calendarGrid";
import { Topbar } from "@/components/layout/Topbar";
import { CalendarGrid } from "@/components/calendario/CalendarGrid";

function monthLink(year: number, month: number) {
  return `/calendario?year=${year}&month=${month}`;
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const session = await auth();
  const now = new Date();
  const { year: yearParam, month: monthParam } = await searchParams;
  const year = Number(yearParam) || now.getUTCFullYear();
  const month = Number(monthParam) || now.getUTCMonth() + 1;

  const prevMonth = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };

  const [{ items: posts }, schedulableTasks] = await Promise.all([
    listPostsByMonth(year, month),
    listSchedulableTasks(),
  ]);

  return (
    <>
      <Topbar title="Calendario Editorial" roleTag={session?.user.roleTag} />
      <div className="flex items-center justify-between px-6 pt-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Calendario editorial</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Solo piezas ya aprobadas pueden programarse aquí.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={monthLink(prevMonth.year, prevMonth.month)}
            className="rounded-full border border-[var(--border)] px-3 py-1 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
          >
            ‹
          </Link>
          <Link
            href={monthLink(now.getUTCFullYear(), now.getUTCMonth() + 1)}
            className="rounded-full border border-[var(--border)] px-3 py-1 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-hover)]"
          >
            Hoy
          </Link>
          <Link
            href={monthLink(nextMonth.year, nextMonth.month)}
            className="rounded-full border border-[var(--border)] px-3 py-1 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
          >
            ›
          </Link>
        </div>
      </div>
      <p className="px-6 pt-4 text-lg font-semibold text-[var(--text)]">
        {MONTH_LABELS[month - 1]} de {year}
      </p>

      <CalendarGrid year={year} month={month} posts={posts} schedulableTasks={schedulableTasks} />
    </>
  );
}
