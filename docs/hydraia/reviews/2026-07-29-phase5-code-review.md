# Phase 5 Code Review — Suite Operativa (`web/`)

Date: 2026-07-29
Run: `docs/hydraia/runs/2026-07-28-1200-suite-operativa-nextjs.md`, resumed via `hydraia:resume`
Scope: whole-tree first pass (no prior review has ever run on this codebase)

**Reviewers dispatched in parallel:** `hydraia-reviewer` (whole-branch), `typescript-reviewer`,
`react-reviewer`, `database-reviewer`, `security-reviewer`, `silent-failure-hunter`,
repo-scan (secrets/embedded libs), `production-audit`.

## Verdict

**DO NOT DEPLOY.** Every reviewer that touched auth/data access independently found the
same two critical bugs (6 of 7 reports), plus a long tail of high-severity issues. None
require architectural rework — all are fixable within the existing service/route structure —
but they must be fixed before Phase 7 (Vercel/Neon deploy) or the browser click-through,
since testing against real accounts would exercise the same holes.

Production-audit score: **32/100 — Blocked.**

---

## Status update (2026-07-29, same day)

All 4 CRITICAL findings below have been fixed with TDD (new failing tests written
first, verified RED, then minimal fix, verified GREEN). Full suite: 73/73 tests
passing, `tsc --noEmit` clean, `npm run build` clean. See each item for the fix
summary. The 13 HIGH findings and everything below are still open — not in scope
for this pass (user chose "fix the 4 criticals now").

## CRITICAL (fix before anything else)

### C1. Any user can self-promote to SUPERUSER
`lib/services/users.ts:8-23` — the only gate is `actingUser.level === "COLABORADOR"`. No
rank comparison, no self-target guard, `level`/`roleTag` typed as bare `z.string()` in
`lib/validation/user.ts:3-6` so the enum isn't constrained at the edge.

**Exploit:** a LIDER (or PM) sends `PATCH /api/users/<their own id>` with
`{"level":"SUPERUSER"}` → immediate full admin, including editing the Configuración
allow-list and demoting the real owner to COLABORADOR (no "last superuser" guard either).

**Fix:** rank the 4 levels; reject when the actor doesn't outrank both the requested level
and the target's current level; forbid self-level-edit; replace the `z.string()` with
`z.enum([...])`.

**FIXED (2026-07-29):** `lib/services/users.ts` now ranks the 4 levels and rejects
(a) self-level-edit, (b) granting a level higher than the actor's own, (c) changing
the level of a target already at or above the actor's rank. `lib/validation/user.ts`
now uses `z.enum` for both `roleTag` and `level` instead of bare `z.string()`. 5 new
tests in `tests/integration/services/users.test.ts`.

### C2. Every user's bcrypt password hash (+ phone, email) is served to any logged-in user
`lib/services/users.ts:5` — `prisma.user.findMany()` with no `select`/`omit`, and the same
gap in every relation `include` (`tasks.ts:26`, `requisitions.ts:13`, `goals.ts:13`,
`projects.ts:8-12`, `posts.ts:10,19`, `messages.ts:24`). Confirmed reachable two ways:

- Directly: `GET /api/users`, `GET /api/tasks`, `GET /api/requisitions`, `GET /api/goals` all
  serialize the raw Prisma row.
- Via RSC: Server Components pass full `User` objects into `"use client"` components on
  `/requisiciones`, `/mi-tablero`, `/metas`, `/calendario` — the declared narrower TS prop
  types (e.g. `RequisitionsView.tsx:6`) do **not** strip fields at runtime; the hash ends up
  in the page's HTML/flight payload. `tsc --noEmit` passes because this is invisible to the
  type system.

