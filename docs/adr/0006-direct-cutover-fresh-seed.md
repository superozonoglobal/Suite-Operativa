# ADR-0006: Direct cutover, fresh seed data — no historical migration from Google Sheets

## Status
Accepted — 2026-07-28

## Context
`superozono.dgazcarate.online` is live and used daily by the team. The user
confirmed the new Next.js app replaces it directly, with no migration of
historical Sheets data (tasks, past goals, message history) into the new database.

## Decision
The new app launches with **seed data only**: the 10 team members + roles from
`data.js`'s `buildSeed()` (names, roles, levels — re-entered as real `User` rows
tied to their Google account on first sign-in, not pre-created with fake
passwords), and the fixed catalogs (`ROLES`, `STATUS_COLUMNS`, `PLATFORMS`,
`POST_STATUS`) ported as Prisma enums/lookup tables. No `Task`, `Project`, `Goal`,
`Message`, or `Requisition` rows are migrated from the live Sheets-backed system —
the team starts those fresh in the new app from cutover day forward.

## Alternatives considered
1. **Migrate historical data (write a Sheets → Postgres import script)** — the
   option the user did not choose. Would require reverse-engineering the exact
   Apps Script `doGet`/`doPost` contract and the Sheet's column layout, and
   reconciling stale vs. completed data. Explicitly out of scope per the user's
   decision.
2. **Direct cutover, fresh seed (chosen)** — much smaller surface area, no import
   script to write/test/get wrong, no risk of double-counting or corrupting live
   production data during migration. Historical Sheets data simply remains
   accessible in the old Google Sheet as a read-only archive if ever needed —
   nothing is deleted, the old system is just no longer written to after cutover.

## Consequences
- The implementation plan does **not** include a data-migration task — this
  removes an entire, historically risky category of work from scope.
- Cutover is a communication/rollout event (tell the team "starting Monday, use
  the new URL"), not a technical data-migration event. A rollback plan is simply
  "point people back at the old URL" since the old system is untouched.
- An earlier plan for a parallel deploy + cutover on Hostinger no longer
  applies — that plan governed evolving the OLD system in place, which is
  superseded by this rewrite (ADR-0001).
