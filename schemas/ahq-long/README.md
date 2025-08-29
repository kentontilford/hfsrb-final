# AHQ Long (≥ 100 Beds) — Data Dictionary (Draft)

- Source: `AHQLong2023-MORE THAN 100 BEDS.pdf`
- Year: `2023`
- Facility Type: Acute Care Hospital — Long Form (≥ 100 beds)
- Status: Draft — pending field mapping from source PDF

## Overview

Annual Hospital Questionnaire long form for hospitals with 100 or more beds. Capture detailed hospital identifiers, ownership, extensive services, staffing, finances, and annual activity.

## Conventions

- Types: `string`, `integer`, `number`, `boolean`, `date`, `enum`.
- Required: `yes`/`no`.
- Use `allowed_values` for enumerations and reference them in Enumerations.

## Fields

| field_id | field_label | field_name | type | required | allowed_values | format | unit | section/page | notes |
|---|---|---|---|---|---|---|---|---|---|
| facility.license_idph | Facility IDPH License Number | license_idph | string | yes |  |  |  | p.1 |  |
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
| utilization.* | Facility Utilization by Category | util_* | object | yes |  |  |  | p.3-4 | Same structure as AHQ Short; include LTAC category |
| inpatients_by_race.* | Inpatients and Days by Racial Group | race_* | integer | yes |  |  | patients/days | p.4 | Counts and days tables |
| inpatients_by_ethnicity.* | Inpatients and Days by Ethnicity | eth_* | integer | yes |  |  | patients/days | p.4 |  |
| outpatients.visits | Outpatient Visits | op_visits | object | yes |  |  |  | p.4 | On/off campus and total |
| patients_by_payment.* | In/Outpatients by Primary Payment | pay_* | object | yes | hospital_payment |  |  | p.4 | Totals must tie to visits/admissions |
| charity_care.inpatients | Charity Care Inpatients | charity_inpatients | integer | yes |  |  | patients | p.4 | > 50% of cost covered by charity |
| charity_care.outpatients | Charity Care Outpatients | charity_outpatients | integer | yes |  |  | patients | p.4 |  |
| surgery.or_class_c.* | OR (Class C) rooms/cases/hours by category | or_* | object | yes | surgery_category |  | rooms/cases/hours | p.5 | As in AHQ Short |
| surgery.class_b.* | Class B procedures (dedicated/multipurpose) | procB_* | object | yes | proc_dedicated_type_hosp |  | rooms/cases/hours | p.6 |  |
| equipment.* | Equipment inventory and contracted suppliers | equip_* | object | no |  |  |  | p.9-10 |  |
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
| supplier_diversity.reporting_entity | Hospital or Health Care System | sd_entity | string | yes |  |  |  | p.12 | If system-wide report, list included hospitals |
| supplier_diversity.contact.name | Contact Person for this Section | sd_contact_name | string | yes |  |  |  | p.12 |  |
| supplier_diversity.contact.phone | Contact Telephone | sd_contact_phone | string | yes |  | ^\(\d{3}\) \d{3}-\d{4}(\.\d+)?$ |  | p.12 |  |
| supplier_diversity.contact.email | Contact E-Mail | sd_contact_email | string | yes |  | email |  | p.12 |  |
| supplier_diversity.state_specific_explanation | State-specific data availability/explanation | sd_state_specific | string | no |  |  |  | p.12 | Required if not all data State-specific |
| supplier_diversity.goals.female_owned_pct | Goal % — Female-Owned | sd_goal_female_pct | number | no |  | percent | % | p.12 |  |
| supplier_diversity.goals.minority_owned_pct | Goal % — Minority-Owned | sd_goal_minority_pct | number | no |  | percent | % | p.12 |  |
| supplier_diversity.goals.veteran_owned_pct | Goal % — Veteran-Owned | sd_goal_veteran_pct | number | no |  | percent | % | p.12 |  |
| supplier_diversity.goals.sbe_pct | Goal % — Small Business Enterprise | sd_goal_sbe_pct | number | no |  | percent | % | p.12 |  |
| supplier_diversity.qualifying_capex_total | Total Qualifying Capital Expenditures | sd_capex_total | number | no |  |  | USD | p.12 | If none, skip to D |
| supplier_diversity.actual.female_owned_amount | Actual — Female-Owned (USD) | sd_act_female_amt | number | no |  |  | USD | p.12 |  |
| supplier_diversity.actual.minority_owned_amount | Actual — Minority-Owned (USD) | sd_act_minority_amt | number | no |  |  | USD | p.12 |  |
| supplier_diversity.actual.veteran_owned_amount | Actual — Veteran-Owned (USD) | sd_act_veteran_amt | number | no |  |  | USD | p.12 |  |
| supplier_diversity.actual.sbe_amount | Actual — Small Business Enterprise (USD) | sd_act_sbe_amt | number | no |  |  | USD | p.12 |  |
| supplier_diversity.actual.percentages | Calculated Percentages | sd_act_pct | object | auto |  | percent | % | p.12 | Derived from amounts/total |
| supplier_diversity.seeking_categories | Seeking supplier diversity in categories | sd_seeking_categories | string | no |  |  |  | p.13 | Question D |
| supplier_diversity.plan_outreach | Plan to alert/encourage enterprises | sd_plan_outreach | string | no |  |  |  | p.13 | Question E |
| supplier_diversity.challenges | Challenges encountered | sd_challenges | string | no |  |  |  | p.13 | Question F |
| supplier_diversity.board_assistance | How IHFSRB can assist | sd_board_help | string | no |  |  |  | p.13 | Question G |
| supplier_diversity.recognized_certs | Recognized certifications | sd_recognized_certs | string | no |  |  |  | p.13 | Question H |
| supplier_diversity.vendor_contact | Vendor/supplier point of contact | sd_vendor_contact | string | no |  |  |  | p.14 | Question I |
| supplier_diversity.vendor_enroll | Vendor/supplier enrollment process | sd_vendor_enroll | string | no |  |  |  | p.14 | Question J |
| supplier_diversity.success_examples | Examples of successful recruitment | sd_success_examples | string | no |  |  |  | p.14 | Question K |
| contacts.reporting_contact.* | Reporting Contact (Name/Title/Phone/Email) | contact_* | string | yes |  |  |  | p.19 | Required |
| certification.* | Certification (attest/name/title/date) | cert_* | string | yes |  |  |  | p.19 | Required |

## Enumerations

- Provide enumerations (e.g., ownership type, service lines) as discovered during mapping.
  - hospital_characterization, cms_cert, ahq_ownership, surgery_category, proc_dedicated_type_hosp, finance_source, hospital_payment: same as AHQ Short

## Validation Rules

- Same as AHQ Short, plus:
- Supplier diversity: Percentages must equal amounts divided by `sd_capex_total`; sum of category percentages should be ≤ 100%.

## Mapping Notes

- Use official section headings and page numbers from the questionnaire for traceability.
