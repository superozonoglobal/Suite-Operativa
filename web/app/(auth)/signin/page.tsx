import Link from "next/link";
import { signIn } from "@/lib/auth";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
      <div className="flex w-full max-w-sm flex-col gap-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-10">
        <h1 className="text-2xl font-bold text-[var(--text)]">Suite Operativa</h1>

        {error && (
          <p className="rounded-md border border-[var(--danger)] bg-[var(--surface-hover)] px-3 py-2 text-sm text-[var(--danger)]">
            Email o contraseña incorrectos.
          </p>
        )}

        <form
          action={async (formData: FormData) => {
            "use server";
            await signIn("credentials", {
              email: formData.get("email"),
              password: formData.get("password"),
              redirectTo: "/dashboard",
            });
          }}
          className="flex flex-col gap-3"
        >
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-[var(--text)]"
          />
          <input
            name="password"
            type="password"
            placeholder="Contraseña"
            required
            className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-[var(--text)]"
          />
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-br from-[var(--accent-dim)] to-[#00a050] px-6 py-3 font-semibold text-white"
          >
            Iniciar sesión
          </button>
        </form>

        <Link href="/register" className="text-center text-sm text-[var(--text-faint)] hover:text-[var(--accent)]">
          No tengo cuenta — registrarme
        </Link>
      </div>
    </main>
  );
}
