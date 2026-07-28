# Design Spec: Suite Operativa — Next.js Full-Stack Rewrite

## Goal
Replace the Apps Script + Google Sheets "backend" and the build-less 4 MB React
frontend of Suite Operativa with a single Next.js (App Router) application backed
by a real PostgreSQL database, keeping the same 12 operational modules the team
already uses, adding real Google Drive file integration, and using Google sign-in
as the single source of both authentication and Drive access.

## Chosen approach + rejected alternatives
Full architecture reasoning lives in the ADRs (all under `docs/hydraia/adr/`,
accepted 2026-07-28, all confirmed directly with the user):
- **ADR-0001** — Next.js full-stack monolith (Route Handlers), not a separate
  Express backend. Rejects: continuing the `backend/` Express skeleton, and
  the conservative "keep Sheets, just modernize the build" path from
  `RECONCILIACION_BLUEPRINT.md`.
- **ADR-0002** — Prisma + PostgreSQL, not Sequelize. Rejects: Sequelize (JS-first,
  paired with the now-dropped Express backend), Drizzle (competitive but less
  mature Next.js tooling story for this team).
- **ADR-0003** — Auth.js v5 with Google as the only login method. Rejects: a
  home-grown email+password login (port of the current client-side mock) plus a
  separate "connect Drive" step.
- **ADR-0004** — Real Google Drive API integration, `drive.file` scope + Picker
  API for attach, direct upload for new files. Rejects: leaving `driveUrl` as a
  plain pasted string (no API calls), and a service-account/full-`drive`-scope
  approach.
- **ADR-0005** — Vercel (app) + Neon (Postgres), deployed from the user's new
  GitHub repo `github.com/superozonoglobal/Suite-Operativa`. Rejects: Supabase
  (redundant auth/storage we don't use), Railway (loses Vercel's Next.js-specific
  hosting features).
- **ADR-0006** — Direct cutover, fresh seed data, no historical Sheets migration.
  Rejects: writing a Sheets → Postgres import script.
- **ADR-0007** — Emerald visual identity (`REBRAND_DESIGN.md` tokens), not the
  chartreuse look the reference screenshots show. Rejects: matching the
  screenshots as-is.

