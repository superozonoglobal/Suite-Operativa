import { getOrgSettings } from "@/lib/services/orgSettings";

export async function isEmailAllowed(email: string): Promise<boolean> {
  const normalized = email.toLowerCase();
  if (!normalized) return false;

  const superuserEmail = (process.env.SEED_SUPERUSER_EMAIL ?? "").toLowerCase();
  if (normalized === superuserEmail) return true;

  const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN ?? "";
  if (allowedDomain && normalized.endsWith(`@${allowedDomain.toLowerCase()}`)) return true;

  const settings = await getOrgSettings();

  if (
    settings.allowedEmailDomain &&
    normalized.endsWith(`@${settings.allowedEmailDomain.toLowerCase()}`)
  ) {
    return true;
  }

  if (settings.allowedEmails.some((allowed) => allowed.toLowerCase() === normalized)) {
    return true;
  }

  return false;
}
