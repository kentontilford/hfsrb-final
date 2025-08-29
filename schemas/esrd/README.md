# ESRD — Data Dictionary (Draft)

- Source: `2023 ESRD Questionnaire.pdf`
- Year: `2023`
- Facility Type: End-Stage Renal Disease (Dialysis)
- Status: Draft — pending field mapping from source PDF

## Overview

Annual survey for ESRD facilities. Capture identifiers, ownership, services, staffing, treatment modalities, volumes, and outcomes as reported for the year.

## Conventions

- Types: `string`, `integer`, `number`, `boolean`, `date`, `enum`.
- Required: `yes`/`no`.
- Use `allowed_values` for enumerations and reference them in Enumerations.

## Fields

| field_id | field_label | field_name | type | required | allowed_values | format | unit | section/page | notes |
|---|---|---|---|---|---|---|---|---|---|
| facility.medicare_ccn | Facility Medicare Certification Number | medicare_ccn | string | yes |  | ^\d{6}$ |  | p.2 | CMS Certification Number (CCN) |
| facility.name | Facility Name | facility_name | string | yes |  |  |  | p.2 |  |
| facility.address.line1 | Facility Address | address_line1 | string | yes |  |  |  | p.2 |  |
| facility.address.city | Facility City | address_city | string | yes |  |  |  | p.2 |  |
| facility.address.zip | Facility Zip Code | address_zip | string | yes |  | ^\d{5}(-\d{4})?$ |  | p.2 |  |
| facility.fein | Facility FEIN | fein | string | yes |  | ^\d{2}-\d{7}$ |  | p.2 |  |
| ownership.legal_entity | Legal Entity (Owner/Operator) | legal_entity_name | string | yes |  |  |  | p.2 | Name of owning/operating entity |
| ownership.category | Ownership Category | ownership_category | enum | yes | esrd_ownership |  |  | p.2 | Choose one |
| admin.name | Administrator Name | admin_name | string | yes |  |  |  | p.2 |  |
| medical_director.name | Medical Director Name | medical_director_name | string | yes |  |  |  | p.2 |  |
| building_owners | Building Owner(s) | building_owners | array | yes |  |  |  | p.2 | List owner entities |
| building_owners[].name | Building Owner | building_owners[].name | string |  |  |  |  | p.2 |  |
| building_owners[].address | Street Address | building_owners[].address | string |  |  |  |  | p.2 |  |
| building_owners[].city_state_zip | City, State and Zip Code | building_owners[].city_state_zip | string |  |  |  |  | p.2 |  |
| related_entities | Related Entities | related_entities | array | no |  |  |  | p.2 | Legally/financially related entities |
| related_entities[].name | Related Entity | related_entities[].name | string |  |  |  |  | p.2 |  |
| related_entities[].relationship | Relationship | related_entities[].relationship | string |  |  |  |  | p.2 |  |
| related_entities[].interest | Type of Interest | related_entities[].interest | string |  |  |  |  | p.2 |  |
| staffing.workweek_hours | Full-time work week hours | staffing_workweek_hours | integer | yes |  |  | hours | p.3 |  |
| staffing.ftes.rn | Registered Nurses (FTEs) | fte_rn | number | yes |  |  | FTE | p.3 |  |
| staffing.ftes.techs | Dialysis Technicians (FTEs) | fte_techs | number | yes |  |  | FTE | p.3 |  |
| staffing.ftes.dieticians | Dieticians (FTEs) | fte_dieticians | number | yes |  |  | FTE | p.3 |  |
| staffing.ftes.social_workers | Social Workers (FTEs) | fte_social_workers | number | yes |  |  | FTE | p.3 |  |
| staffing.ftes.lpns | LPNs (FTEs) | fte_lpns | number | yes |  |  | FTE | p.3 |  |
| staffing.ftes.other_health | Other Health-related Professionals (FTEs) | fte_other_health | number | yes |  |  | FTE | p.3 |  |
| staffing.ftes.other_nonhealth | Other Non Health-related Professionals (FTEs) | fte_other_nonhealth | number | yes |  |  | FTE | p.3 |  |
| staffing.ftes.total | Total FTEs Employed | fte_total | number | auto |  |  | FTE | p.3 | Auto-calculated on form |
| staffing.other_prof_desc | Other Professions Explanation | staffing_other_prof_desc | string | conditional |  |  |  | p.3 | Required if other_* FTEs reported |
| stations.jan1.authorized | Authorized ESRD Stations on Jan 1, 2023 | stations_jan1_auth | integer | yes |  |  | stations | p.4 |  |
| stations.jan1.cms_certified | CMS-certified Stations on Jan 1, 2023 | stations_jan1_cert | integer | yes |  |  | stations | p.4 |  |
| stations.dec31.authorized | Authorized ESRD Stations on Dec 31, 2023 | stations_dec31_auth | integer | yes |  |  | stations | p.4 |  |
| stations.dec31.cms_certified | CMS-certified Stations on Dec 31, 2023 | stations_dec31_cert | integer | yes |  |  | stations | p.4 |  |
| stations.highest_operational | Highest Authorized Stations in Operation (any time in 2023) | stations_highest_operational | integer | yes |  |  | stations | p.4 |  |
| stations.oct_week.setup_staffed | Authorized Stations Set Up and Staffed (Oct 1-7, 2023) | stations_oct_setup_staffed | integer | yes |  |  | stations | p.4 |  |
| stations.oct_week.isolation_setup | Authorized Isolation Stations Set Up and Staffed (Oct 1-7, 2023) | stations_oct_isolation | integer | yes |  |  | stations | p.4 |  |
| treatments.incenter_annual | In-center Hemodialysis Treatments Performed (2023) | treatments_incenter_2023 | integer | yes |  |  | treatments | p.4 |  |
| treatments.avg_minutes | Average Time per Treatment (minutes) | treatment_avg_minutes | integer | yes |  |  | minutes | p.4 |  |
| treatments.missed | Missed Treatments (No-shows) in 2023 | treatments_missed | integer | yes |  |  | treatments | p.4 |  |
| shifts.per_day.monday | Shifts per day — Monday | shifts_mon | integer | yes |  |  | shifts | p.4 |  |
| shifts.per_day.tuesday | Shifts per day — Tuesday | shifts_tue | integer | yes |  |  | shifts | p.4 |  |
| shifts.per_day.wednesday | Shifts per day — Wednesday | shifts_wed | integer | yes |  |  | shifts | p.4 |  |
| shifts.per_day.thursday | Shifts per day — Thursday | shifts_thu | integer | yes |  |  | shifts | p.4 |  |
| shifts.per_day.friday | Shifts per day — Friday | shifts_fri | integer | yes |  |  | shifts | p.4 |  |
| shifts.per_day.saturday | Shifts per day — Saturday | shifts_sat | integer | yes |  |  | shifts | p.4 |  |
| shifts.per_day.sunday | Shifts per day — Sunday | shifts_sun | integer | yes |  |  | shifts | p.4 |  |
| ops.nocturnal_incenter | Operated In-Center Nocturnal Dialysis (2023) | nocturnal_incenter | boolean | yes |  |  |  | p.4 | Yes/No |
| ops.hours.oct1 | Hours of operation — Oct 1, 2023 | hours_oct1 | number | yes |  |  | hours | p.4 |  |
| ops.hours.oct2 | Hours of operation — Oct 2, 2023 | hours_oct2 | number | yes |  |  | hours | p.4 |  |
| ops.hours.oct3 | Hours of operation — Oct 3, 2023 | hours_oct3 | number | yes |  |  | hours | p.4 |  |
| ops.hours.oct4 | Hours of operation — Oct 4, 2023 | hours_oct4 | number | yes |  |  | hours | p.4 |  |
| ops.hours.oct5 | Hours of operation — Oct 5, 2023 | hours_oct5 | number | yes |  |  | hours | p.4 |  |
| ops.hours.oct6 | Hours of operation — Oct 6, 2023 | hours_oct6 | number | yes |  |  | hours | p.4 |  |
| ops.hours.oct7 | Hours of operation — Oct 7, 2023 | hours_oct7 | number | yes |  |  | hours | p.4 |  |
| ops.patients.oct1 | Patients treated — Oct 1, 2023 | patients_oct1 | integer | yes |  |  | patients | p.4 |  |
| ops.patients.oct2 | Patients treated — Oct 2, 2023 | patients_oct2 | integer | yes |  |  | patients | p.4 |  |
| ops.patients.oct3 | Patients treated — Oct 3, 2023 | patients_oct3 | integer | yes |  |  | patients | p.4 |  |
| ops.patients.oct4 | Patients treated — Oct 4, 2023 | patients_oct4 | integer | yes |  |  | patients | p.4 |  |
| ops.patients.oct5 | Patients treated — Oct 5, 2023 | patients_oct5 | integer | yes |  |  | patients | p.4 |  |
| ops.patients.oct6 | Patients treated — Oct 6, 2023 | patients_oct6 | integer | yes |  |  | patients | p.4 |  |
| ops.patients.oct7 | Patients treated — Oct 7, 2023 | patients_oct7 | integer | yes |  |  | patients | p.4 |  |
| patients.counts.jan1 | Patients receiving chronic in-center dialysis — Jan 1, 2023 | patients_jan1 | integer | yes |  |  | patients | p.5 |  |
| patients.counts.dec31 | Patients receiving chronic in-center dialysis — Dec 31, 2023 | patients_dec31 | integer | yes |  |  | patients | p.5 |  |
| patients.counts.unduplicated | Unduplicated chronic in-center patients during 2023 | patients_unduplicated | integer | yes |  |  | patients | p.5 |  |
| patients.added.new | New patients to facility (incl. transfers in) | added_new | integer | yes |  |  | patients | p.5 |  |
| patients.added.transient | Transient patients | added_transient | integer | yes |  |  | patients | p.5 |  |
| patients.added.restarted | Patients who re-started in-center hemodialysis | added_restarted | integer | yes |  |  | patients | p.5 |  |
| patients.added.post_transplant_resume | Patients who resumed after transplant | added_post_tx_resume | integer | yes |  |  | patients | p.5 |  |
| patients.lost.recovered_function | Patients who recovered kidney function | lost_recovered | integer | yes |  |  | patients | p.5 |  |
| patients.lost.transplant_end | Kidney transplant recipients who ended treatment | lost_transplant_end | integer | yes |  |  | patients | p.5 |  |
| patients.lost.transferred_out | Patients transferred out (incl. transients) | lost_transferred | integer | yes |  |  | patients | p.5 |  |
| patients.lost.voluntary_stop | Patients who voluntarily discontinued treatment | lost_voluntary_stop | integer | yes |  |  | patients | p.5 |  |
| patients.lost.lost_to_followup | Patients lost to follow-up | lost_followup | integer | yes |  |  | patients | p.5 |  |
| patients.lost.deceased | Patients who ceased dialysis due to death | lost_deceased | integer | yes |  |  | patients | p.5 |  |
| patients.primary_payment | Patients by Primary Source of Payment | patients_payment | object | yes |  |  |  | p.5 | Unduplicated patients |
| patients.primary_payment.medicare | Medicare | pat_medicare | integer |  |  |  | patients | p.5 |  |
| patients.primary_payment.medicaid | Medicaid | pat_medicaid | integer |  |  |  | patients | p.5 |  |
| patients.primary_payment.other_public | Other Public | pat_other_public | integer |  |  |  | patients | p.5 |  |
| patients.primary_payment.private_insurance | Private Insurance | pat_private_insurance | integer |  |  |  | patients | p.5 |  |
| patients.primary_payment.private_payment | Private Payment | pat_private_payment | integer |  |  |  | patients | p.5 |  |
| patients.primary_payment.charity_care | Charity Care | pat_charity | integer |  |  |  | patients | p.5 |  |
| patients.primary_payment.total | TOTAL | pat_payment_total | integer | auto |  |  | patients | p.5 | Auto-calculated |
| patients.age_groups | Patients by Age Group | patients_age | object | yes |  |  |  | p.6 | Unduplicated patients |
| patients.age_groups.00_04 | 0-4 years | age_00_04 | integer |  |  |  | patients | p.6 |  |
| patients.age_groups.05_14 | 5-14 years | age_05_14 | integer |  |  |  | patients | p.6 |  |
| patients.age_groups.15_24 | 15-24 years | age_15_24 | integer |  |  |  | patients | p.6 |  |
| patients.age_groups.25_34 | 25-34 years | age_25_34 | integer |  |  |  | patients | p.6 |  |
| patients.age_groups.35_44 | 35-44 years | age_35_44 | integer |  |  |  | patients | p.6 |  |
| patients.age_groups.45_54 | 45-54 years | age_45_54 | integer |  |  |  | patients | p.6 |  |
| patients.age_groups.55_64 | 55-64 years | age_55_64 | integer |  |  |  | patients | p.6 |  |
| patients.age_groups.65_74 | 65-74 years | age_65_74 | integer |  |  |  | patients | p.6 |  |
| patients.age_groups.75_plus | 75 years and over | age_75_plus | integer |  |  |  | patients | p.6 |  |
| patients.age_groups.total | TOTALS | age_total | integer | auto |  |  | patients | p.6 | Auto-calculated |
| patients.race | Patients by Racial Group | patients_race | object | yes |  | race_enum |  | p.6 | Unduplicated patients |
| patients.race.asian | Asian | race_asian | integer |  |  |  | patients | p.6 |  |
| patients.race.american_indian_alaskan | American Indian/Native Alaskan | race_ai_an | integer |  |  |  | patients | p.6 |  |
| patients.race.black | Black/African-American | race_black | integer |  |  |  | patients | p.6 |  |
| patients.race.native_hawaiian_pacific | Native Hawaiian/Pacific Islander | race_nh_pi | integer |  |  |  | patients | p.6 |  |
| patients.race.white | White | race_white | integer |  |  |  | patients | p.6 |  |
| patients.race.unknown | Unknown Race | race_unknown | integer |  |  |  | patients | p.6 |  |
| patients.race.total | TOTALS | race_total | integer | auto |  |  |  | p.6 | Auto-calculated |
| patients.ethnicity | Patients by Ethnicity | patients_ethnicity | object | yes |  | ethnicity_enum |  | p.6 | Unduplicated patients |
| patients.ethnicity.hispanic | Hispanic/Latino | eth_hispanic | integer |  |  |  | patients | p.6 |  |
| patients.ethnicity.not_hispanic | Not Hispanic/Latino | eth_not_hispanic | integer |  |  |  | patients | p.6 |  |
| patients.ethnicity.unknown | Ethnicity Unknown | eth_unknown | integer |  |  |  | patients | p.6 |  |
| patients.ethnicity.total | TOTALS | eth_total | integer | auto |  |  |  | p.6 | Auto-calculated |
| finance.fy_start | Fiscal Year Starting Date | fy_start | date | yes |  | mm/dd/yyyy |  | p.7 |  |
| finance.fy_end | Fiscal Year Ending Date | fy_end | date | yes |  | mm/dd/yyyy |  | p.7 |  |
| finance.source | Financial Info Source | finance_source | enum | yes | finance_source |  |  | p.7 |  |
| finance.capex.total | Total Capital Expenditures | capex_total | number | yes |  |  | USD | p.7 |  |
| finance.capex.projects | Capital Projects > $350,000 | capex_projects | array | no |  |  |  | p.7 | Obligated during FY |
| finance.capex.projects[].description | Project/Expenditure Description | project_desc | string |  |  |  |  | p.7 |  |
| finance.capex.projects[].amount | Amount Obligated | project_amount | number |  |  |  | USD | p.7 |  |
| finance.capex.projects[].financing_method | Method of Financing | project_financing | string |  |  |  |  | p.7 |  |
| finance.capex.projects[].con_project | CON Project Number | project_con | string |  |  |  |  | p.7 | If applicable |
| finance.long_term_debt | Long-Term Debt Reported | long_term_debt | number | yes |  |  | USD | p.8 | From audited FS or allocated |
| finance.net_revenues | Net Revenues by Source | net_revenues | object | yes |  | payment_source_esrd | USD | p.8 | Should relate to patients by payment |
| finance.net_revenues.medicare | Medicare | rev_medicare | number |  |  |  | USD | p.8 |  |
| finance.net_revenues.medicaid | Medicaid | rev_medicaid | number |  |  |  | USD | p.8 |  |
| finance.net_revenues.other_public | Other Public Payment | rev_other_public | number |  |  |  | USD | p.8 |  |
| finance.net_revenues.private_insurance | Private Insurance | rev_private_ins | number |  |  |  | USD | p.8 |  |
| finance.net_revenues.private_payment | Private Payment | rev_private_pay | number |  |  |  | USD | p.8 |  |
| finance.net_revenues.total | TOTALS | rev_total | number | auto |  |  | USD | p.8 | Auto-calculated |
| finance.charity.actual_cost | Actual Cost of Charity Care Services Provided | charity_actual_cost | number | yes |  |  | USD | p.8 | Report cost, not charges |

