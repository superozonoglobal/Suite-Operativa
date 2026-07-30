# ADR-0009: Four-tier level hierarchy — Superusuario > Project Manager > Líder > Colaborador

## Status
Accepted — 2026-07-28 (restructures the `Level` enum introduced in the original
schema and referenced by ADR-0003/ADR-0008; those ADRs' auth-method decisions are
unaffected, only the set of level values and the bootstrap env var name change)

## Context
The original schema (Task 0-3) ported `Level { DIRECTOR, LIDER, COLABORADOR }`
directly from `Suite_Operativa_Frontend/data.js`'s `LEVELS` constant, and
`SEED_DIRECTOR_EMAIL` bootstrapped whoever signed in with that email to
`DIRECTOR` — the top permission tier. The user then clarified the real
organizational structure needed: a **Project Manager** who operationally runs
everything (equivalent to what `DIRECTOR` already did — task/project/team/goal
management, approving requisitions, configuring automations), and the user
themselves as a **Superusuario**, a developer-level tier above the Project
Manager. `leonardecojt@gmail.com` (the user) had already registered through
Task 1-1's credentials flow and was bootstrapped to the old `DIRECTOR` level
before this ADR — that row is data-migrated to `SUPERUSER` as part of this change
(see the migration below), not dropped.

## Decision
`Level` becomes a 4-value enum: `SUPERUSER`, `PROJECT_MANAGER`, `LIDER`,
`COLABORADOR` (highest to lowest). `DIRECTOR` is removed — `PROJECT_MANAGER` is
its replacement (same permission scope as the old `DIRECTOR` checks throughout
the spec/plan: only this tier and above may reassign roles, approve
requisitions, and configure automations), not an additional value alongside it.

The bootstrap env var is renamed `SEED_DIRECTOR_EMAIL` → `SEED_SUPERUSER_EMAIL`
(used by both `lib/authAllowList.ts`'s allow-list check and the
`createUser`/`registerUser` bootstrap logic) — it now grants `SUPERUSER`, not
`PROJECT_MANAGER`. No `SEED_PROJECT_MANAGER_EMAIL` exists: the user explicitly
chose to leave that assignment pending (no PM email known yet) — it is done
later through the Equipo module's role editor (Task 2-2), which already gates
role/level changes to director-and-above (now superuser/PM-and-above) actors.

## Alternatives considered
1. **5-tier: Superuser, Project Manager, Director, Líder, Colaborador (add both
   new tiers, keep Director)** — the alternative the user was offered and did
   NOT choose. Rejected: no evidence a THIRD "admin-ish" tier distinct from both
   Superuser and Project Manager is needed; every place `DIRECTOR` was checked
   in the spec/plan meant "the person who runs the whole operation," which is
   exactly what Project Manager now means.
2. **4-tier, Director renamed to Project Manager (chosen)** — minimal schema
   change (rename semantics of the top-of-the-old-hierarchy value, add one new
   value above it), matches the user's actual organizational structure.

## Consequences
- **Data migration required, not just a schema rename**: the existing
  `leonardecojt@gmail.com` row had `level = 'DIRECTOR'`. Two migrations handle
  this safely — (1) add `SUPERUSER`/`PROJECT_MANAGER` to the Postgres enum type
  (must be its own transaction; Postgres cannot use a newly-added enum value in
  the same transaction that added it), then (2) `UPDATE "User" SET level =
  'SUPERUSER' WHERE level = 'DIRECTOR'` followed by recreating the enum type
  without `DIRECTOR` (Postgres has no direct `DROP VALUE` for enums — the
  standard workaround is rename-old-type / create-new-type / cast column /
  drop-old-type). Both migrations are hand-written (not `prisma migrate dev`'s
  auto-diff) specifically to control this ordering and preserve the row.
- Every later plan task that checked `level !== 'COLABORADOR'` for an
  admin-gate (Task 2-2's `updateUserRole`, Task 4-1's Requisition approval
  authorization, Task 6-3's Automation creation) is unaffected in *logic* (still
  "not a plain contributor") but should read `SUPERUSER`/`PROJECT_MANAGER` in any
  UI copy or comments that named `DIRECTOR` specifically.
- `RoleTag.DIRECTOR` (a job-title tag in the unrelated 10-value catalog — "Director
  / PM" as a functional role like "Diseñador" or "Copywriting") is NOT touched by
  this ADR. `Level` (permission tier) and `RoleTag` (job title shown in the UI)
  remain two separate concepts, as they already were in `data.js`.
