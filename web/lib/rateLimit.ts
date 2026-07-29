interface Entry {
  count: number;
  windowStart: number;
}

export class RateLimiter {
  private attempts = new Map<string, Entry>();

  constructor(
    private maxAttempts: number,
    private windowMs: number
  ) {}

  /** Returns true if the attempt is allowed, false if the key is currently rate-limited. */
  check(key: string, now: number = Date.now()): boolean {
    const entry = this.attempts.get(key);

    if (!entry || now - entry.windowStart > this.windowMs) {
      this.attempts.set(key, { count: 1, windowStart: now });
      return true;
    }

    entry.count += 1;
    return entry.count <= this.maxAttempts;
  }
}

// Single in-process instance shared by the credentials login route.
// Note: on Vercel's serverless runtime this resets per cold start / is not
// shared across concurrent instances, so it's a best-effort mitigation, not
// a hard guarantee — sufficient for a small trusted-team internal tool.
export const loginRateLimiter = new RateLimiter(5, 60_000);
