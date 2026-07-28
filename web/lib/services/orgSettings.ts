import { prisma } from "@/lib/prisma";

export async function getOrgSettings() {
  const existing = await prisma.orgSettings.findFirst();
  if (existing) return existing;
  return prisma.orgSettings.create({ data: { allowedEmails: [] } });
}

export async function updateOrgSettings(
  input: { allowedEmailDomain?: string; allowedEmails?: string[] },
  actingUser: { level: string }
) {
  if (actingUser.level !== "SUPERUSER") {
    throw new Error("Forbidden: only Superusuario can change these settings");
  }

  const settings = await getOrgSettings();
  return prisma.orgSettings.update({
    where: { id: settings.id },
    data: {
      allowedEmailDomain: input.allowedEmailDomain,
      allowedEmails: input.allowedEmails,
    },
  });
}
