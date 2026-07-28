import Link from "next/link";
import { registerAction } from "@/lib/actions/register";

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Revisá los datos: nombre, email válido y contraseña de al menos 8 caracteres.",
  "not-allowed": "Ese email no está autorizado para registrarse en Suite Operativa.",
  "already-registered": "Ya existe una cuenta con ese email. Iniciá sesión en vez de registrarte.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
      <form
        action={registerAction}
        className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-10"
      >
        <h1 className="text-2xl font-bold text-[var(--text)]">Crear cuenta</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Solo para el equipo de Suite Operativa. Si tu email no está autorizado, contactá al director.
        </p>

        {errorMessage && (
          <p className="rounded-md border border-[var(--danger)] bg-[var(--surface-hover)] px-3 py-2 text-sm text-[var(--danger)]">
            {errorMessage}
          </p>
        )}

        <label className="flex flex-col gap-1 text-sm text-[var(--text-muted)]">
          Nombre
          <input
            name="name"
            type="text"
            required
            className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-[var(--text)]"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-[var(--text-muted)]">
          Email
          <input
            name="email"
            type="email"
            required
            className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-[var(--text)]"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-[var(--text-muted)]">
          Contraseña
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-[var(--text)]"
          />
        </label>

        <button
          type="submit"
          className="mt-2 rounded-lg bg-gradient-to-br from-[var(--accent-dim)] to-[#00a050] px-6 py-3 font-semibold text-white"
        >
          Registrarme
        </button>

        <Link href="/signin" className="text-center text-sm text-[var(--text-faint)] hover:text-[var(--accent)]">
          Ya tengo cuenta — iniciar sesión
        </Link>
      </form>
    </main>
  );
}
