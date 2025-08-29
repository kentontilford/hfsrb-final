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