## Enumerations

- Provide enumerations (e.g., ownership type, modality types) as discovered during mapping.
  - esrd_ownership: see below
  - finance_source: [Audited Financial Statements, Review Financial Statements, Compilation Financial Statements, Tax Return]
  - race_enum: as fields listed
  - ethnicity_enum: [Hispanic/Latino, Not Hispanic/Latino, Ethnicity Unknown]
  - payment_source_esrd: [Medicare, Medicaid, Other Public Payment, Private Insurance, Private Payment]

### esrd_ownership
- for_profit:corporation — Corporation
- for_profit:limited_partnership — Limited Partnership
- for_profit:llp — Limited Liability Partnership
- for_profit:llc — Limited Liability Company
- for_profit:other — Other For Profit
- nonprofit:church_related — Church-Related
- nonprofit:other_corporation — Other Corporation (not Church-related)
- nonprofit:other_nonprofit — Other Not for Profit
- governmental:county — County
- governmental:city — City
- governmental:township — Township
- governmental:hospital_district — Hospital District
- governmental:other — Other Governmental

## Validation Rules

- Staffing: `fte_total = sum(fte_rn, fte_techs, fte_dieticians, fte_social_workers, fte_lpns, fte_other_health, fte_other_nonhealth)`
- Patient counts: `patients_unduplicated = patients_jan1 + added_new + added_transient + added_restarted + added_post_tx_resume - (lost_recovered + lost_transplant_end + lost_transferred + lost_voluntary_stop + lost_followup + lost_deceased)` (subject to facility’s counting methodology; verify during data entry)
- Payment totals: `pat_payment_total == patients_unduplicated`
- Age, race, ethnicity totals each must equal `patients_unduplicated`.
- Net revenue totals: `rev_total = sum(rev_medicare, rev_medicaid, rev_other_public, rev_private_ins, rev_private_pay)`
- Operational day-of-week constraints: Shifts and patient counts should be consistent with reported hours and nocturnal flag.

## Mapping Notes

- Use official section headings and page numbers from the questionnaire for traceability.
