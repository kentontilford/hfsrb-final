PY=python3

.PHONY: schemas ingestion-schemas data csv normalize variants mappings validate validate-ingestion all publish publish-pdf profiles profiles-all profiles-pdf profiles-puppeteer profiles-puppeteer-all dashboard-data site site-pdf build-info

# Emit build metadata consumed by the dashboard at runtime
build-info:
	@mkdir -p web
	@echo "{\"version\":\"v10\",\"sha\":\"$$(git rev-parse --short HEAD 2>/dev/null || echo unknown)\",\"full_sha\":\"$$(git rev-parse HEAD 2>/dev/null || echo unknown)\",\"built_at\":\"$$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > web/build.json

schemas:
	$(PY) scripts/generate_schemas.py

ingestion-schemas: schemas
	$(PY) scripts/generate_ingestion_schemas.py

data:
	$(PY) scripts/setup_data_dirs.py
	@# Optionally create ASTC/ESRD dirs from current XLSX lists for a specific YEAR
	@if [ -n "$(YEAR)" ]; then \
	  if [ -f ASTC.xlsx ] || [ -f ESRD.xlsx ]; then \
	    echo "Using current ASTC/ESRD lists to ensure data/$(YEAR)/{ASTC,ESRD} folders"; \
	    $(PY) scripts/setup_data_dirs_from_xlsx.py --year $(YEAR); \
	  else \
	    echo "ASTC.xlsx/ESRD.xlsx not found; skipping XLSX-based directories"; \
	  fi; \
	else \
	  echo "Hint: set YEAR to also build ASTC/ESRD from XLSX, e.g. 'make data YEAR=2024'"; \
	fi

# Build ASTC/ESRD directories from XLSX (requires ASTC.xlsx and ESRD.xlsx in repo root)
data-xlsx:
	@if [ -z "$(YEAR)" ]; then echo "Please set YEAR, e.g.: make data-xlsx YEAR=2023"; exit 1; fi
	$(PY) scripts/setup_data_dirs_from_xlsx.py --year $(YEAR)

csv:
	$(PY) scripts/csv_to_facility_json.py

normalize:
	$(PY) scripts/normalize_hospital_ids.py
	$(PY) scripts/set_hospital_variant.py
	$(PY) scripts/set_ltc_variant.py
	$(PY) scripts/normalize_astc_enums.py
	$(PY) scripts/normalize_common_fields.py

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

publish: build-info dashboard-data profiles-all
	@mkdir -p out/site
	@cp -r web/* out/site/
	@cp -r data out/site/
	@mkdir -p out/site/schemas/json && cp -r schemas/json/*.schema.json out/site/schemas/json/
	@mkdir -p out/site/out
	@if [ -d out/profiles ]; then cp -r out/profiles out/site/out/; fi
	@if [ -f CNAME ]; then cp CNAME out/site/; fi
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


dashboard-data: mappings
	$(PY) scripts/build_dashboard_index.py

# Convenience umbrella target for full build + publish
site: publish

# Build + publish with PDFs via Puppeteer (requires Node deps installed)
publish-pdf: build-info dashboard-data profiles-puppeteer-all
	@mkdir -p out/site
	@cp -r web/* out/site/
	@cp -r data out/site/
	@mkdir -p out/site/schemas/json && cp -r schemas/json/*.schema.json out/site/schemas/json/
	@mkdir -p out/site/out
	@if [ -d out/profiles ]; then cp -r out/profiles out/site/out/; fi
	@if [ -f CNAME ]; then cp CNAME out/site/; fi
	@echo "Site prepared under out/site with PDFs (if generated)."

site-pdf: publish-pdf
geo:
	$(PY) scripts/build_hsa_hpa_geo.py

geo-counties:
	bash scripts/fetch_il_counties.sh

geo-csv:
	$(PY) scripts/generate_hsa_hpa_csv_from_geojson.py

geo-chicago:
	bash scripts/fetch_chicago_community_areas.sh
