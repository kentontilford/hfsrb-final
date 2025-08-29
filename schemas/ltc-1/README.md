# LTC1 — Hospitals with LTC Beds — Data Dictionary (Draft)

- Source: `ltc-1.pdf`
- Year: `2023`
- Facility Type: Hospitals with Long-Term Care Beds (LTC1)
- Status: Draft — to be populated from example PDF

## Overview

Data dictionary transcribed from the example `ltc-1.pdf`, structured for consistent use across applications.

## Conventions

- Types: `string`, `integer`, `number`, `boolean`, `date`, `enum`.
- Required: `yes`/`no`.
- Use `allowed_values` for enumerations and reference them in Enumerations.

## Fields

| field_id | field_label | field_name | type | required | allowed_values | format | unit | section/page | notes |
|---|---|---|---|---|---|---|---|---|---|
| report.year | Reporting Year | report_year | integer | yes |  |  | year | — | As defined in example schema |
| facility.license_number | Facility License Number | facility_license_number | string | yes |  |  |  | — | Hospital’s LTC unit license |
| facility.name | Facility Name | facility_name | string | yes |  |  |  | — |  |
| facility.address.line1 | Facility Address | facility_address | string | yes |  |  |  | — |  |
| facility.address.city | Facility City | facility_city | string | yes |  |  |  | — |  |
| facility.address.state | Facility State | facility_state | string | yes |  |  | ^[A-Z]{2}$ | — | Typically IL |
| facility.address.zip | Facility Zip Code | facility_zip | string | yes |  |  | ^\d{5}(-\d{4})?$ | — | 5-digit or ZIP+4 |
| facility.fein | Facility FEIN Number | facility_fein | string | yes |  |  | ^(\d{2}-?\d{7})$ | — |  |
| reg_agent.name | Registered Agent Name | registered_agent_name | string | conditional |  |  |  | — | Required if ownership requires RA |
| reg_agent.street | Registered Agent Street Address | registered_agent_street | string | conditional |  |  |  | — |  |
| reg_agent.city | Registered Agent City | registered_agent_city | string | conditional |  |  |  | — |  |
| reg_agent.state | Registered Agent State | registered_agent_state | string | conditional |  |  | ^[A-Z]{2}$ | — |  |
| reg_agent.zip | Registered Agent Zip | registered_agent_zip | string | conditional |  |  | ^\d{5}(-\d{4})?$ | — |  |
| reg_agent.phone | Registered Agent Phone | registered_agent_phone | string | conditional |  |  | ^(\d{3}-?\d{3}-?\d{4}|\(\d{3}\) ?\d{3}-?\d{4})$ | — |  |
| admissions.restrictions | Admission Restrictions | admission_restrictions | array | yes | ltc1_adm_restrictions |  |  | — | Multi-select; include “None Applicable” |
| admissions.other_restriction | Other Admission Restriction (describe) | other_admission_restriction_description | string | conditional |  |  |  | — | Required if “Any other …” selected |
| staffing.ftes.admin | Administrators (FTEs) | administrators_fte | number | yes |  |  | FTE | — |  |
| staffing.ftes.physicians | Physicians (FTEs) | physicians_fte | number | yes |  |  | FTE | — |  |
| staffing.ftes.don | Director of Nursing (FTEs) | director_of_nursing_fte | number | yes |  |  | FTE | — |  |
| staffing.ftes.rn | Registered Nurses (FTEs) | registered_nurses_fte | number | yes |  |  | FTE | — |  |
| staffing.ftes.lpn | LPNs (FTEs) | lpns_fte | number | yes |  |  | FTE | — |  |
| staffing.ftes.cert_aides | Certified Aides (FTEs) | certified_aides_fte | number | yes |  |  | FTE | — |  |
| staffing.ftes.other_health | Other Health Personnel (FTEs) | other_health_personnel_fte | number | yes |  |  | FTE | — |  |
| staffing.ftes.other_nonhealth | Other Non-Health Personnel (FTEs) | other_non_health_personnel_fte | number | yes |  |  | FTE | — |  |
| staffing.ftes.total | TOTAL Staff (FTEs) | total_staff_fte | number | auto |  |  | FTE | — | Auto-calculated |
| staffing.workweek_hours | Typical Work Week Hours (Full-time) | typical_work_week_hours | integer | yes |  |  | hours | — |  |
| census.jan1 | LTC Patients on Jan 1, 2023 | ltc_patients_jan1_2023 | integer | yes |  |  | patients | — |  |
| admissions.initial_2023 | LTC Admissions During 2023 | ltc_admissions_2023 | integer | yes |  |  | admissions | — |  |
| discharges.permanent_2023 | LTC Discharges During 2023 | ltc_discharges_2023 | integer | yes |  |  | discharges | — | Permanent discharges |
| census.dec31 | LTC Patients on Dec 31, 2023 | ltc_patients_dec31_2023 | integer | auto |  |  | patients | — | Calculated per instructions |
| beds.licensed | Licensed LTC Beds — 12/31/2023 | licensed_beds | integer | yes |  |  | beds | — |  |
| beds.highest_set_up | Highest One-Day Beds Set Up | highest_beds_set_up | integer | yes |  |  | beds | — |  |
| beds.highest_occupied | Highest One-Day Beds Occupied | highest_beds_occupied | integer | yes |  |  | beds | — |  |
| beds.set_up_dec31 | Beds Set Up — 12/31/2023 | beds_set_up_dec31_2023 | integer | yes |  |  | beds | — |  |
| beds.occupied_dec31 | Beds Occupied — 12/31/2023 | beds_occupied_dec31_2023 | integer | yes |  |  | beds | — | Should equal total_residents |
| patient_days.medicare | Patient Days — Medicare | patient_days_medicare | integer | yes |  |  | days | — | CY 2023 |
| patient_days.medicaid | Patient Days — Medicaid | patient_days_medicaid | integer | yes |  |  | days | — |  |
| patient_days.other_public | Patient Days — Other Public | patient_days_other_public | integer | yes |  |  | days | — | Excludes Medicare/Medicaid |
| patient_days.private_ins | Patient Days — Private Insurance | patient_days_private_insurance | integer | yes |  |  | days | — |  |
| patient_days.private_pay | Patient Days — Private Payment | patient_days_private_payment | integer | yes |  |  | days | — |  |
| patient_days.charity | Patient Days — Charity Care | patient_days_charity_care | integer | yes |  |  | days | — | No payment expected |
| patient_days.total | TOTAL Patient Days — 2023 | patient_days_total | integer | auto |  |  | days | — | Sum of categories |
| residents.male.under_18 | Males — Under 18 | male_under_18 | integer | yes |  |  | patients | — | As of 12/31/2023 |
| residents.male.18_44 | Males — 18-44 | male_18_44 | integer | yes |  |  | patients | — |  |
| residents.male.45_59 | Males — 45-59 | male_45_59 | integer | yes |  |  | patients | — |  |
| residents.male.60_64 | Males — 60-64 | male_60_64 | integer | yes |  |  | patients | — |  |
| residents.male.65_74 | Males — 65-74 | male_65_74 | integer | yes |  |  | patients | — |  |
| residents.male.75_84 | Males — 75-84 | male_75_84 | integer | yes |  |  | patients | — |  |
| residents.male.85_plus | Males — 85+ | male_85_plus | integer | yes |  |  | patients | — |  |
| residents.male.total | Males — TOTAL | male_total | integer | auto |  |  | patients | — | Sum of male age bands |
| residents.female.under_18 | Females — Under 18 | female_under_18 | integer | yes |  |  | patients | — |  |
| residents.female.18_44 | Females — 18-44 | female_18_44 | integer | yes |  |  | patients | — |  |
| residents.female.45_59 | Females — 45-59 | female_45_59 | integer | yes |  |  | patients | — |  |
| residents.female.60_64 | Females — 60-64 | female_60_64 | integer | yes |  |  | patients | — |  |
| residents.female.65_74 | Females — 65-74 | female_65_74 | integer | yes |  |  | patients | — |  |
| residents.female.75_84 | Females — 75-84 | female_75_84 | integer | yes |  |  | patients | — |  |
| residents.female.85_plus | Females — 85+ | female_85_plus | integer | yes |  |  | patients | — |  |
| residents.female.total | Females — TOTAL | female_total | integer | auto |  |  | patients | — | Sum of female age bands |
| residents.total | TOTAL Residents | total_residents | integer | auto |  |  | patients | — | male_total + female_total |
| residents.race.asian | Race — Asian | race_asian | integer | yes |  |  | patients | — | As of 12/31/2023 |
| residents.race.american_indian | Race — American Indian | race_american_indian | integer | yes |  |  | patients | — |  |
| residents.race.black | Race — Black/African-American | race_black_african_american | integer | yes |  |  | patients | — |  |
| residents.race.native_hawaiian_pacific | Race — Native Hawaiian/Pacific Islander | race_native_hawaiian_pacific_islander | integer | yes |  |  | patients | — |  |
| residents.race.white | Race — White | race_white | integer | yes |  |  | patients | — |  |
| residents.race.unknown | Race — Unknown | race_unknown | integer | yes |  |  | patients | — |  |
| residents.race.total | Race — TOTALS | race_total | integer | auto |  |  | patients | — | Equals total_residents |
| residents.ethnicity.hispanic | Ethnicity — Hispanic/Latino | ethnicity_hispanic_latino | integer | yes |  |  | patients | — |  |
| residents.ethnicity.not_hispanic | Ethnicity — Not Hispanic/Latino | ethnicity_non_hispanic | integer | yes |  |  | patients | — |  |
| residents.ethnicity.unknown | Ethnicity — Unknown | ethnicity_unknown | integer | yes |  |  | patients | — |  |
| residents.ethnicity.total | Ethnicity — TOTALS | ethnicity_total | integer | auto |  |  | patients | — | Equals total_residents |
| residents.payment.medicare | Residents by Primary Payment — Medicare | patient_count_medicare | integer | yes |  |  | patients | — | As of 12/31/2023 |
| residents.payment.medicaid | Residents by Primary Payment — Medicaid | patient_count_medicaid | integer | yes |  |  | patients | — |  |
| residents.payment.other_public | Residents by Primary Payment — Other Public | patient_count_other_public | integer | yes |  |  | patients | — |  |
| residents.payment.private_ins | Residents by Primary Payment — Private Insurance | patient_count_private_insurance | integer | yes |  |  | patients | — |  |
| residents.payment.private_pay | Residents by Primary Payment — Private Payment | patient_count_private_payment | integer | yes |  |  | patients | — |  |
| residents.payment.charity_care | Residents by Primary Payment — Charity Care | patient_count_charity_care | integer | yes |  |  | patients | — |  |
| residents.payment.total | Residents by Primary Payment — TOTALS | patient_count_total | integer | auto |  |  | patients | — | Equals total_residents |
| rates.private_room | Private Room Daily Rate (Private Pay) | private_room_rate | number | yes |  |  | USD/day | — | As of 12/31/2023 |
| rates.shared_room | Shared Room Daily Rate (Private Pay) | shared_room_rate | number | yes |  |  | USD/day | — | As of 12/31/2023 |
| diagnoses.neoplasms | Primary Diagnosis — Neoplasms (C00-D49) | diag_neoplasms | integer | yes |  |  | patients | — | As of 12/31/2023 |
| diagnoses.blood_disorders | Primary Diagnosis — Blood Disorders (D50-D89) | diag_blood_disorders | integer | yes |  |  | patients | — |  |
| diagnoses.endocrine_metabolic | Primary Diagnosis — Endocrine/Metabolic (E00-E89) | diag_endocrine_metabolic | integer | yes |  |  | patients | — |  |
| diagnoses.mental_illness_primary | Primary Diagnosis — Mental Illness (F01-F69) | diag_mental_illness | integer | yes |  |  | patients | — | Primary dx only |
| diagnoses.developmental_disabilities | Primary Diagnosis — Developmental Disabilities (F70-F99) | diag_developmental_disabilities | integer | yes |  |  | patients | — |  |
| diagnoses.alzheimers | Primary Diagnosis — Alzheimer’s (G30.0-G30.9) | diag_alzheimers | integer | yes |  |  | patients | — |  |
| diagnoses.nervous_system | Primary Diagnosis — Nervous System (G00-G99 excl. G30) | diag_nervous_system_disorders | integer | yes |  |  | patients | — |  |
| diagnoses.circulatory | Primary Diagnosis — Circulatory (I00-I99) | diag_circulatory | integer | yes |  |  | patients | — |  |
| diagnoses.respiratory | Primary Diagnosis — Respiratory (J00-J99) | diag_respiratory | integer | yes |  |  | patients | — |  |
| diagnoses.digestive | Primary Diagnosis — Digestive (K00-K95) | diag_digestive | integer | yes |  |  | patients | — |  |
| diagnoses.skin | Primary Diagnosis — Skin (L00-L99) | diag_skin | integer | yes |  |  | patients | — |  |
| diagnoses.musculoskeletal | Primary Diagnosis — Musculoskeletal (M00-M99) | diag_musculoskeletal | integer | yes |  |  | patients | — |  |
| diagnoses.genitourinary | Primary Diagnosis — Genitourinary (N00-N99) | diag_genitourinary | integer | yes |  |  | patients | — |  |
| diagnoses.injury_poisoning | Primary Diagnosis — Injury/Poisoning (S00-T88) | diag_injury_poisoning | integer | yes |  |  | patients | — |  |
| diagnoses.other_medical | Primary Diagnosis — Other Medical | diag_other_medical | integer | yes |  |  | patients | — | Not in other groups |
| diagnoses.non_medical | Primary Diagnosis — Non-Medical | diag_non_medical | integer | yes |  |  | patients | — |  |
| diagnoses.total | Primary Diagnosis — TOTAL Residents | diag_total_residents | integer | auto |  |  | patients | — | Equals total_residents |
| residents.any_mental_illness | Residents with any Mental Illness Dx (F01-F69) | patients_with_mental_illness | integer | yes |  |  | patients | — | Primary or secondary dx |
| residents.identified_offenders | Identified Offenders | identified_offenders_count | integer | yes |  |  | patients | — | Per criminal background check |
| finance.fy_start | Fiscal Year Starting Date | fiscal_year_start | date | yes |  | MM/DD/YYYY |  | — | Most recent FY |
| finance.fy_end | Fiscal Year Ending Date | fiscal_year_end | date | yes |  | MM/DD/YYYY |  | — |  |
| finance.source | Financial Data Source | financial_data_source | enum | yes | finance_source_ltc1 |  |  | — |  |
| finance.capex.total | Total Capital Expenditures | total_capital_expenditures | number | yes |  |  | USD | — |  |
| finance.capex.projects[].description | Project/Expenditure Description (> $350k) | capital_projects[].description | string | no |  |  |  | — |  |
| finance.capex.projects[].amount | Amount Obligated | capital_projects[].amount_obligated | number | no |  |  | USD | — |  |
| finance.capex.projects[].financing_method | Method of Financing | capital_projects[].method_of_financing | string | no |  |  |  | — |  |
| finance.capex.projects[].con_number | CON Project Number | capital_projects[].con_project_number | string | no |  |  |  | — | If applicable |
| finance.net_revenue.medicare | Net Revenue — Medicare | net_revenue_medicare | number | no |  |  | USD | — | If present in example |
| finance.net_revenue.medicaid | Net Revenue — Medicaid | net_revenue_medicaid | number | no |  |  | USD | — |  |
| finance.net_revenue.other_public | Net Revenue — Other Public | net_revenue_other_public | number | no |  |  | USD | — |  |
| finance.net_revenue.private_ins | Net Revenue — Private Insurance | net_revenue_private_insurance | number | no |  |  | USD | — |  |
| finance.net_revenue.private_pay | Net Revenue — Private Payment | net_revenue_private_payment | number | no |  |  | USD | — |  |
| finance.net_revenue.total | Net Revenue — TOTALS | net_revenue_total | number | auto |  |  | USD | — | Sum of categories |
| finance.charity.actual_cost | Actual Cost of Charity Care Services | charity_care_actual_cost | number | no |  |  | USD | — | If present in example |

