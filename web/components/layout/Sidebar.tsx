import { ROLES } from "@/lib/constants";
import { signOut } from "@/lib/auth";
import { SidebarNav } from "@/components/layout/SidebarNav";

type SidebarUser = {
  name?: string | null;
  roleTag?: string | null;
};

export function Sidebar({ user }: { user: SidebarUser }) {
  const roleName = ROLES.find((r) => r.id === user.roleTag)?.name;

  return (
    <aside className="flex w-[260px] shrink-0 flex-col justify-between bg-[var(--bg-elevated)] border-r border-[var(--border)]">
      <div>
        <div className="px-6 py-6">
          <span className="font-[family-name:var(--font-wordmark)] font-black tracking-wide text-[var(--text)]">
            SUITE OPERATIVA
          </span>
        </div>
        <SidebarNav />
      </div>
      <div className="border-t border-[var(--border)] px-6 py-4">
        <p className="text-sm font-semibold text-[var(--text)]">{user.name}</p>
        {roleName && <p className="text-xs text-[var(--text-muted)]">{roleName}</p>}
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/signin" });
          }}
        >
          <button type="submit" className="mt-2 text-xs text-[var(--text-faint)] hover:text-[var(--accent)]">
            Cambiar usuario
          </button>
        </form>
      </div>
    </aside>
  );
}
