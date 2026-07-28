import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isEmailAllowed } from "@/lib/authAllowList";
import type { RegisterInput } from "@/lib/validation/register";

export class EmailNotAllowedError extends Error {
  constructor() {
    super("This email is not on the team allow-list");
    this.name = "EmailNotAllowedError";
  }
}

export class AlreadyRegisteredError extends Error {
  constructor() {
    super("An account already exists for this email");
    this.name = "AlreadyRegisteredError";
  }
}

export async function registerUser(input: RegisterInput) {
  const email = input.email.toLowerCase();

  if (!isEmailAllowed(email)) {
    throw new EmailNotAllowedError();
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.passwordHash) {
    throw new AlreadyRegisteredError();
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const directorEmail = (process.env.SEED_DIRECTOR_EMAIL ?? "").toLowerCase();

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash },
    });
  }

  return prisma.user.create({
    data: {
      email,
      name: input.name,
      passwordHash,
      level: email === directorEmail ? "DIRECTOR" : "COLABORADOR",
    },
  });
}
