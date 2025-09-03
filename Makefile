PY=python3

.PHONY: schemas ingestion-schemas data csv normalize variants mappings validate validate-ingestion all publish profiles profiles-all profiles-pdf profiles-puppeteer profiles-puppeteer-all dashboard-data

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

validate-strict: schemas
	$(PY) scripts/apply_mappings.py --year 2024 --type Hospital --validate
	$(PY) scripts/apply_mappings.py --year 2023 --type Hospital --validate
	$(PY) scripts/apply_mappings.py --year 2023 --type ESRD --validate
	$(PY) scripts/apply_mappings.py --year 2023 --type ASTC --validate
	$(PY) scripts/apply_mappings.py --year 2023 --type LTC --validate

report-missing:
	$(PY) scripts/report_missing_identity.py

publish: dashboard-data
	@mkdir -p out/site
	@cp -r web/* out/site/
	@cp -r data out/site/
	@mkdir -p out/site/schemas/json && cp -r schemas/json/*.schema.json out/site/schemas/json/
	@mkdir -p out/site/out
	@if [ -d out/profiles ]; then cp -r out/profiles out/site/out/; fi
	@echo "Site prepared under out/site (include data/ and out/profiles if present)."

profiles:
	$(PY) scripts/render_profiles.py --year 2024 --type Hospital --no-pdf

profiles-all:
	$(PY) scripts/render_profiles.py --no-pdf

profiles-pdf:
	$(PY) scripts/render_profiles.py --year 2024 --type Hospital

profiles-puppeteer:
	node scripts/render_profiles_puppeteer.js --year 2024 --type Hospital

profiles-puppeteer-all:
	for y in 2024 2023; do \
	  for t in Hospital ESRD ASTC LTC; do \
	    $(PY) scripts/render_profiles.py --year $$y --type $$t --no-pdf; \
	    node scripts/render_profiles_puppeteer.js --year $$y --type $$t; \
	  done; \
	done


dashboard-data:
	$(PY) scripts/build_dashboard_index.py
