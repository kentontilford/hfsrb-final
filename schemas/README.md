# HFSRB Annual Survey Schemas

- Purpose: Markdown data dictionaries for each facility application, mirroring the style of `ltc-1.pdf`.
- Scope: 2023 ASTC, ESRD, AHQ Short (<100 beds), AHQ Long (≥100 beds), LTC2, LTC3, LTC4, LTC5.
- Status: Draft shells created; field-level mapping to be filled from source PDFs.

## Structure

- One folder per application under `schemas/`:
  - `astc/`, `esrd/`, `ahq-short/`, `ahq-long/`, `ltc2/`, `ltc3/`, `ltc4/`, `ltc5/`
- Each folder contains a `README.md` data dictionary.
- A reusable authoring template is available at `schemas/_template/README.md`.

## Authoring Conventions

- Types: `string`, `integer`, `number`, `boolean`, `date`, `datetime`, `enum`, `array`, `object`.
- Required: `yes`/`no`.
- Allowed values: list discrete codes or reference an Enum under the Enumerations section.
- Format: specify patterns (e.g., `^\d{5}$` for ZIP), or known formats (`email`, `phone`, `npi`).
- Units: include where applicable (e.g., `beds`, `visits`, `minutes`).
- Section/Page: reference the form section and page number to aid traceability.
- Avoid inventing fields; map 1:1 to the source application questions.

## Field Table Columns

| field_id | field_label | field_name | type | required | allowed_values | format | unit | section/page | notes |
|---|---|---|---|---|---|---|---|---|---|

## Workflow

1. Copy `schemas/_template/README.md` into the target app folder or edit the existing draft.
2. Populate metadata (source file, year, facility type).
3. Add each field as a row in the field table with precise labels from the PDF.
4. Define enumerations and cross-field validation rules.
5. Mark status as `In Progress` until fully mapped and reviewed.

## JSON Schemas

- Generate all schemas from Markdown: `python3 scripts/generate_schemas.py`
- Output location: `schemas/json/<app>.schema.json`
- Validate data: `python3 scripts/validate.py <schema-name> <path/to/data.json>`
  - Example: `python3 scripts/validate.py astc samples/astc.json`
