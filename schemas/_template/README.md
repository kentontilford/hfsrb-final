# <APPLICATION NAME> — Data Dictionary (Draft)

- Source: `<relative/path/to/source.pdf>`
- Year: `2023`
- Facility Type: `<type>`
- Status: Draft — pending field mapping from source PDF

## Overview

Brief description of the application, reporting scope, and any notable inclusions/exclusions.

## Conventions

- Types: `string`, `integer`, `number`, `boolean`, `date`, `datetime`, `enum`, `array`, `object`.
- Required: `yes`/`no`.
- Use `allowed_values` for enumerations and reference them in Enumerations.
- Use `format` for patterns (e.g., ZIP code, NPI, phone).

## Fields

| field_id | field_label | field_name | type | required | allowed_values | format | unit | section/page | notes |
|---|---|---|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |  |  |  |

## Enumerations

- Enum Name: description
  - code — meaning

## Validation Rules

- Cross-field or range validations, e.g. `beds_total = sum(beds_by_unit)`; date ranges; conditional requirements.

## Mapping Notes

- Any clarifications, assumptions, or references to specific form instructions.

