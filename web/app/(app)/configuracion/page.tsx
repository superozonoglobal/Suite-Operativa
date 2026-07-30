import Link from "next/link";
import { auth } from "@/lib/auth";
import { getOrgSettings } from "@/lib/services/orgSettings";
import { isAtLeastLevel } from "@/lib/authz";
import type { User } from "@/app/generated/prisma/client";
import { Topbar } from "@/components/layout/Topbar";
import { ConfigForm } from "@/components/configuracion/ConfigForm";

export default async function ConfiguracionPage() {
  const session = await auth();
  const settings = await getOrgSettings();
  const canEdit =
    !!session?.user.level && isAtLeastLevel(session.user.level as User["level"], "PROJECT_MANAGER");

  return (
    <>
      <Topbar title="Configuración" roleTag={session?.user.roleTag} />
      <main className="p-6">
        <h1 className="mb-1 text-2xl font-bold text-[var(--text)]">Configuración</h1>
        <p className="mb-6 text-sm text-[var(--text-muted)]">
          Quién puede entrar a Suite Operativa. Para cambiar el rol o nivel de una persona, andá a{" "}
          <Link href="/equipo" className="text-[var(--accent)] hover:underline">
            Equipo
          </Link>
          .
        </p>

        {canEdit ? (
          <ConfigForm
            initialDomain={settings.allowedEmailDomain ?? ""}
            initialEmails={settings.allowedEmails}
            initialOpenRegistration={settings.openRegistration}
          />
        ) : (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="text-sm text-[var(--text-muted)]">
              Dominio permitido: {settings.allowedEmailDomain || "sin configurar"}
            </p>
            <p className="mt-2 text-xs text-[var(--text-faint)]">
              Solo Project Manager o Superusuario pueden cambiar esta configuración.
            </p>
          </div>
        )}
      </main>
    </>
  );
}
