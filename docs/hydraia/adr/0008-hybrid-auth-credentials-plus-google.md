# ADR-0008: Add email/password registration alongside Google (amends ADR-0003)

## Status
Accepted — 2026-07-28 (amends ADR-0003, which is NOT reversed — Google sign-in +
Drive integration stays the long-term design; this adds a second, immediately
usable path)

## Context
ADR-0003 chose Google as the *only* login method specifically to avoid running two
credential systems. That is still correct for the steady state. But using Google
sign-in requires real Google Cloud OAuth credentials (plan Task 7-1: create a
Cloud project, configure the consent screen, create an OAuth Client ID) — a
manual, account-bound setup step the user has not done yet. With only Google
wired up, nobody can sign into the app at all until that setup happens, which
blocked even a basic look at the app shell built in Phase 1.

## Decision
Add a **Credentials provider** (email + password) to Auth.js, alongside the
existing Google provider — not instead of it. A new `User.passwordHash` column
(nullable) stores a bcrypt hash for accounts that register this way. The same
`isEmailAllowed()` allow-list gate (ADR-0003) applies to registration too — this
does not become an open public signup, it is still restricted to the ~10 team
emails / `SEED_DIRECTOR_EMAIL` / `ALLOWED_EMAIL_DOMAIN`. If someone registers with
credentials using an email that later also signs in with Google, both methods
resolve to the same `User` row (matched by email) — the account is not
duplicated.

**Required side effect: session strategy changes from `database` to `jwt`.**
Auth.js does not support database-persisted sessions when a Credentials provider
is configured (Credentials sign-in has no OAuth `Account` to key a database
session off of) — this is a hard constraint of the library, not a design choice.
The Prisma adapter stays configured and still handles Google's
`Account`/`Session`-adjacent user creation and the `createUser` director-bootstrap
event (ADR-0003) exactly as before; only the *session* itself is now a signed JWT
cookie instead of a `Session` table row. `session.user.level`/`roleTag`/`id` are
now populated via a `jwt` callback (looked up once per token refresh) instead of
the `session` callback's per-request database lookup.

## Alternatives considered
1. **Do the Google Cloud OAuth setup now instead** — the alternative offered to
   and declined by the user in favor of unblocking testing immediately. Still the
   right long-term step (Task 7-1 remains in the plan, now doubly worth doing
   since Drive integration needs it regardless of which login method a user used).
2. **Replace Google entirely with Credentials** — rejected: throws away
   ADR-0003's unified login+Drive-token benefit for every user, not just the ones
   who haven't done Google Cloud setup yet.
3. **Hybrid: both providers active (chosen)** — unblocks testing today without
   giving up the Google path. Cost: `jwt` session strategy (see above) and a
   `passwordHash` column that credentials-registered-only accounts rely on;
   accepted as a reasonable, well-documented trade for immediate usability.

## Consequences
- `docs/hydraia/specs/2026-07-28-suite-operativa-nextjs-design.md`'s threat model
  gains a new consideration: password storage. Mitigated with bcrypt (cost factor
  10, matching the superseded plan's original choice) — passwords are never
  logged or returned in any API response, `passwordHash` is never selected in any
  query that serializes a `User` back to the client (a later task must audit for
  this when building the Equipo/Users API surface in Phase 2).
- A credentials-registered user who never also signs in with Google has NO Drive
  access (`drive.file` scope, ADR-0004, only arrives via the Google OAuth
  `Account`) — Drive-dependent UI (Task 5-2's attach/upload) must handle "this
  user has no linked Google account" gracefully (already planned:
  `getDriveClient` throws a specific error for exactly this case).
- Registration is still gated by the same allow-list as Google sign-in — this is
  not a general-purpose public signup form, and the UI copy should make that clear
  (an unrecognized email gets a clear rejection, not a confusing generic error).
