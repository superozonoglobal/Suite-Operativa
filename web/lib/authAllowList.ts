export function isEmailAllowed(email: string): boolean {
  const normalized = email.toLowerCase();
  if (!normalized) return false;

  const superuserEmail = (process.env.SEED_SUPERUSER_EMAIL ?? "").toLowerCase();
  if (normalized === superuserEmail) return true;

  const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN ?? "";
  if (allowedDomain && normalized.endsWith(`@${allowedDomain.toLowerCase()}`)) return true;

  return false;
}
