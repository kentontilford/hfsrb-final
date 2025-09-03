# HFSRB Annual Facility Survey — Schemas

Data dictionaries and generated JSON Schemas for Illinois HFSRB annual facility surveys (2023), covering ASTC, ESRD, Hospital (AHQ Short/Long), and LTC variants.

## Contents

- `schemas/` — Authoritative Markdown data dictionaries per application
  - One folder per app: `astc/`, `esrd/`, `ahq-short/`, `ahq-long/`, `ltc-1/`, `ltc2/`, `ltc3/`, `ltc4/`, `ltc5/`
  - `schemas/_template/README.md` — template
  - `schemas/json/` — generated JSON Schemas
- `scripts/` — tooling to generate and validate schemas
- `references/` — extracted text from source PDFs (for traceability)

## Quick Start

- Generate JSON Schemas from Markdown:
  - `python3 scripts/generate_schemas.py`
- Validate data against a schema:
  - `python3 scripts/validate.py <schema-name> <path/to/data.json>`
  - Example: `python3 scripts/validate.py astc samples/astc.json`

## Data Directories

Facility JSON folders live under `data/<YEAR>/<TYPE>/<id>-<name-slug>/`.

- Hospitals/LTC: created from the year-specific CSVs if present (e.g., `hospital_survey_<year>.csv`, `ltc_survey_<year>.csv`) via `make data`.
- ASTC/ESRD: use the current facility lists in the root `ASTC.xlsx` and `ESRD.xlsx`. These lists are current and can be applied to any year.

Create ASTC/ESRD directories for any year using the current lists:

- `make data-xlsx YEAR=2024` (replace YEAR with the target year)

Notes
- The XLSX-based step is idempotent and safe to run for multiple years; it only ensures the folder structure and a `.gitkeep` file.
- After creating directories, run the mappings pipeline to populate `schema_payload.json` and rebuild the dashboard:
  - `make publish` (runs mappings → dashboard-data → profiles and stages site under `out/site`).

## Authoring Conventions

- Each Markdown dictionary includes: Overview, Conventions, Fields table, Enumerations, Validation Rules, Mapping Notes.
- Field table columns: `field_id`, `field_label`, `field_name`, `type`, `required`, `allowed_values`, `format`, `unit`, `section/page`, `notes`.
- Enumerations: defined under `## Enumerations` with `### <enum_name>` and `- code — label` bullets.

## Tooling

- `scripts/generate_schemas.py` builds Draft-07 JSON Schemas from the Markdown tables and enums.
- `scripts/validate.py` validates JSON payloads using `jsonschema`.

## Notes

- Field names are treated as flat keys in JSON Schema to match the authored contract.
- Regex formats in Markdown become JSON Schema `pattern` entries; date fields get `MM/DD/YYYY` patterns where noted.

## Deployment (GitHub Pages)

This repo includes a GitHub Actions workflow that builds the dashboard and deploys a static site to GitHub Pages.

- Trigger: pushes to `main` (or run manually via Actions).
- Build steps: `make all`, generate HTML+PDF profiles (`make profiles-puppeteer-all`), then `make publish` to stage the site under `out/site`.
- Deploy: the action uploads `out/site` and publishes it via Pages.

To enable:

- In repo Settings → Pages, set Source to “GitHub Actions”.
- Push to `main` (or use “Run workflow”) and wait for the `Deploy GitHub Pages` workflow to complete.

URLs and paths are relative, so the site works for both user/org and project Pages. Profile links resolve to `out/profiles/...` under the site root. PDFs are generated with Puppeteer/Chromium and included alongside the HTML.

Troubleshooting
- If PDFs fail due to Chromium download issues, re-run the workflow; GitHub-hosted runners allow the Puppeteer install step (`npm ci`) to fetch Chromium.
- If you prefer WeasyPrint instead of Puppeteer, we can add the necessary OS packages and use the Python renderer; Puppeteer is used by default for portability.
