# ADR-0004: Google Drive integration — real API, `drive.file` scope, per-entity file lists

## Status
**Superseded by ADR-0010 (2026-07-28)** — the user decided against implementing
Google Cloud at all; this design is not built. Kept for historical record of
the original reasoning, not as a live plan.

## Context
Today, `data.js` models `driveUrl` as a plain string on `Project`, `Product`, and
`Task` (e.g. `"driveUrl": "https://drive.google.com/drive/folders/1AbCd..."`) — a
manually pasted link, no verification it exists, no listing of what's inside it, no
way to attach a file from inside the app. The user explicitly asked for real Drive
integration ("se pueda integrar google drive para archivos"), confirmed over the
"integración real vía API" option: list/upload/attach files to a Project, Product,
or Task directly inside the app.

## Decision
- Use the **Google Drive API v3** via `googleapis` (Node client), authenticated
  with the per-user OAuth token Auth.js already stores (ADR-0003) — every Drive
  call happens as the signed-in user, not a service account, so Drive's own sharing
  permissions are the source of truth for who can see what (no permission model to
  duplicate).
- Request scope **`drive.file`** (not the broad `drive` scope): the app can only
  see/create files it itself created or that the user explicitly opens via Google's
  file picker. This is the least-privilege scope that still supports "attach an
  existing file" (via **Google Picker API**, a separate small JS widget, not the
  Drive REST API) and "upload a new file into a project's folder."
- Data model: replace the free-text `driveUrl` string with a `DriveFolder` link
  (folder id + name, resolved once via Picker, stored on `Project`/`Product`) and a
  `DriveFile` join table (Drive file id, name, mimeType, webViewLink, linked to a
  `Task` or `Requisition` — "attach this file to this task/requisition"). The Drive
  file's bytes are never copied into Postgres — only Drive's own metadata (id,
  name, link) is cached for fast list rendering, refreshed on demand.

## Alternatives considered
1. **Keep it as a plain URL field (no API calls)** — the "solo vincular carpetas"
   option the user explicitly rejected in favor of real integration.
2. **Full `drive` scope, service-account-based, app "owns" a shared Drive** —
   simpler code (no per-user token dance), but the app would need its own Drive
   storage quota and a manual sharing step to add every team member, and it can
   silently see/touch every file the service account has access to. Rejected:
   broader blast radius than the feature needs, and Drive quota then belongs to a
   service account nobody personally owns.
3. **`drive.file` scope + Picker for attach, direct upload for new files (chosen)**
   — matches what the user already does today (dropping a link to an existing
   client folder) while adding real listing/upload, and keeps the OAuth consent
   screen honest ("this app can see files you open with it," not "this app can see
   your entire Drive").

## Consequences
- Requires a Google Cloud project with the Drive API enabled, an OAuth consent
  screen (internal/testing mode is enough for a 10-person team), and a Picker API
  key — these are manual one-time setup steps for the user in Google Cloud Console,
  called out explicitly as a plan task (they cannot be automated by an executor
  agent).
- `Account.access_token` expiry (~1h) means every Drive call path must attempt a
  silent refresh via `Account.refresh_token` before calling the Drive API — this is
  a shared `getDriveClient(userId)` helper, not repeated per-route logic (see the
  design spec's file-structure map).
- Threat model: `drive.file` scope significantly narrows what a stolen/leaked
  access token can do (only app-created/app-opened files, not the whole Drive) —
  called out again in the design spec's threat model section.
