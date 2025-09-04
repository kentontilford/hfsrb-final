# Changelog

All notable changes to this project will be documented in this file.

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

