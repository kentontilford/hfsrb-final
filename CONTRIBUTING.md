# Contributing

Thanks for helping improve the HFSRB Annual Facility Survey schemas. This repo’s source of truth is the Markdown data dictionaries under `schemas/`.

## Workflow

- Edit the relevant `schemas/<app>/README.md` Fields table.
- Update or add enums under `## Enumerations` using:
  - `### <enum_name>`
  - `- code — label` items
- Run `python3 scripts/generate_schemas.py` to regenerate JSON Schemas.
- Validate any sample payloads: `python3 scripts/validate.py <schema> <data.json>`.

## Style

- Keep field names consistent and descriptive. Avoid one-letter names.
- Use `required: yes|no`. Use `auto` or `conditional` only for human readers; the generator treats only `yes` as required.
- Put regexes in `format` when possible (e.g., `^\d{5}(-\d{4})?$`).
- Reference the form section and page in `section/page` for traceability.

## Adding a New Schema

- Copy `schemas/_template/README.md` into a new subfolder.
- Fill the Fields table and define any enums and validation rules.
- Run the generator and review the resulting JSON Schema.

## Code of Conduct

- Be respectful and constructive.
- Raise issues for missing fields, unclear wording, or validation gaps.