ADR-0008 explicitly flagged this as a required follow-up audit ("a later task must audit for
this") — it was never done.

**Fix:** a single `PUBLIC_USER_SELECT` (or Prisma 7 global `omit: { passwordHash: true }` in
`lib/prisma.ts`) applied everywhere a `User` is read or included. Smallest change, largest
blast-radius reduction — do this first.

**FIXED (2026-07-29):** `lib/prisma.ts` now sets a global client-level
`omit: { user: { passwordHash: true } }`, so every read/include anywhere in the app
omits it by default. The only two call sites that legitimately need it
(`lib/auth.ts`'s `authorize`, `lib/services/register.ts`'s already-registered check)
explicitly override with `omit: { passwordHash: false }` per Prisma 7's per-query
override support. New test in `tests/integration/services/users.test.ts` asserts
`passwordHash` is absent from `listUsers()` results.

### C3. No transactions anywhere — `respondToRequisition` is a 3-write TOCTOU race
`lib/services/requisitions.ts:43-67` reads the requisition, then does 3 independent writes
(create Task → notify → update Requisition status) with zero `prisma.$transaction` calls in
the entire repo. A double-click or a mid-request failure creates duplicate tasks and
duplicate notifications, and an already-`RECHAZADA` requisition can be re-accepted since the
read never re-checks status. Same shape in `createRequisition` and `sendMessage`.

**FIXED (2026-07-29):** `respondToRequisition` now runs inside `prisma.$transaction`,
re-checks `status === "PENDIENTE"` on read, and uses Prisma's extended-unique-where
(`update({ where: { id, status: "PENDIENTE" }, ... })`) as a second, DB-enforced guard
against a genuinely concurrent accept — any P2025 from that guard is caught and turned
into a clear error, rolling back the whole transaction (including the Task already
created in that same transaction). `createNotification` now accepts an optional
transaction client so it can participate in the same transaction. `createRequisition`
and `sendMessage` were also wrapped in `$transaction` for consistency (mechanical fix,
not independently covered by a new test — there's no way to fail only the notification
write without an artificial mock, which the TDD skill discourages). New test in
`tests/integration/services/requisitions.test.ts` proves a second accept on an
already-accepted requisition is rejected and only one Task ever exists.

### C4. Zero indexes on any foreign key or filter column
Verified against the live DB (`pg_indexes`): only PKs/unique constraints exist. Every list
query (board, notifications poll every 30s/user, messages, requisitions inbox, goals-by-month,
calendar) is a sequential scan, and every `ON DELETE CASCADE/SET NULL` locks the child table
on scan. Add `@@index` on every FK plus `(assigneeId, status)` for the board and
`(userId, read)` for notifications.

**FIXED (2026-07-29):** added `@@index` to every FK column across all 16 models in
`prisma/schema.prisma`, plus the two composites called out above
(`Task(assigneeId, status)`, `Notification(userId, read)`) and `Goal(month, userId)` /
`Post.scheduledDate` for the other named hot paths. Migration
`prisma/migrations/20260729140207_add_missing_indexes/` applied and verified against
the local Postgres DB.

---

## HIGH (deployment blockers — fix before Phase 7)

- **H1 — Deleted users keep a valid session for the JWT's full life (default 30 days).**
  `lib/auth.ts:35-42`'s `jwt` callback tolerates `dbUser === null` and returns the token
  unmodified instead of invalidating it. No `maxAge` is set either.
- **H2 — The Configuración allow-list is completely decorative.** `lib/authAllowList.ts`
  reads only `SEED_SUPERUSER_EMAIL`/`ALLOWED_EMAIL_DOMAIN` env vars; `OrgSettings.allowedEmails`
  (written by the Configuración UI, confirmed "Guardado.") is never read by the sign-in or
  registration path. Independently found by 3 of the 7 reviewers.
- **H3 — Broad IDOR: list/mutation endpoints have no ownership scoping.** Any authenticated
  user can read every requisition/task/goal in the org (unfiltered `GET`s), set any teammate's
  goal progress to any number, toggle any checklist item, and disable any automation
  (`PATCH /api/automations/[id]` has no level check even though `POST` does).
- **H4 — Account takeover via `/register` on password-less rows, no email verification
  anywhere, and a bootstrap race on `SEED_SUPERUSER_EMAIL`** (a personal Gmail address
  currently in `.env` — whoever registers it first in production becomes SUPERUSER, so
  bootstrap must happen in the same minute as go-live, not after).
- **H5 — No rate limiting on sign-in or register**, plus a timing oracle (early return before
  `bcrypt.compare` on a nonexistent email) that lets an attacker enumerate valid staff emails.
- **H6 — Migration `20260728214531` (RoleTag rename DIRECTOR→DEVELOPER) empirically fails**
  if any row still has `roleTag='DIRECTOR'` when replayed — verified by replaying all 5
  migrations against a scratch DB. The author's "verified no DIRECTOR rows" comment is a
  point-in-time claim baked into a migration that will run again on Neon / any restored
  backup / any teammate's DB.
- **H7 — `PATCH /api/tasks/[id]` always 500s when changing `assigneeId`** — `Prisma.TaskUpdateInput`
  has no `assigneeId` field (only `TaskUncheckedUpdateInput` does); the spread bypasses
  TypeScript's excess-property check so `tsc` sees no problem. Untested — no route-handler
  tests exist anywhere, only service-level tests.
- **H8 — `npm run lint` is currently red** (`NotificationBell.tsx:18`,
  `react-hooks/set-state-in-effect`) — confirmed by 3 reviewers independently. The lint gate
  fails as-is.
- **H9 — `proxy.ts` enforces nothing.** No `authorized` callback is defined, so the Next 16
  proxy is a pure pass-through (verified against `next-auth`'s source). Real protection today
  comes only from per-route `auth()` calls and the `(app)` layout guard — which do hold, but
  the next route added outside that structure ships unauthenticated by default. Concretely,
  `app/page.tsx` is still the untouched `create-next-app` scaffold, publicly reachable at `/`.
- **H10 — Nothing in the UI can create a Project, Product, or Task.** `POST /api/projects`
  and `/api/tasks` have no caller anywhere in `components/`; `createProduct` has no route
  handler at all (dead code, reachable only from its own test). `/proyectos` is read-only.
  The only way a Task is ever created is via an accepted Requisition. This means the "12
  working modules" claim from the run log is overstated for Proyectos.
- **H11 — Server-side auth checks missing on automations/goals/tasks mutations** (same
  family as H3, called out separately by multiple reviewers as UI-only enforcement, which the
  design spec explicitly forbids: *"never enforced only in the UI"*).
- **H12 — Analítica's goal-completion metric is structurally stuck at 0%.** Nothing in the
  app ever sets `Goal.status = APROBADA` (no approve/complete UI or endpoint exists); the
  integration test only passes because it seeds that status directly via Prisma, masking the
  gap.
- **H13 — Prisma internals leak through error responses.** Several routes return `err.message`
  verbatim on a 403/500, including raw Prisma `NotFoundError`/enum-validation text (model
  names, query shape).

---

## MEDIUM (fix soon, not necessarily before first deploy)

- Every client mutation except `components/kanban/Board.tsx` ignores `res.ok` — failures
  (403s, 500s, validation errors) render as silent success ("Guardado." on a rejected
  Configuración save, cleared forms on failed submits, stale badges in Equipo).
- Informes' PDF export can produce a fully-formed, dated, signed report claiming "0
  activities" when the underlying fetch actually failed — worse than a hard error because the
  artifact is portable and carries no signal of its own invalidity.
- `GoalCard` PATCHes on every keystroke (debounce/onBlur needed); clearing the field persists
  `0` with no undo.
- `OrgSettings` singleton has no uniqueness constraint — concurrent first-loads can create two
  rows and settings appear to randomly revert (`findFirst` with no `orderBy`).
- No pagination anywhere; Analítica/Dashboard do O(users × tasks) in-memory aggregation over
  full unbounded reads.
- No error boundaries (`error.tsx`/`global-error.tsx`) anywhere in `app/`.
- Accessibility: WCAG AA contrast failures on the primary accent color (2.54:1, needs 4.5:1)
  and `--text-faint` (3.5:1); 5 forms rely on `placeholder` instead of `<label>`; Calendario's
  drag-and-drop scheduling has no keyboard/click fallback and is fully unusable without a
  mouse; notification bell dropdown has no `aria-expanded`/dismissal semantics.
- Automatizaciones' "no execution engine yet" disclaimer is real but is styled as the
  lowest-contrast text on the page, below the fold, while the heading, empty state, and a
  green "Activa" badge all assert the opposite.
- `draggedTaskId` ref never cleared after a drop (CalendarGrid/Board) — a later unrelated drag
  event can silently create a duplicate scheduled post.
- `ThreadView` can double-send a message on two fast Enter presses (guard checks `content`,
  not the in-flight `sending` state).
- Integration tests run against `DATABASE_URL` directly with no `_test` guard and at least one
  unscoped `deleteMany()` — running `npm test` against a shared/prod DB would delete real data.
- Every timestamp column is `timestamp(3)` without timezone, not `timestamptz` — spec/plan
  both say UTC `timestamptz` explicitly.

## LOW / cleanup

- `app/page.tsx` is still the create-next-app template.
- `Account`/`Session`/`DriveFile` tables and `driveFolder*` columns remain in the schema
  post-ADR-0010 (Drive was cancelled) — dead columns, not a bug.
- `supertest` installed and used by nothing; `prisma` CLI in `dependencies` instead of
  `devDependencies`.
- `next` is on 16.2.12; bump past 16.3.0 clears 3 production-tree `npm audit` advisories
  (postcss, sharp — both low real risk here, no user-uploaded images/CSS).
- No `deactivatedAt`/active flag on `User`, and several FKs are `ON DELETE RESTRICT` — an
  offboarded employee's row can never be deleted.
- cuid TEXT primary keys age worse than UUIDv7 for index locality, not urgent at this scale.

## Verified clean (don't re-check these next pass)

- No SQL injection surface (zero raw `$queryRaw`/`$executeRaw` usage anywhere).
- No XSS surface (zero `dangerouslySetInnerHTML`, `innerHTML`, `eval`).
- No SSRF surface (every client fetch targets a hardcoded same-origin path).
- No secrets committed anywhere in git history (verified via full-history pickaxe search);
  `.env` correctly gitignored, only `.env.example` (placeholders) is tracked.
- No embedded/vendored third-party code — everything is either project source or a declared
  npm dependency.
- `roleTag` self-declaration at registration is NOT an escalation path — constrained by
  `z.enum` to the 10 non-privileged values and never read for authorization decisions.
- Next.js 16 / Prisma 7 migration specifics (proxy.ts naming, async route params, driver
  adapter, generator output path) are all handled correctly and consistently.
- Password storage is genuine bcrypt via `bcrypt.compare`, no plaintext/weak-hash comparison.

---

## Recommended fix order

1. C2 (passwordHash leak) — smallest change, largest blast-radius reduction.
2. C1 (privilege escalation) — rank-based authorization + enum validation.
3. H4 (register account-takeover) + bootstrap the real SUPERUSER before the app is reachable.
4. H1 (session invalidation on deleted user) + H9 (`authorized` callback on the proxy).
5. H2 (make Configuración's allow-list actually read) — or pull the screen until it does.
6. C3 (wrap multi-write services in `$transaction`) + C4 (add indexes).
7. H8 (fix the lint error) — blocks CI as-is.
8. H6 (fix the DIRECTOR migration) before this repo is ever restored/deployed anywhere the
   old data existed.
9. H10 (decide: build the missing Project/Task creation UI, or explicitly descope it — but
   stop advertising it as done).
10. Everything else in HIGH, then MEDIUM.

None of this requires re-planning — it's execution fixes against the existing plan/spec, not
a scope change. Recommend running these as ordinary TDD tasks against the existing services,
then re-running the security-reviewer + database-reviewer passes only (not the full 7-agent
sweep) to confirm before Phase 7.
