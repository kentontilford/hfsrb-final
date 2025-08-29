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
| inpatients_by_race.american_indian_alaska_native | Inpatients — AI/AN | race_inp_ai_an | integer | no |  |  | patients | p.4 | |
| inpatients_by_race.asian | Inpatients — Asian | race_inp_asian | integer | no |  |  | patients | p.4 | |
| inpatients_by_race.black | Inpatients — Black/African American | race_inp_black | integer | no |  |  | patients | p.4 | |
| inpatients_by_race.native_hawaiian_pacific | Inpatients — Native Hawaiian/Pacific Islander | race_inp_nh_pi | integer | no |  |  | patients | p.4 | |
| inpatients_by_race.white | Inpatients — White | race_inp_white | integer | no |  |  | patients | p.4 | |
| inpatients_by_race.unknown | Inpatients — Unknown Race | race_inp_unknown | integer | no |  |  | patients | p.4 | |
| inpatient_days_by_race.american_indian_alaska_native | Inpatient Days — AI/AN | days_by_race_ai_an | integer | no |  |  | days | p.4 | |
| inpatient_days_by_race.asian | Inpatient Days — Asian | days_by_race_asian | integer | no |  |  | days | p.4 | |
| inpatient_days_by_race.black | Inpatient Days — Black/African American | days_by_race_black | integer | no |  |  | days | p.4 | |
| inpatient_days_by_race.native_hawaiian_pacific | Inpatient Days — Native Hawaiian/Pacific Islander | days_by_race_nh_pi | integer | no |  |  | days | p.4 | |
| inpatient_days_by_race.white | Inpatient Days — White | days_by_race_white | integer | no |  |  | days | p.4 | |
| inpatient_days_by_race.unknown | Inpatient Days — Unknown Race | days_by_race_unknown | integer | no |  |  | days | p.4 | |
| inpatients_by_ethnicity.hispanic_latino | Inpatients — Hispanic/Latino | eth_inp_hispanic | integer | no |  |  | patients | p.4 | |
| inpatients_by_ethnicity.not_hispanic | Inpatients — Not Hispanic/Latino | eth_inp_not_hispanic | integer | no |  |  | patients | p.4 | |
| inpatients_by_ethnicity.unknown | Inpatients — Ethnicity Unknown | eth_inp_unknown | integer | no |  |  | patients | p.4 | |
| inpatient_days_by_ethnicity.hispanic_latino | Inpatient Days — Hispanic/Latino | days_by_eth_hispanic | integer | no |  |  | days | p.4 | |
| inpatient_days_by_ethnicity.not_hispanic | Inpatient Days — Not Hispanic/Latino | days_by_eth_not_hispanic | integer | no |  |  | days | p.4 | |
| inpatient_days_by_ethnicity.unknown | Inpatient Days — Ethnicity Unknown | days_by_eth_unknown | integer | no |  |  | days | p.4 | |
| outpatients.visits.on_campus | Outpatient Visits — On Campus | op_visits_on | integer | yes |  |  | visits | p.4 | |
| outpatients.visits.off_site | Outpatient Visits — Off Site | op_visits_off | integer | yes |  |  | visits | p.4 | |
| outpatients.visits.total | Outpatient Visits — Total | op_visits_total | integer | yes |  |  | visits | p.4 | op_visits_on + op_visits_off |
| patients_by_payment.inpatient.medicare | Inpatients by Payment — Medicare | pay_inp_medicare | integer | no | hospital_payment |  | patients | p.4 | |
| patients_by_payment.inpatient.medicaid | Inpatients by Payment — Medicaid | pay_inp_medicaid | integer | no | hospital_payment |  | patients | p.4 | |
| patients_by_payment.inpatient.other_public | Inpatients by Payment — Other Public | pay_inp_other_public | integer | no | hospital_payment |  | patients | p.4 | |
| patients_by_payment.inpatient.private_insurance | Inpatients by Payment — Private Insurance | pay_inp_private_ins | integer | no | hospital_payment |  | patients | p.4 | |
| patients_by_payment.inpatient.private_payment | Inpatients by Payment — Private Payment | pay_inp_private_pay | integer | no | hospital_payment |  | patients | p.4 | |
| patients_by_payment.outpatient.medicare | Outpatients by Payment — Medicare | pay_out_medicare | integer | no | hospital_payment |  | visits | p.4 | |
| patients_by_payment.outpatient.medicaid | Outpatients by Payment — Medicaid | pay_out_medicaid | integer | no | hospital_payment |  | visits | p.4 | |
| patients_by_payment.outpatient.other_public | Outpatients by Payment — Other Public | pay_out_other_public | integer | no | hospital_payment |  | visits | p.4 | |
| patients_by_payment.outpatient.private_insurance | Outpatients by Payment — Private Insurance | pay_out_private_ins | integer | no | hospital_payment |  | visits | p.4 | |
| patients_by_payment.outpatient.private_payment | Outpatients by Payment — Private Payment | pay_out_private_pay | integer | no | hospital_payment |  | visits | p.4 | |
| charity_care.inpatients | Charity Care Inpatients | charity_inpatients | integer | yes |  |  | patients | p.4 | > 50% of cost covered by charity |
| charity_care.outpatients | Charity Care Outpatients | charity_outpatients | integer | yes |  |  | patients | p.4 |  |
| surgery.or_class_c.* | OR (Class C) rooms/cases/hours by category | or_* | object | yes | surgery_category |  | rooms/cases/hours | p.5 | As in AHQ Short |
| surgery.class_b.* | Class B procedures (dedicated/multipurpose) | procB_* | object | yes | proc_dedicated_type_hosp |  | rooms/cases/hours | p.6 |  |
| surgery.or_class_c.cardiovascular.rooms_ip | OR Rooms IP — Cardiovascular | or_rooms_ip_cardiovascular | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.cardiovascular.rooms_op | OR Rooms OP — Cardiovascular | or_rooms_op_cardiovascular | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.cardiovascular.rooms_combined | OR Rooms Combined — Cardiovascular | or_rooms_combined_cardiovascular | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.cardiovascular.cases_ip | Surgical Cases IP — Cardiovascular | or_cases_ip_cardiovascular | integer | no |  |  | cases | p.5 | |
| surgery.or_class_c.cardiovascular.cases_op | Surgical Cases OP — Cardiovascular | or_cases_op_cardiovascular | integer | no |  |  | cases | p.5 | |
| surgery.or_class_c.cardiovascular.hours_ip | Surgical Hours IP — Cardiovascular | or_hours_ip_cardiovascular | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.cardiovascular.hours_op | Surgical Hours OP — Cardiovascular | or_hours_op_cardiovascular | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.cardiovascular.hours_total | Surgical Hours Total — Cardiovascular | or_hours_total_cardiovascular | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.dermatology.rooms_ip | OR Rooms IP — Dermatology | or_rooms_ip_dermatology | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.dermatology.rooms_op | OR Rooms OP — Dermatology | or_rooms_op_dermatology | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.dermatology.rooms_combined | OR Rooms Combined — Dermatology | or_rooms_combined_dermatology | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.dermatology.cases_ip | Surgical Cases IP — Dermatology | or_cases_ip_dermatology | integer | no |  |  | cases | p.5 | |
| surgery.or_class_c.dermatology.cases_op | Surgical Cases OP — Dermatology | or_cases_op_dermatology | integer | no |  |  | cases | p.5 | |
| surgery.or_class_c.dermatology.hours_ip | Surgical Hours IP — Dermatology | or_hours_ip_dermatology | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.dermatology.hours_op | Surgical Hours OP — Dermatology | or_hours_op_dermatology | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.dermatology.hours_total | Surgical Hours Total — Dermatology | or_hours_total_dermatology | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.general.rooms_ip | OR Rooms IP — General Surgery | or_rooms_ip_general_surgery | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.general.rooms_op | OR Rooms OP — General Surgery | or_rooms_op_general_surgery | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.general.rooms_combined | OR Rooms Combined — General Surgery | or_rooms_combined_general_surgery | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.general.cases_ip | Surgical Cases IP — General Surgery | or_cases_ip_general_surgery | integer | no |  |  | cases | p.5 | |
| surgery.or_class_c.general.cases_op | Surgical Cases OP — General Surgery | or_cases_op_general_surgery | integer | no |  |  | cases | p.5 | |
| surgery.or_class_c.general.hours_ip | Surgical Hours IP — General Surgery | or_hours_ip_general_surgery | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.general.hours_op | Surgical Hours OP — General Surgery | or_hours_op_general_surgery | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.general.hours_total | Surgical Hours Total — General Surgery | or_hours_total_general_surgery | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.gastroenterology.rooms_ip | OR Rooms IP — Gastroenterology | or_rooms_ip_gastroenterology | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.gastroenterology.rooms_op | OR Rooms OP — Gastroenterology | or_rooms_op_gastroenterology | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.gastroenterology.rooms_combined | OR Rooms Combined — Gastroenterology | or_rooms_combined_gastroenterology | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.gastroenterology.cases_ip | Surgical Cases IP — Gastroenterology | or_cases_ip_gastroenterology | integer | no |  |  | cases | p.5 | |
| surgery.or_class_c.gastroenterology.cases_op | Surgical Cases OP — Gastroenterology | or_cases_op_gastroenterology | integer | no |  |  | cases | p.5 | |
| surgery.or_class_c.gastroenterology.hours_ip | Surgical Hours IP — Gastroenterology | or_hours_ip_gastroenterology | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.gastroenterology.hours_op | Surgical Hours OP — Gastroenterology | or_hours_op_gastroenterology | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.gastroenterology.hours_total | Surgical Hours Total — Gastroenterology | or_hours_total_gastroenterology | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.neurology.rooms_ip | OR Rooms IP — Neurology | or_rooms_ip_neurology | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.neurology.rooms_op | OR Rooms OP — Neurology | or_rooms_op_neurology | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.neurology.rooms_combined | OR Rooms Combined — Neurology | or_rooms_combined_neurology | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.neurology.cases_ip | Surgical Cases IP — Neurology | or_cases_ip_neurology | integer | no |  |  | cases | p.5 | |
| surgery.or_class_c.neurology.cases_op | Surgical Cases OP — Neurology | or_cases_op_neurology | integer | no |  |  | cases | p.5 | |
| surgery.or_class_c.neurology.hours_ip | Surgical Hours IP — Neurology | or_hours_ip_neurology | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.neurology.hours_op | Surgical Hours OP — Neurology | or_hours_op_neurology | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.neurology.hours_total | Surgical Hours Total — Neurology | or_hours_total_neurology | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.obgyn.rooms_ip | OR Rooms IP — Obstetrics/Gynecology | or_rooms_ip_obstetrics_gynecology | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.obgyn.rooms_op | OR Rooms OP — Obstetrics/Gynecology | or_rooms_op_obstetrics_gynecology | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.obgyn.rooms_combined | OR Rooms Combined — Obstetrics/Gynecology | or_rooms_combined_obstetrics_gynecology | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.obgyn.cases_ip | Surgical Cases IP — Obstetrics/Gynecology | or_cases_ip_obstetrics_gynecology | integer | no |  |  | cases | p.5 | |
| surgery.or_class_c.obgyn.cases_op | Surgical Cases OP — Obstetrics/Gynecology | or_cases_op_obstetrics_gynecology | integer | no |  |  | cases | p.5 | |
| surgery.or_class_c.obgyn.hours_ip | Surgical Hours IP — Obstetrics/Gynecology | or_hours_ip_obstetrics_gynecology | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.obgyn.hours_op | Surgical Hours OP — Obstetrics/Gynecology | or_hours_op_obstetrics_gynecology | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.obgyn.hours_total | Surgical Hours Total — Obstetrics/Gynecology | or_hours_total_obstetrics_gynecology | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.oral_maxillofacial.rooms_ip | OR Rooms IP — Oral/Maxillofacial | or_rooms_ip_oral_maxillofacial | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.oral_maxillofacial.rooms_op | OR Rooms OP — Oral/Maxillofacial | or_rooms_op_oral_maxillofacial | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.oral_maxillofacial.rooms_combined | OR Rooms Combined — Oral/Maxillofacial | or_rooms_combined_oral_maxillofacial | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.oral_maxillofacial.cases_ip | Surgical Cases IP — Oral/Maxillofacial | or_cases_ip_oral_maxillofacial | integer | no |  |  | cases | p.5 | |
| surgery.or_class_c.oral_maxillofacial.cases_op | Surgical Cases OP — Oral/Maxillofacial | or_cases_op_oral_maxillofacial | integer | no |  |  | cases | p.5 | |
| surgery.or_class_c.oral_maxillofacial.hours_ip | Surgical Hours IP — Oral/Maxillofacial | or_hours_ip_oral_maxillofacial | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.oral_maxillofacial.hours_op | Surgical Hours OP — Oral/Maxillofacial | or_hours_op_oral_maxillofacial | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.oral_maxillofacial.hours_total | Surgical Hours Total — Oral/Maxillofacial | or_hours_total_oral_maxillofacial | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.ophthalmology.rooms_ip | OR Rooms IP — Ophthalmology | or_rooms_ip_ophthalmology | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.ophthalmology.rooms_op | OR Rooms OP — Ophthalmology | or_rooms_op_ophthalmology | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.ophthalmology.rooms_combined | OR Rooms Combined — Ophthalmology | or_rooms_combined_ophthalmology | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.ophthalmology.cases_ip | Surgical Cases IP — Ophthalmology | or_cases_ip_ophthalmology | integer | no |  |  | cases | p.5 | |
| surgery.or_class_c.ophthalmology.cases_op | Surgical Cases OP — Ophthalmology | or_cases_op_ophthalmology | integer | no |  |  | cases | p.5 | |
| surgery.or_class_c.ophthalmology.hours_ip | Surgical Hours IP — Ophthalmology | or_hours_ip_ophthalmology | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.ophthalmology.hours_op | Surgical Hours OP — Ophthalmology | or_hours_op_ophthalmology | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.ophthalmology.hours_total | Surgical Hours Total — Ophthalmology | or_hours_total_ophthalmology | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.orthopedic.rooms_ip | OR Rooms IP — Orthopedic | or_rooms_ip_orthopedic | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.orthopedic.rooms_op | OR Rooms OP — Orthopedic | or_rooms_op_orthopedic | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.orthopedic.rooms_combined | OR Rooms Combined — Orthopedic | or_rooms_combined_orthopedic | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.orthopedic.cases_ip | Surgical Cases IP — Orthopedic | or_cases_ip_orthopedic | integer | no |  |  | cases | p.5 | |
| surgery.or_class_c.orthopedic.cases_op | Surgical Cases OP — Orthopedic | or_cases_op_orthopedic | integer | no |  |  | cases | p.5 | |
| surgery.or_class_c.orthopedic.hours_ip | Surgical Hours IP — Orthopedic | or_hours_ip_orthopedic | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.orthopedic.hours_op | Surgical Hours OP — Orthopedic | or_hours_op_orthopedic | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.orthopedic.hours_total | Surgical Hours Total — Orthopedic | or_hours_total_orthopedic | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.otolaryngology.rooms_ip | OR Rooms IP — Otolaryngology | or_rooms_ip_otolaryngology | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.otolaryngology.rooms_op | OR Rooms OP — Otolaryngology | or_rooms_op_otolaryngology | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.otolaryngology.rooms_combined | OR Rooms Combined — Otolaryngology | or_rooms_combined_otolaryngology | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.otolaryngology.cases_ip | Surgical Cases IP — Otolaryngology | or_cases_ip_otolaryngology | integer | no |  |  | cases | p.5 | |
| surgery.or_class_c.otolaryngology.cases_op | Surgical Cases OP — Otolaryngology | or_cases_op_otolaryngology | integer | no |  |  | cases | p.5 | |
| surgery.or_class_c.otolaryngology.hours_ip | Surgical Hours IP — Otolaryngology | or_hours_ip_otolaryngology | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.otolaryngology.hours_op | Surgical Hours OP — Otolaryngology | or_hours_op_otolaryngology | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.otolaryngology.hours_total | Surgical Hours Total — Otolaryngology | or_hours_total_otolaryngology | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.plastic.rooms_ip | OR Rooms IP — Plastic | or_rooms_ip_plastic | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.plastic.rooms_op | OR Rooms OP — Plastic | or_rooms_op_plastic | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.plastic.rooms_combined | OR Rooms Combined — Plastic | or_rooms_combined_plastic | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.plastic.cases_ip | Surgical Cases IP — Plastic | or_cases_ip_plastic | integer | no |  |  | cases | p.5 | |
| surgery.or_class_c.plastic.cases_op | Surgical Cases OP — Plastic | or_cases_op_plastic | integer | no |  |  | cases | p.5 | |
| surgery.or_class_c.plastic.hours_ip | Surgical Hours IP — Plastic | or_hours_ip_plastic | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.plastic.hours_op | Surgical Hours OP — Plastic | or_hours_op_plastic | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.plastic.hours_total | Surgical Hours Total — Plastic | or_hours_total_plastic | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.podiatry.rooms_ip | OR Rooms IP — Podiatry | or_rooms_ip_podiatry | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.podiatry.rooms_op | OR Rooms OP — Podiatry | or_rooms_op_podiatry | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.podiatry.rooms_combined | OR Rooms Combined — Podiatry | or_rooms_combined_podiatry | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.podiatry.cases_ip | Surgical Cases IP — Podiatry | or_cases_ip_podiatry | integer | no |  |  | cases | p.5 | |
| surgery.or_class_c.podiatry.cases_op | Surgical Cases OP — Podiatry | or_cases_op_podiatry | integer | no |  |  | cases | p.5 | |
| surgery.or_class_c.podiatry.hours_ip | Surgical Hours IP — Podiatry | or_hours_ip_podiatry | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.podiatry.hours_op | Surgical Hours OP — Podiatry | or_hours_op_podiatry | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.podiatry.hours_total | Surgical Hours Total — Podiatry | or_hours_total_podiatry | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.thoracic.rooms_ip | OR Rooms IP — Thoracic | or_rooms_ip_thoracic | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.thoracic.rooms_op | OR Rooms OP — Thoracic | or_rooms_op_thoracic | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.thoracic.rooms_combined | OR Rooms Combined — Thoracic | or_rooms_combined_thoracic | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.thoracic.cases_ip | Surgical Cases IP — Thoracic | or_cases_ip_thoracic | integer | no |  |  | cases | p.5 | |
| surgery.or_class_c.thoracic.cases_op | Surgical Cases OP — Thoracic | or_cases_op_thoracic | integer | no |  |  | cases | p.5 | |
| surgery.or_class_c.thoracic.hours_ip | Surgical Hours IP — Thoracic | or_hours_ip_thoracic | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.thoracic.hours_op | Surgical Hours OP — Thoracic | or_hours_op_thoracic | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.thoracic.hours_total | Surgical Hours Total — Thoracic | or_hours_total_thoracic | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.urology.rooms_ip | OR Rooms IP — Urology | or_rooms_ip_urology | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.urology.rooms_op | OR Rooms OP — Urology | or_rooms_op_urology | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.urology.rooms_combined | OR Rooms Combined — Urology | or_rooms_combined_urology | integer | no |  |  | rooms | p.5 | |
| surgery.or_class_c.urology.cases_ip | Surgical Cases IP — Urology | or_cases_ip_urology | integer | no |  |  | cases | p.5 | |
| surgery.or_class_c.urology.cases_op | Surgical Cases OP — Urology | or_cases_op_urology | integer | no |  |  | cases | p.5 | |
| surgery.or_class_c.urology.hours_ip | Surgical Hours IP — Urology | or_hours_ip_urology | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.urology.hours_op | Surgical Hours OP — Urology | or_hours_op_urology | integer | no |  |  | hours | p.5 | |
| surgery.or_class_c.urology.hours_total | Surgical Hours Total — Urology | or_hours_total_urology | integer | no |  |  | hours | p.5 | |
| surgery.class_b.gastro_intestinal.rooms_ip | Class B Rooms IP — Gastro-Intestinal | procB_rooms_ip_gastro_intestinal | integer | no |  |  | rooms | p.6 | |
| surgery.class_b.gastro_intestinal.rooms_op | Class B Rooms OP — Gastro-Intestinal | procB_rooms_op_gastro_intestinal | integer | no |  |  | rooms | p.6 | |
| surgery.class_b.gastro_intestinal.rooms_combined | Class B Rooms Combined — Gastro-Intestinal | procB_rooms_combined_gastro_intestinal | integer | no |  |  | rooms | p.6 | |
| surgery.class_b.gastro_intestinal.rooms_total | Class B Rooms Total — Gastro-Intestinal | procB_rooms_total_gastro_intestinal | integer | no |  |  | rooms | p.6 | |
| surgery.class_b.gastro_intestinal.cases_ip | Class B Cases IP — Gastro-Intestinal | procB_cases_ip_gastro_intestinal | integer | no |  |  | cases | p.6 | |
| surgery.class_b.gastro_intestinal.cases_op | Class B Cases OP — Gastro-Intestinal | procB_cases_op_gastro_intestinal | integer | no |  |  | cases | p.6 | |
| surgery.class_b.gastro_intestinal.hours_ip | Class B Hours IP — Gastro-Intestinal | procB_hours_ip_gastro_intestinal | integer | no |  |  | hours | p.6 | |
| surgery.class_b.gastro_intestinal.hours_op | Class B Hours OP — Gastro-Intestinal | procB_hours_op_gastro_intestinal | integer | no |  |  | hours | p.6 | |
| surgery.class_b.gastro_intestinal.hours_total | Class B Hours Total — Gastro-Intestinal | procB_hours_total_gastro_intestinal | integer | no |  |  | hours | p.6 | |
| surgery.class_b.laser_eye.rooms_ip | Class B Rooms IP — Laser Eye | procB_rooms_ip_laser_eye | integer | no |  |  | rooms | p.6 | |
| surgery.class_b.laser_eye.rooms_op | Class B Rooms OP — Laser Eye | procB_rooms_op_laser_eye | integer | no |  |  | rooms | p.6 | |
| surgery.class_b.laser_eye.rooms_combined | Class B Rooms Combined — Laser Eye | procB_rooms_combined_laser_eye | integer | no |  |  | rooms | p.6 | |
| surgery.class_b.laser_eye.rooms_total | Class B Rooms Total — Laser Eye | procB_rooms_total_laser_eye | integer | no |  |  | rooms | p.6 | |
| surgery.class_b.laser_eye.cases_ip | Class B Cases IP — Laser Eye | procB_cases_ip_laser_eye | integer | no |  |  | cases | p.6 | |
| surgery.class_b.laser_eye.cases_op | Class B Cases OP — Laser Eye | procB_cases_op_laser_eye | integer | no |  |  | cases | p.6 | |
| surgery.class_b.laser_eye.hours_ip | Class B Hours IP — Laser Eye | procB_hours_ip_laser_eye | integer | no |  |  | hours | p.6 | |
| surgery.class_b.laser_eye.hours_op | Class B Hours OP — Laser Eye | procB_hours_op_laser_eye | integer | no |  |  | hours | p.6 | |
| surgery.class_b.laser_eye.hours_total | Class B Hours Total — Laser Eye | procB_hours_total_laser_eye | integer | no |  |  | hours | p.6 | |
| surgery.class_b.cystoscopy.rooms_ip | Class B Rooms IP — Cystoscopy | procB_rooms_ip_cystoscopy | integer | no |  |  | rooms | p.6 | |
| surgery.class_b.cystoscopy.rooms_op | Class B Rooms OP — Cystoscopy | procB_rooms_op_cystoscopy | integer | no |  |  | rooms | p.6 | |
| surgery.class_b.cystoscopy.rooms_combined | Class B Rooms Combined — Cystoscopy | procB_rooms_combined_cystoscopy | integer | no |  |  | rooms | p.6 | |
| surgery.class_b.cystoscopy.rooms_total | Class B Rooms Total — Cystoscopy | procB_rooms_total_cystoscopy | integer | no |  |  | rooms | p.6 | |
| surgery.class_b.cystoscopy.cases_ip | Class B Cases IP — Cystoscopy | procB_cases_ip_cystoscopy | integer | no |  |  | cases | p.6 | |
| surgery.class_b.cystoscopy.cases_op | Class B Cases OP — Cystoscopy | procB_cases_op_cystoscopy | integer | no |  |  | cases | p.6 | |
| surgery.class_b.cystoscopy.hours_ip | Class B Hours IP — Cystoscopy | procB_hours_ip_cystoscopy | integer | no |  |  | hours | p.6 | |
| surgery.class_b.cystoscopy.hours_op | Class B Hours OP — Cystoscopy | procB_hours_op_cystoscopy | integer | no |  |  | hours | p.6 | |
| surgery.class_b.cystoscopy.hours_total | Class B Hours Total — Cystoscopy | procB_hours_total_cystoscopy | integer | no |  |  | hours | p.6 | |
| surgery.class_b.pain_management.rooms_ip | Class B Rooms IP — Pain Management | procB_rooms_ip_pain_management | integer | no |  |  | rooms | p.6 | |
| surgery.class_b.pain_management.rooms_op | Class B Rooms OP — Pain Management | procB_rooms_op_pain_management | integer | no |  |  | rooms | p.6 | |
| surgery.class_b.pain_management.rooms_combined | Class B Rooms Combined — Pain Management | procB_rooms_combined_pain_management | integer | no |  |  | rooms | p.6 | |
| surgery.class_b.pain_management.rooms_total | Class B Rooms Total — Pain Management | procB_rooms_total_pain_management | integer | no |  |  | rooms | p.6 | |
| surgery.class_b.pain_management.cases_ip | Class B Cases IP — Pain Management | procB_cases_ip_pain_management | integer | no |  |  | cases | p.6 | |
| surgery.class_b.pain_management.cases_op | Class B Cases OP — Pain Management | procB_cases_op_pain_management | integer | no |  |  | cases | p.6 | |
| surgery.class_b.pain_management.hours_ip | Class B Hours IP — Pain Management | procB_hours_ip_pain_management | integer | no |  |  | hours | p.6 | |
| surgery.class_b.pain_management.hours_op | Class B Hours OP — Pain Management | procB_hours_op_pain_management | integer | no |  |  | hours | p.6 | |
| surgery.class_b.pain_management.hours_total | Class B Hours Total — Pain Management | procB_hours_total_pain_management | integer | no |  |  | hours | p.6 | |
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
