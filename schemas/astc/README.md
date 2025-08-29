# ASTC — Data Dictionary (Draft)

- Source: `2023 ASTC Questionnaire Form.pdf`
- Year: `2023`
- Facility Type: Ambulatory Surgical Treatment Center (ASTC)
- Status: Draft — pending field mapping from source PDF

## Overview

Annual survey for Illinois ASTCs. Capture facility identifiers, ownership, services, staffing, volumes, and other required metrics reported for the year.

## Conventions

- Types: `string`, `integer`, `number`, `boolean`, `date`, `enum`.
- Required: `yes`/`no`.
- Use `allowed_values` for enumerations and reference them in Enumerations.

## Fields

| field_id | field_label | field_name | type | required | allowed_values | format | unit | section/page | notes |
|---|---|---|---|---|---|---|---|---|---|
| facility.astc_license | ASTC License | astc_license | string | yes |  |  |  | Intro p.1 | License identifier as issued by IDPH |
| facility.name | ASTC Name | facility_name | string | yes |  |  |  | Intro p.1 | Official facility name |
| facility.address.line1 | ASTC Address | address_line1 | string | yes |  |  |  | Intro p.1 | Street address |
| facility.address.city | ASTC City | address_city | string | yes |  |  |  | Intro p.1 |  |
| facility.address.state | State | address_state | string | yes | IL |  |  | Intro p.1 | Fixed to IL |
| facility.address.zip | Zip Code | address_zip | string | yes |  | ^\d{5}(-\d{4})?$ |  | Intro p.1 | 5-digit ZIP or ZIP+4 |
| facility.fein | Federal Employer Identification Number (FEIN) | fein | string | yes |  | ^\d{2}-\d{7}$ |  | Intro p.1 |  |
| section_i.header | Section I Reporting Year | section_i_year | integer | yes | 2023 |  | year | p.1 | Fixed year for Section I |
| section_ii.header | Section II Fiscal Year | section_ii_fy_label | string | yes |  |  |  | p.15 | Most recent fiscal year available |
| ownership.type | Ownership Type | ownership_type | enum | yes | ownership_type |  |  | Sec I p.2 | Choose one |
| ownership.other_specify | Other Ownership Type (Specify) | ownership_other | string | no |  |  |  | Sec I p.2 | Required if ownership_type = other_* |
| reg_agent.name | Name of Registered Agent | reg_agent_name | string | conditional |  |  |  | Sec I p.2 | Required if ownership requires RA (see types) |
| reg_agent.address | Registered Agent Address | reg_agent_address | string | conditional |  |  |  | Sec I p.2 |  |
| reg_agent.city_state_zip | Registered Agent City, State, Zip+4 | reg_agent_city_state_zip | string | conditional |  |  |  | Sec I p.2 |  |
| reg_agent.phone | Registered Agent Telephone Number | reg_agent_phone | string | conditional |  | ^\(\d{3}\) \d{3}-\d{4}(\.\d+)?$ |  | Sec I p.2 | Format as printed on form |
| related_entities | Related Organizations/Entities | related_entities | array | no |  |  |  | Sec I p.2 | List of objects: name, relationship, interest |
| related_entities[].name | Name | related_entities[].name | string |  |  |  |  | Sec I p.2 |  |
| related_entities[].relationship | Relationship | related_entities[].relationship | string |  |  |  |  | Sec I p.2 | e.g., parent, subsidiary, affiliate |
| related_entities[].interest_type | Type of Interest | related_entities[].interest_type | string |  |  |  |  | Sec I p.2 | legal, financial, management, etc. |
| owners | Legal Owners/Operators | owners | array | no |  |  |  | Sec I p.3 | Up to 25 in form; allow more via spreadsheet |
| owners[].name | Owner Name | owners[].name | string |  |  |  |  | Sec I p.3 |  |
| owners[].address | Address | owners[].address | string |  |  |  |  | Sec I p.3 |  |
| owners[].city_state_zip | City, State Zip+4 | owners[].city_state_zip | string |  |  |  |  | Sec I p.3 |  |
| owners[].phone | Telephone Number | owners[].phone | string |  |  | ^\(\d{3}\) \d{3}-\d{4}(\.\d+)?$ |  | Sec I p.3 |  |
| property.owner_name | Property Owner | property_owner_name | string | conditional |  |  |  | Sec I p.4 | Required if property not owned by legal owner/operator |
| property.address | Property Owner Address | property_owner_address | string | conditional |  |  |  | Sec I p.4 |  |
| property.city_state_zip | Property Owner City, State Zip+4 | property_owner_city_state_zip | string | conditional |  |  |  | Sec I p.4 |  |
| property.phone | Property Owner Telephone | property_owner_phone | string | conditional |  | ^\(\d{3}\) \d{3}-\d{4}(\.\d+)?$ |  | Sec I p.4 |  |
| mgmt.has_contract | No Contractual Management | mgmt_no_contract | boolean | yes |  |  |  | Sec I p.4 | True if management NOT performed by independent contractor |
| mgmt.contractors | Contractual Management Contractors | mgmt_contractors | array | conditional |  |  |  | Sec I p.4 | Required if mgmt_no_contract = false |
| mgmt.contractors[].name | Contractor Name | mgmt_contractors[].name | string |  |  |  |  | Sec I p.4 |  |
| mgmt.contractors[].address | Full Address | mgmt_contractors[].address | string |  |  |  |  | Sec I p.4 |  |
| staffing.workweek_hours | Hours in a full-time work week | staffing_workweek_hours | integer | yes |  |  | hours | Sec I p.4 |  |
| staffing.ftes.administrators | Administrators (FTEs) | fte_admin | number | yes |  |  | FTE | Sec I p.4 | Decimal FTEs |
| staffing.ftes.physicians | Physicians (FTEs) | fte_physicians | number | yes |  |  | FTE | Sec I p.4 |  |
| staffing.ftes.crna | Nurse Anesthetists (FTEs) | fte_crna | number | yes |  |  | FTE | Sec I p.4 |  |
| staffing.ftes.don | Director of Nursing (FTEs) | fte_don | number | yes |  |  | FTE | Sec I p.4 |  |
| staffing.ftes.rn | Registered Nurses (FTEs) | fte_rn | number | yes |  |  | FTE | Sec I p.4 |  |
| staffing.ftes.cert_aides | Certified Aides (FTEs) | fte_cert_aides | number | yes |  |  | FTE | Sec I p.4 |  |
| staffing.ftes.other_health | Other Health Professionals (FTEs) | fte_other_health | number | yes |  |  | FTE | Sec I p.4 |  |
| staffing.ftes.other_nonhealth | Other Non-Health Professionals (FTEs) | fte_other_nonhealth | number | yes |  |  | FTE | Sec I p.4 |  |
| staffing.ftes.total | TOTAL FACILITY PERSONNEL (FTEs) | fte_total | number | auto |  |  | FTE | Sec I p.4 | Auto-calculated on form |
| patients.age_sex | Patients by Age Groups and Sex | patients_age_sex | array | yes |  |  |  | Sec I p.5 | Rows by age bands, counts by sex |
| patients.age_sex[].age_band | Age Band | age_band | enum |  | age_band |  |  | Sec I p.5 | 0-14, 15-44, 45-64, 65-74, 75+ |
| patients.age_sex[].male | Male | male_count | integer |  |  |  | patients | Sec I p.5 |  |
| patients.age_sex[].female | Female | female_count | integer |  |  |  | patients | Sec I p.5 |  |
| patients.age_sex_total | TOTAL PATIENTS SERVED (age/sex) | patients_age_total | integer | auto |  |  | patients | Sec I p.5 | Auto-calculated; must match Q6 total |
| patients.payment_sex | Patients by Primary Payment Source and Sex | patients_payment_sex | array | yes |  |  |  | Sec I p.5-6 | Rows by payment source, counts by sex |
| patients.payment_sex[].payment_source | Payment Source | payment_source | enum |  | payment_source |  |  | Sec I p.6 | Medicaid, Medicare, Other Public, Private Insurance, Private Payment, Charity Care |
| patients.payment_sex[].male | Male | male_count | integer |  |  |  | patients | Sec I p.6 |  |
| patients.payment_sex[].female | Female | female_count | integer |  |  |  | patients | Sec I p.6 |  |
| patients.payment_total | TOTAL PATIENTS SERVED (payment/sex) | patients_payment_total | integer | auto |  |  | patients | Sec I p.6 | Auto-calculated; must match Q5 total |
| patients.age.male.0_14 | Male 0–14 | patients_age_male_0_14 | integer | no |  |  | patients | Sec I p.5 | Convenience field derived from age/sex table |
| patients.age.male.15_44 | Male 15–44 | patients_age_male_15_44 | integer | no |  |  | patients | Sec I p.5 | |
| patients.age.male.45_64 | Male 45–64 | patients_age_male_45_64 | integer | no |  |  | patients | Sec I p.5 | |
| patients.age.male.65_74 | Male 65–74 | patients_age_male_65_74 | integer | no |  |  | patients | Sec I p.5 | |
| patients.age.male.75_plus | Male 75+ | patients_age_male_75_plus | integer | no |  |  | patients | Sec I p.5 | |
| patients.age.female.0_14 | Female 0–14 | patients_age_female_0_14 | integer | no |  |  | patients | Sec I p.5 | |
| patients.age.female.15_44 | Female 15–44 | patients_age_female_15_44 | integer | no |  |  | patients | Sec I p.5 | |
| patients.age.female.45_64 | Female 45–64 | patients_age_female_45_64 | integer | no |  |  | patients | Sec I p.5 | |
| patients.age.female.65_74 | Female 65–74 | patients_age_female_65_74 | integer | no |  |  | patients | Sec I p.5 | |
| patients.age.female.75_plus | Female 75+ | patients_age_female_75_plus | integer | no |  |  | patients | Sec I p.5 | |
| patients.payment.male.medicaid | Male — Medicaid | patients_payment_male_medicaid | integer | no | payment_source |  | patients | Sec I p.6 | Convenience field derived from payment/sex table |
| patients.payment.male.medicare | Male — Medicare | patients_payment_male_medicare | integer | no | payment_source |  | patients | Sec I p.6 | |
| patients.payment.male.other_public | Male — Other Public | patients_payment_male_other_public | integer | no | payment_source |  | patients | Sec I p.6 | |
| patients.payment.male.private_insurance | Male — Private Insurance | patients_payment_male_private_insurance | integer | no | payment_source |  | patients | Sec I p.6 | |
| patients.payment.male.private_payment | Male — Private Payment | patients_payment_male_private_payment | integer | no | payment_source |  | patients | Sec I p.6 | |
| patients.payment.male.charity_care | Male — Charity Care | patients_payment_male_charity_care | integer | no | payment_source |  | patients | Sec I p.6 | |
| patients.payment.female.medicaid | Female — Medicaid | patients_payment_female_medicaid | integer | no | payment_source |  | patients | Sec I p.6 | |
| patients.payment.female.medicare | Female — Medicare | patients_payment_female_medicare | integer | no | payment_source |  | patients | Sec I p.6 | |
| patients.payment.female.other_public | Female — Other Public | patients_payment_female_other_public | integer | no | payment_source |  | patients | Sec I p.6 | |
| patients.payment.female.private_insurance | Female — Private Insurance | patients_payment_female_private_insurance | integer | no | payment_source |  | patients | Sec I p.6 | |
| patients.payment.female.private_payment | Female — Private Payment | patients_payment_female_private_payment | integer | no | payment_source |  | patients | Sec I p.6 | |
| patients.payment.female.charity_care | Female — Charity Care | patients_payment_female_charity_care | integer | no | payment_source |  | patients | Sec I p.6 | |
| patients.origin | Patients by Place of Origin | patients_origin | array | no |  |  |  | Sec I p.7-11 | Prefer Zip; else County |
| patients.origin[].zip | Zip Code Area | origin_zip | string | conditional |  | ^\d{5}$ |  | Sec I p.7-11 | Required if county not provided |
| patients.origin[].county | County Name | origin_county | string | conditional |  |  |  | Sec I p.7-11 | Required if zip not provided |
| patients.origin[].count | Number of Patients | origin_count | integer |  |  |  | patients | Sec I p.7-11 |  |
| ops.hours.monday | Hours Open Monday | hours_mon | number | yes |  |  | hours | Sec I p.12 | Report numeric hours |
| ops.hours.tuesday | Hours Open Tuesday | hours_tue | number | yes |  |  | hours | Sec I p.12 |  |
| ops.hours.wednesday | Hours Open Wednesday | hours_wed | number | yes |  |  | hours | Sec I p.12 |  |
| ops.hours.thursday | Hours Open Thursday | hours_thu | number | yes |  |  | hours | Sec I p.12 |  |
| ops.hours.friday | Hours Open Friday | hours_fri | number | yes |  |  | hours | Sec I p.12 |  |
| ops.hours.saturday | Hours Open Saturday | hours_sat | number | yes |  |  | hours | Sec I p.12 |  |
| ops.hours.sunday | Hours Open Sunday | hours_sun | number | yes |  |  | hours | Sec I p.12 |  |
| ops.hours.total | TOTAL HOURS | hours_total | number | auto |  |  | hours | Sec I p.12 | Auto-calculated |
| rooms.operating_class_c | Operating Rooms (Class C) | rooms_or_class_c | integer | yes |  |  | rooms | Sec I p.12 |  |
| rooms.procedure_class_b | Procedure Rooms (Class B) | rooms_proc_class_b | integer | yes |  |  | rooms | Sec I p.12 |  |
| rooms.exam | Examination Rooms | rooms_exam | integer | yes |  |  | rooms | Sec I p.12 |  |
| rooms.stage1_recovery | Stage 1 Recovery Stations | stations_stage1 | integer | yes |  |  | stations | Sec I p.12 |  |
| rooms.stage2_recovery | Stage 2 Recovery Stations | stations_stage2 | integer | yes |  |  | stations | Sec I p.12 |  |
| hospital_relationships | Hospital Relationships | hospital_relationships | array | no |  |  |  | Sec I p.12 | Contractual relationships incl. transfer agreements |
| hospital_relationships[].name_city | Hospital Name and City | hosp_name_city | string |  |  |  |  | Sec I p.12 |  |
| hospital_relationships[].patient_transfers | Patient Transfers | hosp_patient_transfers | integer |  |  |  | count | Sec I p.12 | If applicable; enter number of transfers |
| utilization.or_class_c | Surgical Utilization — Operating Rooms (Class C) | util_or_c | array | yes |  |  |  | Sec I p.13 | Per specialty category |
| utilization.or_class_c[].category | Surgical Category | util_or_c[].category | enum |  | surgery_category |  |  | Sec I p.13 | Cardiovascular, Dermatology, General Surgery, Gastroenterology, Neurological, OB/Gynecology, Oral/Maxillofacial, Ophthalmology, Laser Eye Surgery, Orthopedic, Otolaryngology, Pain Management, Plastic, Podiatry, Thoracic, Urology |
| utilization.or_class_c[].cases | Number of Cases | util_or_c[].cases | integer |  |  |  | cases | Sec I p.13 | A case = a patient treated |
| utilization.or_class_c[].setup_hours | Room Set-Up Time (hours) | util_or_c[].setup_hours | number |  |  |  | hours | Sec I p.13 | Round to nearest 0.25 |
| utilization.or_class_c[].surgery_hours | Actual Surgery Time (hours) | util_or_c[].surgery_hours | number |  |  |  | hours | Sec I p.13 | Round to nearest 0.25 |
| utilization.or_class_c[].cleanup_hours | Room Clean-Up Time (hours) | util_or_c[].cleanup_hours | number |  |  |  | hours | Sec I p.13 | Round to nearest 0.25 |
| utilization.proc_class_b | Surgical Utilization — Procedure Rooms (Class B) | util_proc_b | object | yes |  |  |  | Sec I p.14 | Dedicated and multipurpose |
| utilization.proc_class_b.dedicated | Dedicated Procedure Rooms | util_proc_b_ded | array |  |  |  |  | Sec I p.14 | GI, Laser Eye, Pain Mgmt, Cardiac Cath |
| utilization.proc_class_b.dedicated[].type | Dedicated Type | util_proc_b_ded[].type | enum |  | proc_dedicated_type |  |  | Sec I p.14 | GI, Laser Eye, Pain Management, Cardiac Catheterization |
| utilization.proc_class_b.dedicated[].rooms | Rooms | util_proc_b_ded[].rooms | integer |  |  |  | rooms | Sec I p.14 |  |
| utilization.proc_class_b.dedicated[].cases | Cases | util_proc_b_ded[].cases | integer |  |  |  | cases | Sec I p.14 |  |
| utilization.proc_class_b.dedicated[].setup_hours | Set-Up Time (hours) | util_proc_b_ded[].setup_hours | number |  |  |  | hours | Sec I p.14 |  |
| utilization.proc_class_b.dedicated[].surgery_hours | Actual Surgery Time (hours) | util_proc_b_ded[].surgery_hours | number |  |  |  | hours | Sec I p.14 |  |
| utilization.proc_class_b.dedicated[].cleanup_hours | Clean-Up Time (hours) | util_proc_b_ded[].cleanup_hours | number |  |  |  | hours | Sec I p.14 |  |
| utilization.proc_class_b.multipurpose | Multipurpose Procedure Rooms | util_proc_b_multi | array |  |  |  |  | Sec I p.14 | Specify procedure type |
| utilization.proc_class_b.multipurpose[].type | Procedure Type | util_proc_b_multi[].type | string |  |  |  |  | Sec I p.14 |  |
| utilization.proc_class_b.multipurpose[].cases | Cases | util_proc_b_multi[].cases | integer |  |  |  | cases | Sec I p.14 |  |
| utilization.proc_class_b.multipurpose[].setup_hours | Set-Up Time (hours) | util_proc_b_multi[].setup_hours | number |  |  |  | hours | Sec I p.14 |  |
| utilization.proc_class_b.multipurpose[].surgery_hours | Actual Surgery Time (hours) | util_proc_b_multi[].surgery_hours | number |  |  |  | hours | Sec I p.14 |  |
| utilization.proc_class_b.multipurpose[].cleanup_hours | Clean-Up Time (hours) | util_proc_b_multi[].cleanup_hours | number |  |  |  | hours | Sec I p.14 |  |
| utilization.proc_class_b.total_multi_rooms | Total Multi-Purpose Procedure Rooms | util_proc_b_multi_total_rooms | integer | auto |  |  | rooms | Sec I p.14 | Auto-calculated |
| utilization.proc_class_b.totals_procedure_rooms | TOTALS — Procedure Rooms | util_proc_b_totals | object | auto |  |  |  | Sec I p.14 | Auto-calculated summary |
| utilization.proc_class_b.total_cases_all | TOTAL CASES (Q11 + Q12) | util_total_cases | integer | auto |  |  | cases | Sec I p.14 | Must equal Total Patients Served (Q5 & Q6) |
| finance.fy_start | Fiscal Year Starting Date | fy_start | date | yes |  | mm/dd/yyyy |  | Sec II p.15 | Most recent fiscal year available |
| finance.fy_end | Fiscal Year Ending Date | fy_end | date | yes |  | mm/dd/yyyy |  | Sec II p.15 |  |
| finance.source | Source of Financial Information | finance_source | enum | yes | finance_source |  |  | Sec II p.15 | e.g., Audited FS, Review, Compilation, Tax Return |
| finance.capex.total | Capital Expenditures — Total | capex_total | number | yes |  |  | USD | Sec II p.15 | Report total for fiscal year |

