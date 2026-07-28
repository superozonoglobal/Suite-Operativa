"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MODULES } from "@/lib/constants";

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3">
      {MODULES.map((mod) => {
        const active = pathname?.startsWith(mod.href);
        return (
          <Link
            key={mod.href}
            href={mod.href}
            className={`rounded-md border-l-[3px] px-3 py-2 text-sm transition-colors ${
              active
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
            }`}
          >
            {mod.label}
          </Link>
        );
      })}
    </nav>
  );
}
