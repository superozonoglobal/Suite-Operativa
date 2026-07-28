export function isEmailAllowed(email: string): boolean {
  const normalized = email.toLowerCase();
  if (!normalized) return false;

  const directorEmail = (process.env.SEED_DIRECTOR_EMAIL ?? "").toLowerCase();
  if (normalized === directorEmail) return true;

  const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN ?? "";
  if (allowedDomain && normalized.endsWith(`@${allowedDomain.toLowerCase()}`)) return true;

  return false;
}
