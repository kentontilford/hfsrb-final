# LTC2 — Nursing Care and Sheltered Care — Data Dictionary (Draft)

- Source: `2023LTC2 -NURSING CARE AND SHELTERED CARE.pdf`
- Year: `2023`
- Facility Type: Long-Term Care — Nursing Care and Sheltered Care
- Status: Draft — pending field mapping from source PDF

## Overview

Annual survey for LTC facilities providing nursing and sheltered care. Capture facility identifiers, ownership, bed counts, resident days, services, and staffing.

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
| facility.designation.life_care | Life Care Facility | is_life_care | boolean | no |  |  |  | Sec I p.2 |  |
| facility.designation.ccrc | Continuing Care Retirement Community | is_ccrc | boolean | no |  |  |  | Sec I p.2 |  |
| admissions.restrictions | Admission Restrictions | admission_restrictions | array | yes | ltc2_adm_restrictions |  |  | Sec I p.2 | Multi-select; include None Applicable |
| reg_agent.name | Registered Agent Name | reg_agent_name | string | conditional |  |  |  | Sec I p.2 | Required if ownership requires RA |
| reg_agent.address | Registered Agent Street Address | reg_agent_address | string | conditional |  |  |  | Sec I p.2 |  |
| reg_agent.city_state_zip | Registered Agent City, State, Zip | reg_agent_city_state_zip | string | conditional |  |  |  | Sec I p.2 |  |
| reg_agent.phone | Registered Agent Telephone Number | reg_agent_phone | string | conditional |  | ^\(\d{3}\) \d{3}-\d{4}(\.\d+)?$ |  | Sec I p.2 |  |
| staffing.ftes.administrators | Administrators (FTEs) | fte_admin | number | yes |  |  | FTE | Sec I p.3 |  |
| staffing.ftes.physicians | Physicians (FTEs) | fte_physicians | number | yes |  |  | FTE | Sec I p.3 |  |
| staffing.ftes.don | Director of Nursing (FTEs) | fte_don | number | yes |  |  | FTE | Sec I p.3 |  |
| staffing.ftes.rn | Registered Nurses (FTEs) | fte_rn | number | yes |  |  | FTE | Sec I p.3 |  |
| staffing.ftes.lpn | LPNs (FTEs) | fte_lpn | number | yes |  |  | FTE | Sec I p.3 |  |
| staffing.ftes.cert_aides | Certified Aides (FTEs) | fte_cert_aides | number | yes |  |  | FTE | Sec I p.3 |  |
| staffing.ftes.other_health | Other Healthcare Personnel (FTEs) | fte_other_health | number | yes |  |  | FTE | Sec I p.3 |  |
| staffing.ftes.other_nonhealth | Other Non-Health Personnel (FTEs) | fte_other_nonhealth | number | yes |  |  | FTE | Sec I p.3 |  |
| staffing.ftes.total | TOTALS (FTEs) | fte_total | number | auto |  |  | FTE | Sec I p.3 | Auto-calculated |
| staffing.workweek_hours | Typical work week hours (full-time) | workweek_hours | integer | yes |  |  | hours | Sec I p.3 |  |
| census.jan1 | Patients in facility on Jan 1, 2023 | census_jan1 | integer | yes |  |  | patients | Sec I p.3 |  |
| admissions.initial_2023 | Initial admissions during 2023 | admissions_initial | integer | yes |  |  | admissions | Sec I p.3 |  |
| discharges.permanent_2023 | Permanent discharges during 2023 | discharges_permanent | integer | yes |  |  | discharges | Sec I p.3 |  |
| census.dec31 | Patients in facility on Dec 31, 2023 | census_dec31 | integer | auto |  |  | patients | Sec I p.3 | Calculated per instructions |
| beds.licensed_dec31.nursing | Licensed Beds — Nursing (12/31/2023) | beds_licensed_nursing | integer | yes |  |  | beds | Sec I p.4 |  |
| beds.licensed_dec31.sheltered | Licensed Beds — Sheltered (12/31/2023) | beds_licensed_sheltered | integer | yes |  |  | beds | Sec I p.4 |  |
| beds.set_up_dec31.nursing | Beds Set Up — Nursing (12/31/2023) | beds_setup_nursing | integer | yes |  |  | beds | Sec I p.4 |  |
| beds.set_up_dec31.sheltered | Beds Set Up — Sheltered (12/31/2023) | beds_setup_sheltered | integer | yes |  |  | beds | Sec I p.4 |  |
| beds.highest_one_day_set_up.nursing | Highest One-Day Beds Set Up — Nursing | beds_peak_setup_nursing | integer | yes |  |  | beds | Sec I p.4 |  |
| beds.highest_one_day_set_up.sheltered | Highest One-Day Beds Set Up — Sheltered | beds_peak_setup_sheltered | integer | yes |  |  | beds | Sec I p.4 |  |
| beds.highest_one_day_occupied.nursing | Highest One-Day Beds Occupied — Nursing | beds_peak_occupied_nursing | integer | yes |  |  | beds | Sec I p.4 |  |
| beds.highest_one_day_occupied.sheltered | Highest One-Day Beds Occupied — Sheltered | beds_peak_occupied_sheltered | integer | yes |  |  | beds | Sec I p.4 |  |
| beds.occupied_dec31.nursing | Beds Occupied — Nursing (12/31/2023) | beds_occupied_nursing | integer | yes |  |  | beds | Sec I p.4 |  |
| beds.occupied_dec31.sheltered | Beds Occupied — Sheltered (12/31/2023) | beds_occupied_sheltered | integer | yes |  |  | beds | Sec I p.4 |  |
| patient_days.total_2023.nursing | TOTAL PATIENT DAYS OF CARE 2023 — Nursing | days_total_nursing | integer | yes |  |  | days | Sec I p.4 |  |
| patient_days.total_2023.sheltered | TOTAL PATIENT DAYS OF CARE 2023 — Sheltered | days_total_sheltered | integer | yes |  |  | days | Sec I p.4 |  |
| residents.dec31.by_age_sex.* | Residents by Age/Sex — as of Dec 31 | residents_age_sex_* | integer | yes |  |  | patients | Sec I p.4 | Male/Female by listed age bands |
| residents.dec31.by_race.* | Residents by Racial Group — as of Dec 31 | residents_race_* | integer | yes |  |  | patients | Sec I p.5 | Categories per form |
| residents.dec31.by_ethnicity.* | Residents by Ethnicity — as of Dec 31 | residents_eth_* | integer | yes |  |  | patients | Sec I p.5 |  |
| residents.dec31.by_payment.* | Residents by Primary Payment — as of Dec 31 | residents_pay_* | integer | yes | ltc_payment |  | patients | Sec I p.5 | Includes Charity Care |
| rates.private_room | Private Payment Daily Room Rate — Private Room | rate_private_room | number | yes |  |  | USD/day | Sec I p.5 |  |
| rates.shared_room | Private Payment Daily Room Rate — Shared Room | rate_shared_room | number | yes |  |  | USD/day | Sec I p.5 |  |
| residents.dec31.icd10_groups[*] | Residents by Primary Diagnosis (ICD-10 CM group) | residents_icd10_group_* | integer | yes |  |  | patients | Sec I p.6 | One field per code group listed |
| residents.dec31.mentally_ill | Residents diagnosed as Mentally Ill (F01-F69) | residents_mentally_ill | integer | yes |  |  | patients | Sec I p.6 |  |
| residents.dec31.identified_offenders | Residents categorized as Identified Offenders | residents_identified_offenders | integer | yes |  |  | patients | Sec I p.6 | per 210 ILCS 45/2-201.5 |
| finance.fy_start | Fiscal Year Starting Date | fy_start | date | yes |  | mm/dd/yyyy |  | Sec II p.7 |  |
| finance.fy_end | Fiscal Year Ending Date | fy_end | date | yes |  | mm/dd/yyyy |  | Sec II p.7 |  |
| finance.source | Financial Data Source | finance_source | enum | yes | finance_source |  |  | Sec II p.7 |  |
| finance.capex.total | Total Capital Expenditures | capex_total | number | yes |  |  | USD | Sec II p.7 |  |
| finance.capex.projects[].description | Project/Expenditure Description (> $350k) | project_desc | string | no |  |  |  | Sec II p.7 |  |
| finance.capex.projects[].amount | Amount Obligated | project_amount | number | no |  |  | USD | Sec II p.7 |  |
| finance.capex.projects[].financing_method | Method of Financing | project_financing | string | no |  |  |  | Sec II p.7 |  |
| finance.capex.projects[].con_number | CON Project Number | project_con | string | no |  |  |  | Sec II p.7 | If applicable |
| finance.net_revenue.medicare | Net Revenue — Medicare | rev_medicare | number | yes |  |  | USD | Sec II p.8 | Include MMAI in Medicare |
| finance.net_revenue.medicaid | Net Revenue — Medicaid | rev_medicaid | number | yes |  |  | USD | Sec II p.8 | Include Medicaid Managed Care |
| finance.net_revenue.other_public | Net Revenue — Other Public Payment | rev_other_public | number | yes |  |  | USD | Sec II p.8 | Per definition on form |
| finance.net_revenue.private_ins | Net Revenue — Private Insurance | rev_private_ins | number | yes |  |  | USD | Sec II p.8 |  |
| finance.net_revenue.private_pay | Net Revenue — Private Payment | rev_private_pay | number | yes |  |  | USD | Sec II p.8 |  |
| finance.net_revenue.total | TOTALS | rev_total | number | auto |  |  | USD | Sec II p.8 | Auto-calculated |
| finance.charity.actual_cost | Actual Cost of Charity Care Services | charity_actual_cost | number | yes |  |  | USD | Sec II p.8 | Report cost, not charges |
| immunization.policy.patient_influenza | Written policy — patient influenza vaccine | pol_pat_influenza | boolean | yes |  |  |  | Sec III p.9 |  |
| immunization.policy.patient_pneumo | Written policy — patient pneumococcal vaccine | pol_pat_pneumo | boolean | yes |  |  |  | Sec III p.9 |  |
| immunization.policy.staff_influenza | Written policy — staff influenza vaccine | pol_staff_influenza | boolean | yes |  |  |  | Sec III p.9 |  |
| immunization.policy.staff_pneumo | Written policy — staff pneumococcal vaccine | pol_staff_pneumo | boolean | yes |  |  |  | Sec III p.9 |  |
| immunization.policy.amantadine_rimantadine | Policy — use of amantadine/rimantadine in outbreak | pol_antivirals | boolean | yes |  |  |  | Sec III p.9 |  |
| immunization.patients.influenza_oct_to_jan | Patients receiving influenza vaccine (Oct 2023–Jan 2024) | vac_pat_influenza | integer | yes |  |  | patients | Sec III p.9 |  |
| immunization.patients.pneumo_2017_2023 | Patients with pneumococcal vaccine (2017–2023) | vac_pat_pneumo | integer | yes |  |  | patients | Sec III p.9 |  |
| electronic_monitoring.requests | Electronic Monitoring requests (2023) | em_requests | integer | yes |  |  | requests | Sec III p.10 |  |
| electronic_monitoring.approved | Electronic Monitoring requests approved | em_approved | integer | yes |  |  | requests | Sec III p.10 |  |
| electronic_monitoring.denied | Electronic Monitoring requests denied | em_denied | integer | yes |  |  | requests | Sec III p.10 |  |
| older_adult_services.* | Outpatient/Community-Based Services — avg daily clients | oas_* | integer | no |  |  | clients/day | Sec III p.11 | One field per service line listed |

