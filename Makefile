PY=python3

.PHONY: schemas ingestion-schemas data csv normalize variants mappings validate validate-ingestion all

schemas:
	$(PY) scripts/generate_schemas.py

ingestion-schemas: schemas
	$(PY) scripts/generate_ingestion_schemas.py

data:
	$(PY) scripts/setup_data_dirs.py

csv:
	$(PY) scripts/csv_to_facility_json.py

normalize:
	$(PY) scripts/normalize_hospital_ids.py
	$(PY) scripts/set_hospital_variant.py
	$(PY) scripts/set_ltc_variant.py

mappings: ingestion-schemas
	$(PY) scripts/apply_mappings.py --year 2024 --type Hospital --validate --ingestion
	$(PY) scripts/apply_mappings.py --year 2023 --type Hospital --validate --ingestion
	$(PY) scripts/apply_mappings.py --year 2023 --type ESRD --validate --ingestion
	$(PY) scripts/apply_mappings.py --year 2023 --type ASTC --validate --ingestion
	$(PY) scripts/apply_mappings.py --year 2023 --type LTC --validate --ingestion

validate: mappings

validate-ingestion: mappings

all: schemas data csv normalize mappings