## Enumerations

- Provide enumerations (e.g., ownership type, service categories) as discovered during mapping.
  - ownership_type: see below
  - payment_source: see below
  - age_band: [0-14, 15-44, 45-64, 65-74, 75+]
  - surgery_category: see below
  - proc_dedicated_type: [GI, Laser Eye, Pain Management, Cardiac Catheterization]
  - finance_source: [Audited Financial Statements, Review Financial Statements, Compilation Financial Statements, Tax Return]

### ownership_type
- for_profit:sole_proprietorship — Sole Proprietorship
- for_profit:corporation_ra — Corporation (Registered Agent required)
- for_profit:partnership — Partnership (registered with county)
- for_profit:limited_partnership_ra — Limited Partnership (Registered Agent required)
- for_profit:llp_ra — Limited Liability Partnership (Registered Agent required)
- for_profit:llc_ra — Limited Liability Company (Registered Agent required)
- for_profit:other — Other For Profit (specify)
- nonprofit:church_related — Church Related
- nonprofit:state — State
- nonprofit:county — County
- nonprofit:city — City
- nonprofit:township — Township
- nonprofit:other — Other Not for Profit (specify)

### payment_source
- medicaid — Medicaid
- medicare — Medicare
- other_public — Other Public
- private_insurance — Private Insurance
- private_payment — Private Payment
- charity_care — Charity Care