## Enumerations

- Provide enumerations (e.g., ownership type, care categories) as discovered during mapping.
  - ltc2_adm_restrictions: [Aggressive/Anti-Social Behavior, Chronic Alcoholism, Developmental Disability, Drug Addiction, Infectious Disease Requiring Isolation, Mental Illness, Patient Non-Ambulatory, Patient Non-Mobile, Patient Unable to Self-Medicate, Patient Ventilator Dependent, Government Payment Recipient, Medicaid Recipient, Medicare Recipient, Under 65 Years of Age, Any other Admission Restriction, None Applicable]
  - finance_source: [Audited Financial Statements, Review Financial Statements, Compilation Financial Statements, Tax Return]
  - ltc_payment: [Medicare, Medicaid, Other Public Program, Private Insurance, Private Payment, Charity Care]

## Validation Rules

- Staffing: `fte_total = sum(all categories)`.
- Census/flow: `census_dec31 = census_jan1 + admissions_initial - discharges_permanent` (subject to facility adjustments; verify during entry).
- Bed occupancy on Dec 31 must be ≤ Beds Set Up on Dec 31 for each category.
- Patient days totals should be consistent with bed capacity and census; flag extreme outliers.
- Revenues: `rev_total = sum(rev_medicare, rev_medicaid, rev_other_public, rev_private_ins, rev_private_pay)`.

## Mapping Notes

- Use official section headings and page numbers from the questionnaire for traceability.