## Code-graph anchors (existing structure this design must respect)
No `codegraph` index available for this project (JS-only, no build) — anchored via
direct file reads instead:
- **`Suite_Operativa_Frontend/data.js`** (`buildSeed()`, lines ~70-395) is the
  ground truth for the domain model. Confirmed entities and fields, ported to
  Prisma below:
  - `ROLES` (10 fixed roles: director, ventas, copywriting, publicista,
    disenador, filmmaker, editor_video, community_manager, trafiker, ecommerce),
    each with an `area`. `LEVELS` = director | lider | colaborador.
  - `User`: id, name, username, roleId, level, avatarColor, initials, phone,
    notifyChannel. (Password fields dropped entirely — Auth.js/Google replaces
    them, ADR-0003.)
  - `Project`: id, name, driveUrl (→ becomes a resolved Drive folder link, ADR-0004),
    `products: Product[]` (id, name, driveUrl).
  - `Task`: id, title, description, projectId, productId, roleId, assigneeId,
    status (todo|progress|review|done, from `STATUS_COLUMNS`), dueDate, dependsOn
    (array of task ids), metaId, driveUrl, `comments[]` (id, userId, text, ts),
    `history[]` (id, text, ts).
  - `Goal` ("Meta"): id, userId, title, type (numero|porcentaje|checklist), scope
    (personal|equipo), target, current, checklist items, status, month.
  - `Post` (Calendario Editorial): id, taskId, projectId, productId, title,
    platform (from `PLATFORMS`: instagram/tiktok/facebook/linkedin/x/youtube),
    scheduledDate, scheduledTime, status (`POST_STATUS`:
    borrador|programado|publicado), assigneeId.
  - `Requisition` ("Requisición"): id, fromUserId, toUserId, title, description,
    status (pendiente|aceptada|rechazada), motivo, ts, taskId (nullable).
  - `Notification`: id, userId, text, ts, read.
  - **Informes (Reports):** `Suite_Operativa_Frontend/reports.js` confirms this
    module has NO stored entity today — it filters `db.tasks` client-side
    (`filterTasks`: role/status/date-range) and renders a PDF entirely in-browser
    with `jsPDF` (`buildActivityReportDoc`). Port this as-is: Informes stays an
    on-demand PDF generated from a filtered `GET /api/tasks` query, not a
    persisted `Report` table — no evidence this team needs report history, so
    don't build it speculatively.
  - **Configuración:** the superseded plan's `docs/API_DESIGN.md` had `GET/PATCH
    /config` return `google_drive_folder` — that field is obsolete under
    ADR-0004 (Drive is per-user OAuth, not one org-wide pasted folder). What
    remains here: the team email allow-list controlling who can sign in (ADR-0003)
    and role/level assignment for each `User` — modeled as a small `OrgSettings`
    singleton row (allow-listed domains/emails) plus the existing `User.role`
    editable by a director from the Equipo screen, not a new module.
  - `Message`, `Automation`: present as state arrays (empty in the seed) with
    shapes documented in the superseded plan's `docs/ERD.md` draft — Message
    (sender_id, recipient_id OR channel, content, read_at), Automation (name,
    trigger, action JSON, enabled). Confirmed consistent with `data.js`'s comments
    ("mensajes directos del Director a miembros", "reglas cuando X entonces Y").
- **`docs/API_DESIGN.md`** (superseded plan) already lists a REST endpoint shape
  for all 12 modules under a `{ data, meta, errors }` envelope. This rewrite keeps
  that envelope convention for Route Handlers (global constraint below) but the
  endpoint list itself is superseded by the Prisma-shaped resources above (e.g.
  `role_id` FK becomes a `Role` enum + join, not a separate `Role` table with
  freeform `permissions` JSON — RBAC here is 3 levels × 10 role tags, not a
  generic permission-string system, no evidence more flexibility is needed yet).
- **`Suite_Operativa_Frontend/styles.css`** and **`REBRAND_DESIGN.md`** anchor the
  visual system (ADR-0007) — see UX section below.
- Sidebar module list, confirmed against `Desktop/modulo de inicio/Dashboard.png`:
  Dashboard, Mi Tablero, Metas, Calendario Editorial, Requisiciones, Proyectos,
  Mensajes, Analítica, Automatizaciones, Informes, Equipo, Configuración (12
  modules, matches the superseded plan's "12 integrated modules" claim exactly).

## Global constraints
- **Language/runtime:** TypeScript throughout (Next.js 15+, App Router, Node 20+).
- **API response envelope:** every Route Handler returns
  `{ data, meta, errors }` (`errors: []` on success) — same convention the
  superseded plan already committed to in `docs/API_DESIGN.md`, kept for
  continuity and because it gives a consistent shape for the frontend's fetch
  layer to assume.
- **Timestamps:** stored in UTC (Postgres `timestamptz`), formatted client-side —
  unchanged from the superseded plan's constraint.
- **Roles:** exactly the 10 role tags + 3 levels from `data.js`'s `ROLES`/`LEVELS` —
  do not invent a more general permission system without evidence it's needed.
- **All server-side mutations validate input** (Zod schemas in
  `lib/validation/*`) — client-side validation is UX only, never trusted.
- **Migrations:** `prisma migrate dev` locally, `prisma migrate deploy` in CI/CD —
  cumulative, reversible, never hand-edited SQL against a live database.
- **No historical data migration** (ADR-0006) — seed script only creates the role
  catalog + a placeholder for the director account; every other `User` row is
  created on first Google sign-in.
- **Drive scope:** `drive.file` only (ADR-0004) — never request the broad `drive`
  scope.

## Threat model + mitigations
- **Untrusted input:** every Route Handler receiving a body (task creation,
  comments, requisitions, messages) validates with a Zod schema server-side before
  touching Prisma — mitigates injection/malformed-data risk even though Prisma's
  parameterized queries already prevent classic SQL injection.
- **AuthN/AuthZ boundary:** Auth.js middleware protects every route under `app/(app)/*`
  and every `app/api/**` handler except the Auth.js callback routes themselves.
  Google sign-in is restricted to an explicit allow-list of team emails (or a
  Workspace domain match) in the `signIn` callback — this is a private internal
  tool, not a public signup surface. Role/level checks (director vs líder vs
  colaborador) happen server-side in `lib/services/*` before any mutation that a
  lower level shouldn't be able to perform (e.g. only director/líder can create
  Automations or approve Requisitions) — never enforced only in the UI.
- **PII/financial data handled:** names, emails, phone numbers (team roster) —
  no payment data anywhere in scope. Standard care: never log full request bodies
  containing these fields, HTTPS everywhere (Vercel default), Postgres connection
  over TLS (Neon default).
- **Secrets:** `AUTH_SECRET`, `GOOGLE_CLIENT_SECRET`, `DATABASE_URL`,
  `NEXT_PUBLIC_GOOGLE_PICKER_API_KEY` — all via Vercel env vars / local `.env`
  (gitignored), never committed, never returned in any API response.
- **External calls:** Google OAuth token exchange, Drive API, Picker API — all
  server-to-Google except the Picker widget itself (runs client-side by design,
  scoped to `drive.file`). Drive access/refresh tokens (`Account` table) are
  functionally equivalent to a password for file access — mitigated by the
  narrow `drive.file` scope (ADR-0004): a leaked token can only reach files the
  app itself created or the user explicitly opened with it, not the user's whole
  Drive.
- **OWASP categories at risk:** A01 Broken Access Control (mitigated by
  server-side role checks above, never client-only), A02 Cryptographic Failures
  (mitigated by TLS everywhere + no self-rolled password hashing to get wrong,
  since Google owns the credential), A03 Injection (mitigated by Prisma
  parameterization + Zod validation), A07 Identification/Auth Failures (mitigated
  by delegating identity entirely to Google OAuth instead of a custom auth system).

## UX / visual direction
Token values approved by the user (ADR-0007), no separate `ui-ux-pro-max` run
needed for these since they are already fully specified and user-confirmed:

- **Palette:** `--bg:#020d06` `--bg-elevated:#071409` `--surface:#0c1c11`
  `--surface-hover:#12271a` `--border:#1d3524` `--border-soft:#17291d`
  `--accent:#10b981` `--accent-dim:#037a3a` `--accent-bright:#45fc9c`
  `--accent-ink:#ffffff` `--text:#eef7f1` `--text-muted:#8fae9c`
  `--text-faint:#5c7568`. Functional/status colors unchanged from the current
  app: `--coral`, `--sky`, `--violet`, `--amber`, `--danger`, `--mint` (exact
  values ported from `Suite_Operativa_Frontend/styles.css` at implementation
  time — they were explicitly out of scope for the rebrand, so pull them as-is).
- **Type scale:** display font `'Plus Jakarta Sans'` (headings, dashboard
  numbers), body `'IBM Plex Sans'`, mono `'Space Mono'` (timestamps, ids, code-like
  values). Wordmark "Super" in Poppins Regular + "OZONO" in Poppins Black, unchanged.
- **Layout/spacing:** dark-mode-only (no light theme — this is an internal tool,
  matches both the current app and the real public site). Fixed left sidebar
  (icon + label nav, ~260px, matches `Dashboard.png`'s proportions), main content
  area with a top bar (page title + role badge + notification bell), card-based
  content blocks with `--surface` background, `--border` 1px outline, generous
  internal padding (`24px`) matching the dashboard cards seen in the reference
  screenshots.
- **Buttons:** primary/accent button uses
  `linear-gradient(-45deg, var(--accent-dim), #00a050)` background, white text;
  hover uses `linear-gradient(-45deg, var(--accent), var(--accent-bright))`.
  Secondary buttons: `--surface-hover` background, `--border` outline, `--text` color.
- **New component (no chartreuse-era precedent) — Drive file picker/list, since
  this is genuinely new UI ADR-0004 introduces:**
  - Trigger: a small "+" icon button labeled "Adjuntar de Drive" next to a task's
    comment box / a requisition's description — opens Google's own Picker widget
    (Google-styled, not restyled — it's a Google-hosted iframe, out of our control
    and shouldn't be reskinned).
  - Attached-files list: small chip row, each chip = file-type icon + filename
    (truncated with ellipsis at ~180px) + a small external-link icon that opens
    `webViewLink` in a new tab. Chip background `--surface-hover`, border
    `--border-soft`, text `--text-muted`, `--accent` on hover.
  - Upload progress (new file upload, not Picker-attach): inline linear progress
    bar using `--accent` fill on a `--border-soft` track, directly below the chip
    row, replaced by the new chip on completion.
  - Empty state: muted text "Sin archivos adjuntos" in `--text-faint`, no icon
    (keep it quiet — this is a secondary affordance on task/requisition cards, not
    a primary screen).
- **Accessibility floor:** WCAG 2.1 AA — verify `--text` (#eef7f1) on `--bg`
  (#020d06) and `--accent-ink` (#ffffff) on the button gradient's darkest stop
  (#037a3a) both meet 4.5:1 contrast (both do: white-on-near-black and
  white-on-dark-emerald are high-contrast pairs by construction). All interactive
  elements (nav items, buttons, Drive chips) get a visible `:focus-visible` ring
  (`2px solid var(--accent-bright)`, 2px offset) — the current app has no
  documented focus-visible treatment, so this is a genuine improvement, not a port.
  All icon-only buttons (notification bell, Drive attach "+", external-link icon)
  get an `aria-label`.

## Data flow (high level)
1. User visits the app → Auth.js middleware redirects unauthenticated requests to
   Google sign-in → `signIn` callback checks the team allow-list → on success,
   Auth.js's Prisma adapter creates/updates the `User` + `Account` (Drive tokens)
   + `Session` rows.
2. Authenticated pages (Server Components) call `lib/services/*` functions
   directly (no HTTP round-trip needed within the same Next.js process) to read
   data for initial render.
3. Client-side mutations (creating a task, moving a kanban card, attaching a
   Drive file) go through `app/api/**/route.ts` Route Handlers, which validate
   (Zod) → call the same `lib/services/*` layer → touch Prisma → return the
   `{ data, meta, errors }` envelope. Using the same service layer for both
   Server Component reads and Route Handler writes avoids duplicating business
   logic between the two entry points.
4. Drive operations (`lib/drive/getDriveClient(userId)`) fetch the user's
   `Account` row, refresh the Google access token if expired, then call the
   `googleapis` Drive client — never store file bytes in Postgres, only Drive
   metadata (id, name, mimeType, webViewLink) in the `DriveFile` table.

## Testing approach
- **Unit:** Vitest for `lib/services/*` and `lib/validation/*` (pure functions,
  Prisma calls mocked via `prisma-mock` or a test database).
- **Integration:** Route Handler tests against a real test Postgres (Docker
  Compose service, `DATABASE_URL` pointed at a `_test` database, reset between
  test files via Prisma's `migrate reset`).
- **E2E:** out of scope for the initial plan (no Playwright/Cypress setup exists
  yet in this greenfield project) — flagged as a Phase-6-equivalent follow-up once
  the MVP modules exist, not fabricated here.

## Error handling
- Route Handlers never leak stack traces or Prisma error internals to the client —
  a shared `lib/api/errorResponse.ts` maps known error types (validation, not
  found, forbidden) to the right HTTP status + a safe `{ data: null, meta: {},
  errors: [{ message }] }` body, and logs the real error server-side.
- Drive API failures (expired/revoked token, rate limit, file not found) surface
  as a specific, human-readable error in the attach/upload UI ("No se pudo conectar
  con Drive, intentá de nuevo" / "El archivo ya no existe en Drive") rather than a
  generic failure — these are the realistic failure modes for a per-user OAuth
  integration and the UI must not silently swallow them.