### surgery_category (Operating Rooms — Class C)
- cardiovascular — Cardiovascular
- dermatology — Dermatology
- general_surgery — General Surgery
- gastroenterology — Gastroenterology
- neurological — Neurological
- ob_gyn — OB/Gynecology
- oral_maxillofacial — Oral/Maxillofacial
- ophthalmology — Ophthalmology
- laser_eye — Laser Eye Surgery
- orthopedic — Orthopedic
- otolaryngology — Otolaryngology
- pain_management — Pain Management
- plastic — Plastic
- podiatry — Podiatry
- thoracic — Thoracic
- urology — Urology

## Validation Rules

- Staffing: `fte_total = sum(fte_admin, fte_physicians, fte_crna, fte_don, fte_rn, fte_cert_aides, fte_other_health, fte_other_nonhealth)`
- Patients Q5 vs Q6: `patients_age_total == patients_payment_total`
- Patients definition: A case equals a patient treated; ensure double-counting is avoided across categories.
- Operation hours: `hours_total = sum(hours_mon..hours_sun)`
- Procedure rooms: `util_proc_b_totals.rooms == rooms_proc_class_b`
- Case totals: `util_total_cases == patients_age_total == patients_payment_total`

## Mapping Notes

- Use official section headings and page numbers from the questionnaire for traceability.
- Definitions for Class C and Class B provided in form; included to guide data interpretation.
- Patient Origin can be supplied via the optional spreadsheet if >300 areas; treat `patients_origin` as an open list.
