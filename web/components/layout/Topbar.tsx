import { ROLES } from "@/lib/constants";
import { NotificationBell } from "@/components/layout/NotificationBell";

export function Topbar({ title, roleTag }: { title: string; roleTag?: string | null }) {
  const roleName = ROLES.find((r) => r.id === roleTag)?.name;

  return (
    <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-elevated)] px-8 py-4">
      <div className="flex items-center gap-3">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--text)]">
          {title}
        </h1>
        {roleName && (
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface-hover)] px-3 py-1 text-xs text-[var(--text-muted)]">
            {roleName}
          </span>
        )}
      </div>
      <NotificationBell />
    </header>
  );
}
