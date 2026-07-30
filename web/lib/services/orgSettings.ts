import { prisma } from "@/lib/prisma";
import { ForbiddenError } from "@/lib/errors";
import { isAtLeastLevel } from "@/lib/authz";
import type { User } from "@/app/generated/prisma/client";

export async function getOrgSettings() {
  const existing = await prisma.orgSettings.findFirst();
  if (existing) return existing;
  return prisma.orgSettings.create({ data: { allowedEmails: [] } });
}

export async function updateOrgSettings(
  input: { allowedEmailDomain?: string; allowedEmails?: string[]; openRegistration?: boolean },
  actingUser: { level: User["level"] }
) {
  if (!isAtLeastLevel(actingUser.level, "PROJECT_MANAGER")) {
    throw new ForbiddenError("Forbidden: only Project Manager or Superusuario can change these settings");
  }

  const settings = await getOrgSettings();
  return prisma.orgSettings.update({
    where: { id: settings.id },
    data: {
      allowedEmailDomain: input.allowedEmailDomain,
      allowedEmails: input.allowedEmails,
      openRegistration: input.openRegistration,
    },
  });
}
