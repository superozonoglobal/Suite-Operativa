# ADR-0005: Hosting on Vercel (Next.js) + Neon (serverless PostgreSQL), deployed from `github.com/superozonoglobal/Suite-Operativa`

## Status
Accepted — 2026-07-28

## Context
The user confirmed hosting should be planned from the start, not deferred, and
already created the two account-bound destinations this project deploys to:
- GitHub repo: `https://github.com/superozonoglobal/Suite-Operativa` (created by
  the user specifically to hold the new rewrite — not yet configured as a `git
  remote` on the local `PROYECTOS/src` repo; no remotes are currently set there).
- Vercel team: `https://vercel.com/robinsons-projects-27c1b844` (the user's
  existing Vercel account/team — the new Next.js project gets created inside this
  team, linked to the GitHub repo above).

The current production app runs on Hostinger (static file hosting for the 4 MB
`index.html`) fronting Apps Script.

## Deployment coordinates (concrete, for reference by the implementation plan)
| What | Where |
|---|---|
| Local working copy | `C:\Users\MI PC\Documents\PROYECTOS\src` (this git repo) |
| GitHub remote | `https://github.com/superozonoglobal/Suite-Operativa` |
| Vercel team | `https://vercel.com/robinsons-projects-27c1b844` |
| Vercel project | Created inside the team above, linked to the GitHub repo (import-from-Git flow) — exact project name/URL to be filled in once created (plan task) |
| Neon project | Not yet created — plan task, linked into the Vercel project via env vars |
| Local dev DB | Docker Compose PostgreSQL container (unchanged from the superseded plan) |
| Current production (unaffected by this work) | `superozono.dgazcarate.online` (Hostinger) |

## Decision
- **Vercel** hosts the Next.js app, deploying from the `main` branch of
  `github.com/superozonoglobal/Suite-Operativa` (preview deployments per PR,
  production deployment on merge to `main`).
- **Neon** provides the managed PostgreSQL database (serverless Postgres,
  scale-to-zero on the free/dev tier, branching for preview-deploy databases —
  pairs naturally with Vercel preview deployments and with Prisma's connection
  pooling story via Neon's pooled connection string).
- Local dev keeps using the `docker-compose.yml` PostgreSQL 14/15 container from
  the superseded plan (unchanged decision) — Neon is for deployed environments
  (preview + production), not local dev.

## Alternatives considered
1. **Supabase** — also a strong option (managed Postgres + built-in
   auth/storage). Rejected only because we're already using Auth.js for
   auth (ADR-0003) and Drive for files (ADR-0004), so Supabase's bundled
   auth/storage features would go unused — plain managed Postgres is all that's
   needed, and Neon's branch-per-PR model fits the Vercel preview-deploy workflow
   more directly.
2. **Railway** — good all-in-one (app + Postgres in one place), but then the app
   isn't on Vercel, giving up Vercel's first-class Next.js support (ISR, edge
   middleware, image optimization) for a marginal simplicity gain. Rejected.
3. **Vercel + Neon (chosen)** — first-class Next.js hosting, serverless Postgres
   that matches Vercel's serverless function model (no long-lived connections to
   exhaust a fixed pool), branch databases for safe preview testing.

## Consequences
- A **connection pooling** decision falls out of this: Vercel serverless functions
  open/close DB connections per invocation, so Prisma MUST use Neon's pooled
  connection string (`?pgbouncer=true` / Neon's pooler endpoint) or Prisma
  Accelerate — a direct (unpooled) connection string will exhaust Postgres's
  connection limit under load. Called out as an explicit plan task.
- Environment variables (`DATABASE_URL`, `AUTH_SECRET`, `GOOGLE_CLIENT_ID`,
  `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_GOOGLE_PICKER_API_KEY`) are configured in
  Vercel's project settings, never committed — `.env.example` documents the shape,
  `.env` and `.env.local` stay gitignored (continuing the pattern the superseded
  `backend/.gitignore` already established).
- Setup requires the user to: (1) `git remote add origin
  https://github.com/superozonoglobal/Suite-Operativa.git` and push once the new
  project scaffold exists locally, (2) import that GitHub repo as a new Vercel
  project inside the `robinsons-projects-27c1b844` team, (3) create the Neon
  project/database and wire its pooled connection string into the Vercel
  project's environment variables. These are account-bound, human-only actions —
  called out as plan tasks the executor cannot perform, not automated steps.
- This does not touch the current production hosting
  (`superozono.dgazcarate.online` on Hostinger) — that keeps running unchanged
  until the cutover decision in ADR-0006 is executed.
