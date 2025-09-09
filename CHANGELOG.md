# Changelog

All notable changes to this project will be documented in this file.

## v11 - 2025-09-09

- Next.js UI: Added Drizzle migrations for hospital profiles/summaries (2024 + by-year), indexes, optional PostGIS geom + GIST index, and API distance filter using PostGIS with Haversine fallback.
- Ingestion: Relaxed strict patterns/enums for FEIN/ZIP/phones/FY dates and numeric counters; pipeline now runs cleanly for 2024 Hospital and 2023 Hospital/ESRD/ASTC/LTC.
- Normalization: Added scripts to normalize ASTC ownership types and common fields (FEIN/ZIP/phones/dates); wired into `make normalize`.
- Geo overlays: Added tooling to fetch Illinois counties, generate HSA/HPA overlays from CSV/HTML, and (optionally) merge Chicago Community Areas parsed from the provided HTML.
- CSV helpers: Generated full county→HSA/HPA templates and a filler that derives codes from hospital survey CSVs.
- CI: Added UI workflow (lint/typecheck/build) and data pipeline workflow (runs `make publish`).
- Docs/Dev UX: Improved `.env.local` guidance; Makefile targets added: `geo`, `geo-counties`, `geo-csv`, `geo-chicago`.

## v10 - 2025-09-04

- Filters: Fixed select events (use `change`) and search on `input`; applied deep-link `view=full` on load.
- Full-screen: Added inline Year/Type pickers, facility navigator, reset button, and visible “Full Screen” badge.
- Reset: Added “Reset Filters” in sidebar and full-screen; clears filters, deep-link params, and exits full-screen.
- CSV exports: Fixed broken "Export All Tables (CSV)"; added per-table CSV buttons across dashboard sections and profiles; added profile-level "Export All Tables".
- Imaging (Hospital): Added "Imaging Equipment — Units" (CT/MRI/PET/Nuclear) counts alongside exam tables.
- Profiles: Added demographics/payer charts; grouped “All Fields” by dictionary sections; normalized Hospital section headings (Ownership & Organization, Management Contracts, Outpatient Activity).
- Build metadata: Added `build.json` (version, short/long SHA, timestamp); header/footer show version and link to the commit on GitHub.
- UX polish: Added visible version badge, footer build line, inline SVG favicon, and a Debug events toggle with console logs (`?debug=events`).
- Stability: Exposed `state` on `window` to prevent undefined references; removed legacy code causing a fatal JS syntax error.
