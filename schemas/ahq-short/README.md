# AHQ Short (< 100 Beds) — Data Dictionary (Draft)

- Source: `AHQShort2023-LESS THAN 100 BEDS.pdf`
- Year: `2023`
- Facility Type: Acute Care Hospital — Short Form (< 100 beds)
- Status: Draft — pending field mapping from source PDF

## Overview

Annual Hospital Questionnaire short form for hospitals with fewer than 100 beds. Capture hospital identifiers, ownership, services, staffing, and annual activity summaries.

## Conventions

- Types: `string`, `integer`, `number`, `boolean`, `date`, `enum`.
- Required: `yes`/`no`.
- Use `allowed_values` for enumerations and reference them in Enumerations.

## Fields

| field_id | field_label | field_name | type | required | allowed_values | format | unit | section/page | notes |
|---|---|---|---|---|---|---|---|---|---|
| facility.license_idph | Facility IDPH License Number | license_idph | string | yes |  |  |  | p.1 | As shown on license |
| facility.name | Facility Name | facility_name | string | yes |  |  |  | p.1 |  |
| facility.address.line1 | Facility Address | address_line1 | string | yes |  |  |  | p.1 |  |
| facility.address.city | Facility City | address_city | string | yes |  |  |  | p.1 |  |
| facility.address.zip | Facility Zip Code | address_zip | string | yes |  | ^\d{5}(-\d{4})?$ |  | p.1 |  |
| facility.fein | Facility FEIN Number | fein | string | yes |  | ^\d{2}-\d{7}$ |  | p.1 |  |
| ownership.operator_entity | Legal entity operating the facility | operator_entity | string | yes |  |  |  | p.1 |  |
| ownership.plant_owner | Legal entity owning physical plant | plant_owner | string | yes |  |  |  | p.1 |  |
| hospital.characterization | Entire hospital characterized as | hospital_characterization | array | yes | hospital_characterization |  |  | p.2 | Multi-select |
| cms.certification | CMS certification (entire facility) | cms_certification | enum | no | cms_cert |  |  | p.2 | If applicable |
| ownership.type | Managing organization type | ownership_type | enum | yes | ahq_ownership |  |  | p.2 | Select one |
| ownership.other_details | Other Ownership Details | ownership_other | string | conditional |  |  |  | p.2 | Required if “Other …” selected |
| chna.url | Community Health Needs Assessment (CHNA) URL | chna_url | string | no |  | uri |  | p.2 | Provide URL if posted online; else send via email |
| mgmt.contracts.emergency | Emergency Services Management Contractor | mgmt_emergency | string | no |  |  |  | p.2 | Name/contact if applicable |
| mgmt.contracts.psychiatric | Psychiatric Services Management Contractor | mgmt_psych | string | no |  |  |  | p.2 |  |
| mgmt.contracts.rehabilitation | Rehabilitation Services Management Contractor | mgmt_rehab | string | no |  |  |  | p.2 |  |
| utilization.med_surg | Medical-Surgical Utilization | util_med_surg | object | yes |  |  |  | p.3 | Admissions, inpatient days by age |
| utilization.med_surg.admissions | Admissions | med_surg_admissions | integer |  |  |  | admissions | p.3 |  |
| utilization.med_surg.inpatient_days.0_14 | Inpatient Days 0-14 | med_surg_days_0_14 | integer |  |  |  | days | p.3 |  |
| utilization.med_surg.inpatient_days.15_44 | Inpatient Days 15-44 | med_surg_days_15_44 | integer |  |  |  | days | p.3 |  |
| utilization.med_surg.inpatient_days.45_64 | Inpatient Days 45-64 | med_surg_days_45_64 | integer |  |  |  | days | p.3 |  |
| utilization.med_surg.inpatient_days.65_74 | Inpatient Days 65-74 | med_surg_days_65_74 | integer |  |  |  | days | p.3 |  |
| utilization.med_surg.inpatient_days.75_plus | Inpatient Days 75+ | med_surg_days_75_plus | integer |  |  |  | days | p.3 |  |
| utilization.med_surg.inpatient_days.total | TOTALS | med_surg_days_total | integer | auto |  |  | days | p.3 | Auto-calculated |
| utilization.med_surg.beds_oct1 | Beds Set Up and Staffed Oct 1, 2023 | med_surg_beds_oct1 | integer |  |  |  | beds | p.3 |  |
| utilization.med_surg.peak_beds | Peak Beds Set Up and Staffed | med_surg_peak_beds | integer |  |  |  | beds | p.3 |  |
| utilization.med_surg.peak_census | Peak Daily Census | med_surg_peak_census | integer |  |  |  | patients | p.3 |  |
| utilization.med_surg.observation_days | Observation Days in Unit | med_surg_observation_days | number |  |  |  | days | p.3 | Observation hours/24 |
| utilization.pediatrics | Pediatrics Utilization | util_peds | object | conditional |  |  |  | p.3 | If facility has authorized pediatrics unit |
| utilization.pediatrics.admissions | Admissions | peds_admissions | integer |  |  |  | admissions | p.3 |  |
| utilization.pediatrics.inpatient_days | Inpatient Days | peds_days | integer |  |  |  | days | p.3 |  |
| utilization.pediatrics.beds_oct1 | Beds Set Up and Staffed Oct 1, 2023 | peds_beds_oct1 | integer |  |  |  | beds | p.3 |  |
| utilization.pediatrics.peak_beds | Peak Beds Set Up and Staffed | peds_peak_beds | integer |  |  |  | beds | p.3 |  |
| utilization.pediatrics.peak_census | Peak Daily Census | peds_peak_census | integer |  |  |  | patients | p.3 |  |
| utilization.pediatrics.observation_days | Observation Days in Unit | peds_observation_days | number |  |  |  | days | p.3 |  |
| utilization.icu.direct_admissions | ICU — Directly Admitted | icu_direct | integer |  |  |  | admissions | p.3 |  |
| utilization.icu.transferred | ICU — Transferred into ICU | icu_transferred | integer |  |  |  | admissions | p.3 | Not counted as additional hospital admissions |
| utilization.icu.total | ICU — Total Intensive Care | icu_total | integer | auto |  |  |  | p.3 | Auto-calculated |
| utilization.icu.inpatient_days | ICU — Inpatient Days | icu_days | integer |  |  |  | days | p.3 |  |
| utilization.icu.beds_oct1 | ICU — Beds Set Up and Staffed Oct 1, 2023 | icu_beds_oct1 | integer |  |  |  | beds | p.3 |  |
| utilization.icu.peak_beds | ICU — Peak Beds Set Up and Staffed | icu_peak_beds | integer |  |  |  | beds | p.3 |  |
| utilization.icu.peak_census | ICU — Peak Daily Census | icu_peak_census | integer |  |  |  | patients | p.3 |  |
| utilization.icu.observation_days | ICU — Observation Days in Unit | icu_observation_days | number |  |  |  | days | p.3 |  |
| utilization.ob_gyn.admissions.ob | Obstetrics Admissions | ob_admissions | integer |  |  |  | admissions | p.3 |  |
| utilization.ob_gyn.admissions.clean_gyn | Clean Gynecology Admissions | gyn_admissions | integer |  |  |  | admissions | p.3 |  |
| utilization.ob_gyn.admissions.total | Total Obstetrics/Gyne Admissions | obgyn_admissions_total | integer | auto |  |  |  | p.3 | Auto-calculated |
| utilization.ob_gyn.days.ob | Obstetrics Inpatient Days | ob_days | integer |  |  |  | days | p.3 |  |
| utilization.ob_gyn.days.clean_gyn | Clean Gynecology Inpatient Days | gyn_days | integer |  |  |  | days | p.3 |  |
| utilization.ob_gyn.days.total | Total Obstetrics/Gyne Days | obgyn_days_total | integer | auto |  |  |  | p.3 | Auto-calculated |
| utilization.ob_gyn.beds_oct1 | Beds Set Up and Staffed Oct 1, 2023 | obgyn_beds_oct1 | integer |  |  |  | beds | p.3 |  |
| utilization.ob_gyn.peak_beds | Peak Beds Set Up and Staffed | obgyn_peak_beds | integer |  |  |  | beds | p.3 |  |
| utilization.ob_gyn.peak_census | Peak Daily Census | obgyn_peak_census | integer |  |  |  | patients | p.3 |  |
| utilization.ob_gyn.observation_days | Observation Days in Unit | obgyn_observation_days | number |  |  |  | days | p.3 |  |
| utilization.neonatal_level3.admissions | Neonatal Intensive Care Admissions | nicu_admissions | integer |  |  |  | admissions | p.3 |  |
| utilization.neonatal_level3.inpatient_days | Neonatal Intensive Care Inpatient Days | nicu_days | integer |  |  |  | days | p.3 |  |
| utilization.ltc_care.admissions | Long-Term Nursing Care Admissions | ltc_admissions | integer |  |  |  | admissions | p.3 |  |
| utilization.ltc_care.inpatient_days | Long-Term Nursing Care Inpatient Days | ltc_days | integer |  |  |  | days | p.3 |  |
| utilization.ltc_swing_beds.admissions | LTC Swing Beds Admissions | swing_admissions | integer |  |  |  | admissions | p.3 | Medicare-certified |
| utilization.ltc_swing_beds.inpatient_days | LTC Swing Beds Inpatient Days | swing_days | integer |  |  |  | days | p.3 |  |
| utilization.acute_mental_illness.admissions | Acute Mental Illness Admissions | ami_admissions | integer |  |  |  | admissions | p.3 |  |
| utilization.acute_mental_illness.inpatient_days | Acute Mental Illness Inpatient Days | ami_days | integer |  |  |  | days | p.3 |  |
| utilization.total.admissions | Total Facility Admissions | total_admissions | integer | auto |  |  |  | p.3 | Auto-calculated |
| utilization.total.inpatient_days | Total Facility Inpatient Days | total_inpatient_days | integer | auto |  |  |  | p.3 | Auto-calculated |
| utilization.total.beds_oct1 | Beds Set Up and Staffed Oct 1, 2023 | total_beds_oct1 | integer |  |  |  | beds | p.3 |  |
| observation_unit.beds | Dedicated Observation Beds | obs_unit_beds | integer | no |  |  | beds | p.3 | If applicable |
| observation_unit.days | Dedicated Observation Days | obs_unit_days | number | no |  |  | days | p.3 |  |
| inpatients_by_race.asian | Inpatients — Asian | race_inp_asian | integer | yes |  |  | patients | p.4 | Must tie to totals |
| inpatients_by_race.ai_an | Inpatients — American Indian/Native Alaskan | race_inp_ai_an | integer | yes |  |  | patients | p.4 |  |
| inpatients_by_race.black | Inpatients — Black/African-American | race_inp_black | integer | yes |  |  | patients | p.4 |  |
| inpatients_by_race.nh_pi | Inpatients — Native Hawaiian/Pacific Islander | race_inp_nh_pi | integer | yes |  |  | patients | p.4 |  |
| inpatients_by_race.white | Inpatients — White | race_inp_white | integer | yes |  |  | patients | p.4 |  |
| inpatients_by_race.unknown | Inpatients — Race Unknown | race_inp_unknown | integer | yes |  |  | patients | p.4 |  |
| inpatient_days_by_race.* | Inpatient Days by Race (same categories) | days_by_race_* | integer | yes |  |  | days | p.4 | One field per race category |
| inpatients_by_ethnicity.hispanic | Inpatients — Hispanic/Latino | eth_inp_hispanic | integer | yes |  |  | patients | p.4 |  |
| inpatients_by_ethnicity.not_hispanic | Inpatients — Not Hispanic | eth_inp_not_hispanic | integer | yes |  |  | patients | p.4 |  |
| inpatients_by_ethnicity.unknown | Inpatients — Ethnicity Unknown | eth_inp_unknown | integer | yes |  |  | patients | p.4 |  |
| inpatient_days_by_ethnicity.* | Inpatient Days by Ethnicity (same categories) | days_by_eth_* | integer | yes |  |  | days | p.4 |  |
| outpatients.on_campus | Outpatient Visits at Hospital/Campus | op_visits_on | integer | yes |  |  | visits | p.4 |  |
| outpatients.off_campus | Outpatient Visits Off Site/Off Campus | op_visits_off | integer | yes |  |  | visits | p.4 |  |
| outpatients.total | TOTAL OUTPATIENT VISITS | op_visits_total | integer | auto |  |  | visits | p.4 | Auto-calculated |
| patients_by_payment.inpatients.medicare | Inpatients — Medicare | pay_inp_medicare | integer | yes |  |  | patients | p.4 |  |
| patients_by_payment.inpatients.medicaid | Inpatients — Medicaid | pay_inp_medicaid | integer | yes |  |  | patients | p.4 |  |
| patients_by_payment.inpatients.other_public | Inpatients — Other Public | pay_inp_other_public | integer | yes |  |  | patients | p.4 |  |
| patients_by_payment.inpatients.private_insurance | Inpatients — Private Insurance | pay_inp_private_ins | integer | yes |  |  | patients | p.4 |  |
| patients_by_payment.inpatients.private_payment | Inpatients — Private Payment | pay_inp_private_pay | integer | yes |  |  | patients | p.4 |  |
| patients_by_payment.outpatients.medicare | Outpatients — Medicare | pay_out_medicare | integer | yes |  |  | patients | p.4 |  |
| patients_by_payment.outpatients.medicaid | Outpatients — Medicaid | pay_out_medicaid | integer | yes |  |  | patients | p.4 |  |
| patients_by_payment.outpatients.other_public | Outpatients — Other Public | pay_out_other_public | integer | yes |  |  | patients | p.4 |  |
| patients_by_payment.outpatients.private_insurance | Outpatients — Private Insurance | pay_out_private_ins | integer | yes |  |  | patients | p.4 |  |
| patients_by_payment.outpatients.private_payment | Outpatients — Private Payment | pay_out_private_pay | integer | yes |  |  | patients | p.4 |  |
| patients_by_payment.totals_by_payment | Totals by Payment (In+Out) | pay_totals_by_payment | object | auto |  |  |  | p.4 | Auto-calculated per payer |
| charity_care.inpatients | Charity Care Inpatients | charity_inpatients | integer | yes |  |  | patients | p.4 | > 50% of cost covered by charity |
| charity_care.outpatients | Charity Care Outpatients | charity_outpatients | integer | yes |  |  | patients | p.4 |  |
| surgery.or_class_c.rooms.inpatient | ORs — Inpatient | or_rooms_inpatient | integer | yes |  |  | rooms | p.5 | Class C |
| surgery.or_class_c.rooms.outpatient | ORs — Outpatient | or_rooms_outpatient | integer | yes |  |  | rooms | p.5 |  |
| surgery.or_class_c.rooms.combined | ORs — Combined | or_rooms_combined | integer | yes |  |  | rooms | p.5 | Combined ≠ sum |
| surgery.or_class_c.cases[category] | Surgical Cases by Category | or_cases_[category] | integer | yes | surgery_category |  | cases | p.5 | Separate inpatient/outpatient and total |
| surgery.or_class_c.hours[category] | Surgical Hours by Category | or_hours_[category] | integer | yes | surgery_category |  | hours | p.5 | Setup + surgery + cleanup; rounded hours |
| surgery.class_b.dedicated.rooms[type] | Dedicated Class B Rooms by Type | procB_rooms_[type] | integer | no | proc_dedicated_type_hosp |  | rooms | p.6 |  |
| surgery.class_b.dedicated.cases[type] | Dedicated Class B Cases by Type | procB_cases_[type] | integer | no | proc_dedicated_type_hosp |  | cases | p.6 |  |
| surgery.class_b.dedicated.hours[type] | Dedicated Class B Hours by Type | procB_hours_[type] | integer | no | proc_dedicated_type_hosp |  | hours | p.6 |  |
| surgery.class_b.multipurpose | Multipurpose Procedure Types | procB_multipurpose | array | no |  |  |  | p.6 | Items: type, cases, hours; include total rooms |
| equipment.diagnostic | Diagnostic Equipment Inventory | equip_diag | object | no |  |  |  | p.9-10 | Include owned/contracted and volumes if shown |
| equipment.therapeutic | Therapeutic Equipment Inventory | equip_ther | object | no |  |  |  | p.9-10 | Include owned/contracted and treatments |
| finance.fy_start | Fiscal Year Starting Date | fy_start | date | yes |  | mm/dd/yyyy |  | p.10 |  |
| finance.fy_end | Fiscal Year Ending Date | fy_end | date | yes |  | mm/dd/yyyy |  | p.10 |  |
| finance.source | Financial Records Source | finance_source | enum | yes | finance_source |  |  | p.10 |  |
| finance.capex.total | Total Capital Expenditures | capex_total | number | yes |  |  | USD | p.10 |  |
| finance.capex.projects[].description | Project/Expenditure Description (> $350k) | project_desc | string | no |  |  |  | p.10 |  |
| finance.capex.projects[].amount | Amount Obligated | project_amount | number | no |  |  | USD | p.10 |  |
| finance.capex.projects[].financing_method | Method of Financing | project_financing | string | no |  |  |  | p.10 |  |
| finance.capex.projects[].con_number | CON Project Number | project_con | string | no |  |  |  | p.10 |  |
| finance.net_revenues.inpatient[ payer ] | Inpatient Net Revenue by Source | rev_ip_[payer] | number | yes | hospital_payment |  | USD | p.11 |  |
| finance.net_revenues.outpatient[ payer ] | Outpatient Net Revenue by Source | rev_op_[payer] | number | yes | hospital_payment |  | USD | p.11 |  |
| contacts.reporting_contact.name | Reporting Contact Name | contact_name | string | yes |  |  |  | p.15 | Required to accept form |
| contacts.reporting_contact.title | Reporting Contact Title | contact_title | string | yes |  |  |  | p.15 |  |
| contacts.reporting_contact.phone | Reporting Contact Phone | contact_phone | string | yes |  | ^\(\d{3}\) \d{3}-\d{4}(\.\d+)?$ |  | p.15 |  |
| contacts.reporting_contact.email | Reporting Contact Email | contact_email | string | yes |  | email |  | p.15 |  |
| certification.attest | Certification Attestation | certification_attest | boolean | yes |  |  |  | p.15 | Attest accuracy and completeness |
| certification.name | Certifying Official Name | cert_name | string | yes |  |  |  | p.15 |  |
| certification.title | Certifying Official Title | cert_title | string | yes |  |  |  | p.15 |  |
| certification.date | Certification Date | cert_date | date | yes |  | mm/dd/yyyy |  | p.15 |  |

