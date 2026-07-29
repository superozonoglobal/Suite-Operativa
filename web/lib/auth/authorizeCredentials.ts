import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginRateLimiter, type RateLimiter } from "@/lib/rateLimit";

// A real bcrypt hash with no known matching password, used so that a login
// attempt against a nonexistent email takes the same code path (and roughly
// the same time) as one against a real email with a wrong password — closes
// the timing oracle that would otherwise let an attacker enumerate which
// emails have accounts.
const DUMMY_HASH = bcrypt.hashSync("no-such-user-timing-safety", 10);

export async function authorizeCredentials(
  email: string | undefined,
  password: string | undefined,
  rateLimiter: RateLimiter = loginRateLimiter
) {
  const normalizedEmail = email?.toLowerCase();
  if (!normalizedEmail || !password) return null;

  if (!rateLimiter.check(normalizedEmail)) return null;

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    omit: { passwordHash: false },
  });

  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user?.passwordHash || !valid) return null;

  return { id: user.id, email: user.email, name: user.name };
}
