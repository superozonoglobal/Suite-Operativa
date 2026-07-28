# ADR-0007: Carry forward the emerald rebrand (not the chartreuse look in the screenshots) as the Next.js app's visual identity

## Status
Accepted — 2026-07-28

## Context
Two visual directions exist in the codebase for the "same" identity:
1. **Chartreuse/lime** (`#c6ff3d`), Fraunces serif display font — what
   `Suite_Operativa_Frontend/styles.css` shipped originally, and what the
   reference screenshots in `Desktop/modulo de inicio/` show (that folder captures
   the CURRENT live production look, e.g. `Dashboard.png`'s lime progress bars and
   active-nav highlight).
2. **Emerald/mint** (`#10b981`/`#45fc9c`), Plus Jakarta Sans — a rebrand designed
   2026-07-28 (`REBRAND_DESIGN.md`) to align the internal tool with the real public
   marketing site, `superozonoglobal.com`. Applied only to the dev harness
   (`index.dev.html`), never shipped to the production `index.html` the team
   actually uses.
This mismatch was surfaced to the user directly (options shown side by side with
exact hex values); the user chose emerald.

## Decision
The Next.js rewrite's design tokens (colors, the accent gradient, button text
color, font pairing) are the **emerald** values from `REBRAND_DESIGN.md`'s token
table, ported as-is:
```
--bg: #020d06        --accent: #10b981        --accent-ink: #ffffff
--bg-elevated: #071409 --accent-dim: #037a3a
--surface: #0c1c11    --accent-bright: #45fc9c
--surface-hover: #12271a
--border: #1d3524     --text: #eef7f1
--border-soft: #17291d --text-muted: #8fae9c
                       --text-faint: #5c7568
Functional (unchanged): --coral, --sky, --violet, --amber, --danger, --mint
Fonts: display 'Plus Jakarta Sans', body 'IBM Plex Sans', mono 'Space Mono'
Wordmark: "Super" (Poppins Regular) + "OZONO" (Poppins Black) — unchanged
Buttons: linear-gradient(-45deg, var(--accent-dim), #00a050), hover
  linear-gradient(-45deg, var(--accent), var(--accent-bright))
Logo: real mascot PNG from superozonoglobal.com/images/logo_ozono.png
```

## Alternatives considered
1. **Chartreuse (match the screenshots / current production)** — the team's
   day-to-day familiar look. Rejected by the user in favor of aligning with the
   real company brand.
2. **Emerald (the already-designed rebrand, chosen)** — already fully specified
   token-by-token in `REBRAND_DESIGN.md` (including the exact 9 hardcoded-rgba
   call sites it touches in the old CSS, useful as a checklist even though this is
   a from-scratch Tailwind/CSS-variables setup, not a port of that file). Matches
   the real public brand. Zero extra design work needed — token values are already
   decided and user-approved.

## Consequences
- This satisfies Hydraia's Phase 2 "UX / visual direction" gate with concrete,
  already-approved values — no separate `ui-ux-pro-max` design pass is needed for
  color/type-scale/spacing, since those are inherited byte-for-byte from
  `REBRAND_DESIGN.md`. New-to-this-rewrite UI (e.g. the Drive file picker/list
  component, which has no chartreuse-era precedent) still needs concrete
  component/interaction-state decisions — captured in the design spec's UX section.
- Implementation is via Tailwind CSS v4 theme tokens / CSS custom properties (not a
  literal copy of `styles.css`, since this is a from-scratch Next.js/Tailwind build,
  not a CSS file port) — same values, idiomatic Tailwind config shape.
- The team will see a different (emerald, not lime) look on cutover day — this is a
  deliberate, user-approved brand change, not an oversight; worth a one-line heads
  up when the team is told to switch URLs (ADR-0006).
