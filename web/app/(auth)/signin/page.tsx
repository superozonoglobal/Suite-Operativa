import { signIn } from "@/lib/auth";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/dashboard" });
        }}
        className="flex flex-col items-center gap-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-10"
      >
        <h1 className="text-2xl font-bold text-[var(--text)]">Suite Operativa</h1>
        <button
          type="submit"
          className="rounded-lg bg-gradient-to-br from-[var(--accent-dim)] to-[#00a050] px-6 py-3 font-semibold text-white"
        >
          Iniciar sesión con Google
        </button>
      </form>
    </main>
  );
}
