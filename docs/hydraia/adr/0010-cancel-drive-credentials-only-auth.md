# ADR-0010: Cancel Google Drive integration; Credentials-only self-service registration with role

## Status
Accepted — 2026-07-28. **Supersedes ADR-0004** (Google Drive integration) —
Phase 5 of the plan will not be built as designed. **Amends ADR-0003 and
ADR-0008** — Google sign-in is removed entirely rather than kept as a second
option; Credentials (email + password) is now the ONLY auth method.

## Context
ADR-0003 chose Google as the primary login specifically to get Drive access
"for free" via the same OAuth consent. ADR-0004 designed real Drive API
integration on top of that. ADR-0008 later added Credentials as a second,
immediately-usable method alongside Google, to unblock testing before Google
Cloud OAuth setup (Task 7-1) happened.

The user has now explicitly decided: **do not implement Google Cloud at all**.
The platform should be fully self-sufficient — people register with their own
email and a password they choose, not through Google, and not depending on
Google Cloud being configured. The user also asked that registration collect
each person's job-function role from a fixed list (ventas, copywriting,
publicista, diseñador, filmmaker, editor de video, community manager, trafiker,
encargado ecommerce, **developer**) — `developer` replaces the old `Director /
PM` entry in the `RoleTag` catalog (the same catalog slot, new label/value —
"developer" corresponds to what the `SUPERUSER` *level* already means for this
user; `RoleTag` and `Level` remain separate concepts, as established in
ADR-0009).

## Decision
1. **Google Drive integration (ADR-0004) is cancelled**, not deferred. No Drive
   API calls, no Picker, no `drive.*` scopes, no Drive-related env vars. If
   real Drive integration is wanted later, it needs a new design decision from
   scratch — this ADR does not leave a half-built path toward it.
2. **Google sign-in is removed from the app entirely** — not left in as an
   inert, non-functional button. `lib/auth.ts` drops the `Google` provider,
   the `@auth/prisma-adapter` `PrismaAdapter` (it existed solely to persist
   Google `Account`/`Session` rows — Credentials-provider users never touched
   it, since JWT-strategy sessions and `registerUser()`-created users bypass
   the adapter entirely), and the now-fully-dead `events.createUser` bootstrap
   hook (it only ever fired via adapter-driven OAuth user creation;
   `registerUser()` already has its own equivalent `SEED_SUPERUSER_EMAIL`
   bootstrap for the Credentials path). The sign-in page shows only the
   email/password form — no "or sign in with Google" divider.
3. **`RoleTag.DIRECTOR` is renamed to `RoleTag.DEVELOPER`** in the schema — a
   straight rename of the same catalog slot (no existing `User` row had this
   tag set yet, verified via direct query before migrating, so this is a
   single-migration enum recreation, not a two-step value-then-data-then-drop
   sequence like ADR-0009's `Level` change needed).
4. **Registration now collects `roleTag`** (optional, chosen from the same
   `ROLES` catalog used everywhere else — Equipo, Informes, etc.) alongside
   name/email/password. `registerUser()` persists it directly; no separate
   admin approval step for a self-declared job title. A director/líder can
   still correct it later via Equipo (Task 2-2), same as before.

## Alternatives considered
1. **Keep Google as an unused fallback button** — rejected: a login button
   that cannot work (no Google Cloud project exists) is worse than no button;
   it invites confused clicks and support questions, and keeping
   Google-specific code around signals a half-finished feature rather than a
   deliberate scope decision.
2. **5-tier RoleTag (add DEVELOPER alongside DIRECTOR)** — rejected: no
   evidence a distinct "Director" job-function tag is still needed once
   `developer` covers that slot for this user; matches the same reasoning
   ADR-0009 used for `Level`.
3. **Credentials-only, Google fully removed, RoleTag renamed, registration
   collects role (chosen)** — matches the user's explicit instruction, removes
   dead/unreachable code (adapter, OAuth event hook, Drive scope config)
   instead of leaving it inert.

## Consequences
- `web/lib/auth.ts` shrinks to just the `Credentials` provider + `jwt`/`session`
  callbacks + the `signIn` allow-list callback — no adapter, no `events` block.
- `@auth/prisma-adapter` and `googleapis` become unused dependencies — removed
  from `package.json` (`npm uninstall`), not just left installed.
- `.env`/`.env.example` drop `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
  `NEXT_PUBLIC_GOOGLE_PICKER_API_KEY`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — nothing
  reads them anymore.
- The `Account`/`Session` Prisma models (Auth.js adapter contract) stay in the
  schema unused for now — removing them is a bigger, separate decision (they
  are the generic contract Auth.js expects if ANY OAuth provider is ever added
  back) and out of scope for this ADR; flatly dropping used-by-nothing-yet
  models that cost nothing to keep is not the same judgment call as removing
  dead *code paths*.
- Plan Task 7-1 (Google Cloud OAuth/Drive/Picker setup) is no longer part of
  this project's scope — removed from the active plan, not just marked done.
- Threat model note: self-declared `roleTag` at registration is a low-stakes
  claim (job title shown in the UI, used for Informes grouping and Analítica
  breakdowns) — it does **not** grant any permission by itself; `Level`
  (separately gated, admin-assigned) is what controls access to
  admin-only actions (Task 2-2/3-1/6-3/6-4's `level !== 'COLABORADOR'` /
  `=== 'SUPERUSER'` checks are unaffected by this ADR).
