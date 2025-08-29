# LTC4 — 16 or Fewer Intermediate DD Beds — Data Dictionary (Draft)

- Source: `2023LTC4 -16 OR FEWER INTERMEDIATE DD BEDS .pdf`
- Year: `2023`
- Facility Type: Long-Term Care — Intermediate DD Beds (≤ 16)
- Status: Draft — pending field mapping from source PDF

## Overview

Annual survey for LTC facilities with 16 or fewer intermediate DD beds. Capture facility identifiers, ownership, bed counts by type, resident days, services, and staffing.

## Conventions

- Types: `string`, `integer`, `number`, `boolean`, `date`, `enum`.
- Required: `yes`/`no`.
- Use `allowed_values` for enumerations and reference them in Enumerations.

## Fields

| field_id | field_label | field_name | type | required | allowed_values | format | unit | section/page | notes |
|---|---|---|---|---|---|---|---|---|---|
| facility.license_number | Facility License Number | license_number | string | yes |  |  |  | Sec I p.2 |  |
| facility.name | Facility Name | facility_name | string | yes |  |  |  | Sec I p.2 |  |
| facility.address.line1 | Facility Address | address_line1 | string | yes |  |  |  | Sec I p.2 |  |
| facility.address.city | Facility City | address_city | string | yes |  |  |  | Sec I p.2 |  |
| facility.address.zip | Facility Zip Code | address_zip | string | yes |  | ^\d{5}(-\d{4})?$ |  | Sec I p.2 |  |
| facility.fein | Facility FEIN Number | fein | string | yes |  | ^\d{2}-\d{7}$ |  | Sec I p.2 |  |
| admissions.restrictions | Admission Restrictions | admission_restrictions | array | yes | ltc_adm_restrictions |  |  | Sec I p.2 | Multi-select; include None Applicable |
| reg_agent.* | Registered Agent (Name/Address/CityStateZip/Phone) | reg_agent_* | string | conditional |  |  |  | Sec I p.2 | Required if ownership requires RA |
| staffing.ftes.* | Staffing FTEs (Admin, Physicians, DON, RN, LPN, Certified Aides, Other Health, Other Non-Health, Total) | fte_* | number | yes |  |  | FTE | Sec I p.3 | Total auto |
| staffing.workweek_hours | Typical work week hours (full-time) | workweek_hours | integer | yes |  |  | hours | Sec I p.3 |  |
| census.jan1 | Patients in facility on Jan 1, 2023 | census_jan1 | integer | yes |  |  | patients | Sec I p.3 |  |
| admissions.initial_2023 | Initial admissions during 2023 | admissions_initial | integer | yes |  |  | admissions | Sec I p.3 |  |
| discharges.permanent_2023 | Permanent discharges during 2023 | discharges_permanent | integer | yes |  |  | discharges | Sec I p.3 |  |
| census.dec31 | Patients in facility on Dec 31, 2023 | census_dec31 | integer | auto |  |  | patients | Sec I p.3 | Calculated per instructions |
| beds.licensed_dec31.intermediate_dd | Licensed Beds — Intermediate DD (12/31/2023) | beds_licensed_idd | integer | yes |  |  | beds | Sec I p.4 |  |
| beds.set_up_dec31.intermediate_dd | Beds Set Up — Intermediate DD (12/31/2023) | beds_setup_idd | integer | yes |  |  | beds | Sec I p.4 |  |
| beds.highest_one_day_set_up.intermediate_dd | Highest One-Day Beds Set Up — Intermediate DD | beds_peak_setup_idd | integer | yes |  |  | beds | Sec I p.4 |  |
| beds.highest_one_day_occupied.intermediate_dd | Highest One-Day Beds Occupied — Intermediate DD | beds_peak_occupied_idd | integer | yes |  |  | beds | Sec I p.4 |  |
| beds.occupied_dec31.intermediate_dd | Beds Occupied — Intermediate DD (12/31/2023) | beds_occupied_idd | integer | yes |  |  | beds | Sec I p.4 |  |
| patient_days.total_2023.intermediate_dd | TOTAL PATIENT DAYS OF CARE 2023 — Intermediate DD | days_total_idd | integer | yes |  |  | days | Sec I p.4 |  |
| residents.dec31.by_age_sex.* | Residents by Age/Sex — as of Dec 31 | residents_age_sex_* | integer | yes |  |  | patients | Sec I p.4 | Age bands as listed |
| residents.dec31.by_race.white | Residents — White | residents_race_white | integer | no |  |  | patients | Sec I p.5 | |
| residents.dec31.by_race.black_african_american | Residents — Black/African American | residents_race_black_african_american | integer | no |  |  | patients | Sec I p.5 | |
| residents.dec31.by_race.asian | Residents — Asian | residents_race_asian | integer | no |  |  | patients | Sec I p.5 | |
| residents.dec31.by_race.american_indian_alaska_native | Residents — American Indian/Alaska Native | residents_race_american_indian | integer | no |  |  | patients | Sec I p.5 | |
| residents.dec31.by_race.native_hawaiian_pacific_islander | Residents — Native Hawaiian/Pacific Islander | residents_race_native_hawaiian_pacific_islander | integer | no |  |  | patients | Sec I p.5 | |
| residents.dec31.by_race.unknown | Residents — Unknown Race | residents_race_unknown | integer | no |  |  | patients | Sec I p.5 | |
| residents.dec31.by_race.total | Residents — Total by Race | residents_race_total | integer | auto |  |  | patients | Sec I p.5 | |
| residents.dec31.by_ethnicity.hispanic_latino | Residents — Hispanic/Latino | residents_eth_hispanic_latino | integer | no |  |  | patients | Sec I p.5 | |
| residents.dec31.by_ethnicity.not_hispanic | Residents — Not Hispanic/Latino | residents_eth_non_hispanic | integer | no |  |  | patients | Sec I p.5 | |
| residents.dec31.by_ethnicity.unknown | Residents — Ethnicity Unknown | residents_eth_unknown | integer | no |  |  | patients | Sec I p.5 | |
| residents.dec31.by_ethnicity.total | Residents — Total by Ethnicity | residents_eth_total | integer | auto |  |  | patients | Sec I p.5 | |
| residents.dec31.by_payment.medicare | Residents — Medicare | residents_pay_medicare | integer | no | ltc_payment |  | patients | Sec I p.5 | |
| residents.dec31.by_payment.medicaid | Residents — Medicaid | residents_pay_medicaid | integer | no | ltc_payment |  | patients | Sec I p.5 | |
| residents.dec31.by_payment.other_public | Residents — Other Public Program | residents_pay_other_public | integer | no | ltc_payment |  | patients | Sec I p.5 | |
| residents.dec31.by_payment.private_insurance | Residents — Private Insurance | residents_pay_private_insurance | integer | no | ltc_payment |  | patients | Sec I p.5 | |
| residents.dec31.by_payment.private_payment | Residents — Private Payment | residents_pay_private_payment | integer | no | ltc_payment |  | patients | Sec I p.5 | |
| residents.dec31.by_payment.charity_care | Residents — Charity Care | residents_pay_charity_care | integer | no | ltc_payment |  | patients | Sec I p.5 | |
| finance.* | Fiscal year, capex, revenues, charity cost | finance_* |  |  |  |  |  | Sec II p.7-8 | Same structure as LTC2 |
| immunization.* | Influenza/pneumonia policies and counts | immun_* |  |  |  |  |  | Sec III p.9 | Same as LTC2 |

## Enumerations

- Provide enumerations (e.g., ownership type, care categories) as discovered during mapping.
  - ltc_adm_restrictions: same as LTC2
  - ltc_payment: [Medicare, Medicaid, Other Public Program, Private Insurance, Private Payment, Charity Care]
  - finance_source: [Audited Financial Statements, Review Financial Statements, Compilation Financial Statements, Tax Return]

## Validation Rules

- Same as LTC3 tailored to Intermediate DD beds.

## Mapping Notes

- Use official section headings and page numbers from the questionnaire for traceability.