## Enumerations

- From example schema and survey conventions:
  - ltc1_adm_restrictions: [Aggressive/Anti-Social Behavior, Chronic Alcoholism, Developmental Disability, Drug Addiction, Medicaid Recipient, Medicare Recipient, Mental Illness, Patient Non-Ambulatory, Patient Non-Mobile, Government Payment Recipient, Under 65 Years of Age, Patient Unable to Self-Medicate, Patient Ventilator Dependent, Infectious Disease Requiring Isolation, Any other Admission Restriction, None Applicable]
  - finance_source_ltc1: [Audited Financial Statements, Review/Compilation Financial Statements, Tax Return Documents]

## Validation Rules

- Staffing: `total_staff_fte = sum(all staffing categories)`
- Census/flow: `ltc_patients_dec31_2023 = ltc_patients_jan1_2023 + ltc_admissions_2023 - ltc_discharges_2023`
- Beds: `beds_occupied_dec31_2023 == total_residents` and `beds_occupied_dec31_2023 <= beds_set_up_dec31_2023 <= licensed_beds`
- Patient days: `patient_days_total = sum(patient_days_* categories)`
- Demographics totals: `male_total = sum(male age bands)`; `female_total = sum(female age bands)`; `total_residents = male_total + female_total = race_total = ethnicity_total = patient_count_total`
- Diagnoses: `diag_total_residents = sum(all diagnosis categories) = total_residents`
- Finance totals: `net_revenue_total = sum(net_revenue_* categories)` (if net revenue collected)
- Conditional description required when “Any other Admission Restriction” is selected

## Mapping Notes

- Source includes a JSON Schema for LTC1; field names above mirror the example properties for consistency across apps.
- Some financial items (net revenue, charity cost) may or may not be present in the LTC1 example; included here for alignment with LTC LTC2–LTC5. Remove if not applicable.
