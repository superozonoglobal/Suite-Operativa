"use server";

import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { registerSchema } from "@/lib/validation/register";
import { registerUser, EmailNotAllowedError, AlreadyRegisteredError } from "@/lib/services/register";

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    roleTag: (formData.get("roleTag") as string) || undefined,
  });

  if (!parsed.success) {
    redirect("/register?error=invalid");
  }

  try {
    await registerUser(parsed.data);
  } catch (err) {
    if (err instanceof EmailNotAllowedError) {
      redirect("/register?error=not-allowed");
    }
    if (err instanceof AlreadyRegisteredError) {
      redirect("/register?error=already-registered");
    }
    throw err;
  }

  await signIn("credentials", {
    email: parsed.data.email,
    password: parsed.data.password,
    redirectTo: "/dashboard",
  });
}
