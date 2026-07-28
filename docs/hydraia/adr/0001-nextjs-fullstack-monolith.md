# ADR-0001: Next.js full-stack monolith (Route Handlers), no separate Express backend

## Status
Accepted — 2026-07-28

## Context
Suite Operativa runs today on Apps Script + Google Sheets as its "backend" (really a
spreadsheet used as a database via a script bound to it), with a React 18 frontend
loaded with no build step (`Suite_Operativa_Frontend/index.html`, 4 MB, all vendor
libs and app code inline). The team (~10 people, 1 director) uses this daily in
production at `superozono.dgazcarate.online`. The user wants a rewrite that is
"more solid": Next.js frontend, a real backend, and a real database.

A prior session had already started a separate Express + Sequelize + PostgreSQL
backend under `backend/` (plan: `docs/superpowers/plans/2026-07-28-suite-operativa-fullstack.md`).
Only Task 0-1 (an empty Express skeleton — `app.js` with `helmet`/`cors`/`/health`,
no routes, no models, no server `listen()`) was ever committed. No route, model, or
test code exists yet, so switching direction here costs effectively nothing.

## Decision
Build one Next.js (App Router) project that is both the frontend and the backend:
UI in React Server/Client Components, API surface as Next.js Route Handlers
(`app/api/**/route.ts`), business logic in a `lib/services/*` layer called directly
by both the Route Handlers and Server Components/Actions. Single Prisma client,
single deploy unit.

## Alternatives considered
1. **Next.js frontend + separate Express backend (continue `backend/`)** — more
   conventional REST separation, easier to swap frontend framework later, but two
   codebases/deploys/CORS configs to maintain for a team this small, and doubles the
   auth-session plumbing (Auth.js session on the Next.js side, JWT verification
   again on the Express side). Rejected: no evidence of a need for an independently
   scalable or independently deployable backend — the team is ~10 users.
2. **Keep Apps Script + Sheets, just modernize the frontend build (Vite)** — this is
   what `RECONCILIACION_BLUEPRINT.md` proposed. Rejected per explicit user
   direction: "eso lo estaban montando con Google Sheets... necesito algo más
   sólido" — Sheets-as-database has no real transactions, no relational integrity,
   and no practical way to do the RBAC/reporting/analytics modules 12 screens
   need. `RECONCILIACION_BLUEPRINT.md` remains valid as historical record but is
   superseded for this initiative.
3. **Next.js full-stack monolith (chosen)** — one language (TypeScript) end to end,
   one deploy (Vercel), Route Handlers give a real HTTP API boundary without a
   second process, Server Actions cut boilerplate for simple mutations. Matches
   Hydraia's monolith-by-default rule (microservices require evidence of an
   independent-scaling need, which does not exist here).

## Consequences
- The `backend/` Express skeleton (`backend/src/app.js`, `backend/package.json`,
  `backend/.env*`, `backend/docker-compose.yml`) is superseded and should be
  deleted when execution starts (Phase 0 of the implementation plan) — nothing of
  substance is lost.
- Prisma replaces Sequelize (see ADR-0002).
- Auth session (Auth.js) and Drive OAuth token live in the same Next.js process —
  no second token to broker between services (see ADR-0003).
- `Suite_Operativa_Frontend/*` (the loose, stale React source) and the 4 MB
  production `index.html` are both left untouched and continue serving the current
  team until cutover (see ADR-0006). This rewrite happens in a new `web/` (or
  root-level Next.js) directory, not in place.
