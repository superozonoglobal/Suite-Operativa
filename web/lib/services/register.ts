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

  const existing = await prisma.user.findUnique({
    where: { email },
    omit: { passwordHash: false },
  });
  if (existing?.passwordHash) {
    throw new AlreadyRegisteredError();
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const superuserEmail = (process.env.SEED_SUPERUSER_EMAIL ?? "").toLowerCase();

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
      roleTag: input.roleTag,
      level: email === superuserEmail ? "SUPERUSER" : "COLABORADOR",
    },
  });
}