## Enumerations

- Provide enumerations (e.g., ownership type, service lines) as discovered during mapping.
  - hospital_characterization: [General Hospital, Rehabilitation Hospital, Children’s Specialty Care Hospital, Psychiatric Hospital]
  - cms_cert: [Critical Access Hospital, Long-Term Acute Care Hospital]
  - ahq_ownership: see below
  - surgery_category: [Cardiovascular, Dermatology, General Surgery, Gastroenterology, Neurology, Obstetrics/Gynecology, Oral/Maxillofacial, Ophthalmology, Orthopedic, Otolaryngology, Plastic, Podiatry, Thoracic, Urology]
  - proc_dedicated_type_hosp: [Gastro-Intestinal, Laser Eye, Pain Management, Cystoscopy]
  - finance_source: [Audited Financial Statements, Review Financial Statements, Compilation Financial Statements, Tax Return]
  - hospital_payment: [Medicare, Medicaid, Other Public, Private Insurance, Private Payment]

### ahq_ownership
- governmental:county — County
- governmental:city — City
- governmental:township — Township
- governmental:hospital_district — Hospital District
- governmental:other — Other Governmental (specify)
- nonprofit:church_related — Church-Related
- nonprofit:corporation_not_church — Corporation (Not Church-Related)
- nonprofit:other — Other Not for Profit (specify)
- for_profit:corporation — Corporation
- for_profit:limited_partnership — Limited Partnership
- for_profit:llp — Limited Liability Partnership
- for_profit:llc — Limited Liability Company
- for_profit:other — Other For Profit (specify)

## Validation Rules

- Race/Ethnicity: Inpatient counts and days totals must equal totals reported in facility utilization.
- Outpatient totals: `op_visits_total = op_visits_on + op_visits_off`.
- Payment tie-outs: Sum across payment sources for inpatients equals total admissions; for outpatients equals total outpatient visits.
- OR/Class B: Hours are the sum of setup + procedure + cleanup; combined ORs are not double-counted.
- Observation Days = Observation Hours ÷ 24 (if hours are recorded elsewhere).

## Mapping Notes

- Use official section headings and page numbers from the questionnaire for traceability.
