# ADR-0003: Auth.js (NextAuth v5) with Google as the single login + Drive OAuth path

## Status
Accepted — 2026-07-28

## Context
Two needs collide: (1) the app needs a login system (today: client-side mock
password hash in `data.js`, `SEED_PASSWORD_SALT`/`SEED_PASSWORD_HASH`, entirely
fake security since it ships in the JS bundle), and (2) the app needs to call the
Google Drive API on behalf of each user (ADR-0004), which requires a Google OAuth
2.0 access token with Drive scopes per user. Both needs require talking to Google
OAuth — doing them as two separate flows (a home-grown login, then a *second*
"connect your Google Drive" step) is duplicate plumbing for a company that already
standardizes on Google Workspace (`@ ozono...`/Gmail addresses seen in `data.js`
seed users).

## Decision
Use **Auth.js v5** (`next-auth`) with the **Google provider**, requesting Drive
scopes (`https://www.googleapis.com/auth/drive.file` — see ADR-0004 for why
`drive.file` and not full `drive` scope) at sign-in time. Auth.js's Prisma adapter
persists `Account` (holds the Google `access_token`/`refresh_token`/`expires_at`)
and `Session` tables, so the same sign-in both authenticates the user AND stores
the Drive-capable OAuth token. Restrict sign-in to a Google Workspace domain (or an
explicit allow-list of the ~10 team emails) via the `signIn` callback — this is not
a public app.

## Alternatives considered
1. **Custom email+password login (port the current mock) + separate "connect
   Drive" OAuth step** — closer to the superseded plan's `authService.js`
   (bcrypt + hand-rolled JWT). Rejected: two credential systems to secure and keep
   in sync (password reset flow AND Drive token refresh flow), and the team already
   uses Google day to day (Diego's material was shared via Google Drive itself).
2. **Auth.js with Google, Drive access requested at sign-in (chosen)** — one
   credential system, no passwords to hash/store/reset/leak, Drive access is a
   byproduct of login rather than a separate integration. Onboarding a new team
   member is "add their Google account to the allow-list," not "create a user
   record with a temp password."

## Consequences
- The `Role`/permission model (director, líder, colaborador levels; 10 fixed
  role catalog from `data.js`'s `ROLES`) becomes a `role`/`level` column on the
  `User` table, set by an admin — NOT something Google tells us, and NOT
  "whoever signs in first" (a first-login-wins bootstrap is a race condition/
  trust-on-first-use flaw). Instead, an explicit `SEED_DIRECTOR_EMAIL` env var
  names the one account that bootstraps as `director` on its first sign-in;
  every other account defaults to `colaborador`/unassigned-role pending the
  director assigning it from the Equipo screen.
- `Account.refresh_token` requires requesting `access_type=offline` +
  `prompt=consent` on the Google provider config, or refresh tokens silently stop
  arriving after the first consent. This is a plan-task-level detail (see the
  implementation plan's Auth setup task).
- Threat model implication (see design spec): the Drive access/refresh tokens in
  the `Account` table are as sensitive as a password — encrypt at rest is out of
  scope for MVP (Postgres column-level encryption) but the connection to Postgres
  itself MUST be TLS, and `.env` secrets (`AUTH_SECRET`, `GOOGLE_CLIENT_SECRET`)
  must never be committed (already covered by `backend/.gitignore`'s pattern,
  ported forward to the new project's `.gitignore`).
