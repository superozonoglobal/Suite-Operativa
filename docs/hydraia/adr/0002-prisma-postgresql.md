# ADR-0002: PostgreSQL + Prisma ORM (not Sequelize)

## Status
Accepted — 2026-07-28

## Context
ADR-0001 moves the backend into the Next.js process itself (TypeScript). The
previous plan (`docs/superpowers/plans/2026-07-28-suite-operativa-fullstack.md`)
had picked Sequelize (JS, no first-class TS types) paired with a separate Express
backend. That pairing no longer applies once the backend lives inside Next.js.

## Decision
Use **Prisma** as the ORM against **PostgreSQL 15**. Schema lives in
`prisma/schema.prisma`, migrations via `prisma migrate dev` / `prisma migrate
deploy`, typed client via `@prisma/client`.

## Alternatives considered
1. **Sequelize (as the superseded plan had)** — works, but is JS-first; every model
   needs hand-written TS types or `sequelize-typescript` decorators to get type
   safety in a Next.js/TS codebase. Rejected: more boilerplate for the same result.
2. **Drizzle ORM** — lighter, SQL-first, good TS inference, genuinely competitive.
   Rejected only on maturity-of-tooling grounds for this team: Prisma Studio (a
   free local data browser) and Prisma's migration diffing are useful for a
   non-huge team that will not have a dedicated DBA, and Prisma's docs/examples for
   Next.js + Auth.js + Vercel are the most complete of the two.
3. **Prisma (chosen)** — typed client generated from the schema, `prisma migrate`
   gives reversible, timestamped migrations (matches the original plan's
   requirement "Database migrations via Sequelize CLI (cumulative, reversible)",
   just with Prisma's equivalent), first-class Next.js/Vercel guides, and Prisma
   Accelerate/Data Proxy solves the serverless connection-pooling problem that
   plain `pg`/Sequelize pools hit on Vercel (see ADR-0005).

## Consequences
- `backend/package.json`'s Sequelize/`pg`/`sequelize-pool` dependencies are dropped
  entirely (the whole `backend/` folder is deleted per ADR-0001).
- Every model in the ERD (`docs/ERD.md` from the superseded plan) is ported to
  `prisma/schema.prisma` as the single source of truth — see the design spec's
  "Code-graph anchors" section for the full field-level mapping from `data.js`'s
  seed shapes to the new schema.
- Local dev database still runs via `docker-compose.yml` (PostgreSQL 15 image) —
  this part of the original plan is unchanged, just the ORM talking to it differs.
