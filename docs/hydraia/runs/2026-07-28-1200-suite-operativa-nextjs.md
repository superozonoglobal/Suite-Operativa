# Run Log: Suite Operativa — Next.js Full-Stack Rewrite

**Original request (translated from Spanish):** "Verify the photos in
`Desktop/modulo de inicio` against the code in
`Documents/PROYECTOS/src/Suite_Operativa_Frontend` — I want an implementation
plan in Next.js with a complete backend and database (the current version was
built on Google Sheets, visual-only, no real backend). Recommend frameworks and a
backend (maybe PostgreSQL). Also verify whether Google Drive can be integrated for
files. Do this with Hydraia."

**Route:** Greenfield (`/hydraia:architect` equivalent), explicitly stopped at the
frozen plan per the user's confirmed answer to the "scope for today" question
(plan only, no execution this session).

**Spec:** `docs/hydraia/specs/2026-07-28-suite-operativa-nextjs-design.md`
**Plan:** `docs/hydraia/plans/2026-07-28-suite-operativa-nextjs.md`
**ADRs:** `docs/hydraia/adr/0001` through `0007`

## Key context discovered mid-run (not known at the start of this session)
- A prior session had already started this exact initiative:
  `docs/superpowers/plans/2026-07-28-suite-operativa-fullstack.md` (Express +
  Sequelize + Postgres, React 18 frontend — no Next.js) with only Task 0-1 (an
  empty Express skeleton) ever committed. Superseded by ADR-0001/0002.
- A visual rebrand (`REBRAND_DESIGN.md`, emerald palette) had already been
  designed but only applied to a dev harness, never to production. Superseded
  into ADR-0007 with the user's confirmation to keep emerald over the
  screenshots' chartreuse look.
- The user had already created the destination GitHub repo
  (`github.com/superozonoglobal/Suite-Operativa`) and has an existing Vercel team
  (`vercel.com/robinsons-projects-27c1b844`) — captured in ADR-0005.

## Phase checklist
- [x] Phase 0 — Context (read `PENDIENTES.md`, `RECONCILIACION_BLUEPRINT.md`,
      the superseded fullstack plan, `REBRAND_DESIGN.md`, `data.js`,
      `reports.js`, and 2 reference screenshots — `Dashboard.png`,
      `proyectos.png` — to confirm the domain model and module list)
- [x] Phase 1 — Think before coding (karpathy-guidelines applied inline: verified
      claims against actual files/screenshots rather than trusting stale memory
      or the superseded plan's ERD at face value — e.g. dropped an invented
      `Project.status` field after `proyectos.png` showed no such UI)
- [x] Phase 2 — Design + threat model: 7 ADRs + design spec written and committed,
      one adversarial self-review pass run (found and fixed: a race-condition
      bootstrap flaw in the director-role assignment logic, ADR-0003)
- [x] Phase 3 — Plan + self-review loop: plan written, two self-review passes run
      (Pass A found a self-contradictory verification step in Task 0-3; Pass B
      found a shell-quoting bug in Task 0-1's verification command — both fixed
      inline). `.active-plan` deliberately NOT armed (plan-only stop).
- [~] Phase 4 — Execution: **Phase 0 and Phase 1 of the plan done** (user asked
      explicitly to start only these two, in a later same-day session). Phases
      2-7 of the plan NOT started. Commits: `7f9416e` (Task 0-1, delete
      superseded backend), `e194bca` (Task 0-2, Next.js 16 + Prisma 7 scaffold),
      `b12aa56` (Task 0-3, full schema + migration), `cb65ab8` (Task 1-1,
      Auth.js), `a72def5` (Task 1-2, app shell). No double code review or
      verify-and-close run yet — deferred until more of the plan is built.
- [ ] Phase 5 — Code review (not run — only 2 of ~10 plan phases exist so far)
- [ ] Phase 6 — Verify & close (not run — see above)

## Platform deviations discovered during Phase 0-1 execution (not knowable at
## plan-writing time, now documented inline in the plan's Global Constraints)
- `create-next-app@latest` installed **Next.js 16.2.12**, not 15 — `middleware.ts`
  is renamed to `proxy.ts` (export `proxy`, not `middleware`); Route Handler
  `params` are now a Promise (`await params`), relevant to every not-yet-written
  `[id]/route.ts` task in Phases 2+.
- `npx prisma init` installed **Prisma 7.9.1**, not 5/6 — generator provider is
  `prisma-client` (not `prisma-client-js`) with a required custom `output` path,
  and a driver adapter (`@prisma/adapter-pg`) is now REQUIRED for Postgres, not
  optional. `lib/prisma.ts` and every later `import { PrismaClient / Prisma /
  User... } from "@prisma/client"` in the plan's not-yet-written tasks must
  import from `@/app/generated/prisma/client` instead.
- No Docker installed on this machine — local dev uses the machine's existing
  native PostgreSQL 18 (scoop-installed) instead of the plan's `docker-compose.yml`
  (kept in the repo for teammates who do have Docker).
- Task 1-1's plan-specified smoke test was upgraded: extracted `isEmailAllowed`
  into `lib/authAllowList.ts` for real unit coverage (6 cases) instead of the
  weak "module loads" check the plan had flagged as a known limitation.
- Verified: `npm run build`, `npx tsc --noEmit`, and `npx vitest run` all pass
  clean after Phase 1. Manual browser verification of the full sidebar (all 12
  links, active-route highlight) and a real Google sign-in are both blocked on
  Task 7-1 (Google Cloud OAuth credentials — human-only, not done yet) — noted
  as an open item, not silently skipped.

## Known scope cuts (flagged in the plan, not silently dropped)
- No historical data migration from Google Sheets (ADR-0006, explicit user choice).
- No realtime messaging (polling/manual refresh only) — no evidence of need yet.
- Automations (Task 6-3) store rules but do not build a trigger-execution engine
  — no evidence yet of which triggers must fire automatically.
- No E2E suite in this plan (greenfield project, no existing E2E framework to
  detect) — flagged as a Phase-6-equivalent follow-up once MVP modules exist.

## Next steps
1. Continue execution with the plan's Phase 2 (Proyectos, Metas, Calendario
   Editorial) onward — `docs/hydraia/.active-plan` is already armed, pointing at
   this plan.
2. Task 7-1 (Google Cloud OAuth/Drive/Picker setup) unblocks real browser
   verification of the auth flow and app shell — worth doing early rather than
   waiting, since Phase 5's Drive integration also depends on it.
3. Task 7-2 (GitHub push + Vercel import + Neon wiring) can also happen any
   time — nothing so far depends on it, but the user has already created both
   the GitHub repo and Vercel team, so it's unblocked whenever desired.
4. No code review or verify-and-close pass has run yet — worth doing once a
   larger slice (e.g. through Phase 2 or the MVP) is built, not after every task.
