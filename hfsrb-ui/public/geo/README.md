Place boundary files in this folder to overlay on the map.

Expected filenames:
- hsa.geojson — Illinois Health Service Areas
- hpa.geojson — Illinois Health Planning Areas

Each file should be a valid GeoJSON FeatureCollection with Polygon/MultiPolygon features (or county polygon features annotated with `HSA`/`HPA` properties).

Generating overlays from HTML + counties base
- Put your reference file at `references/HSA_HPA_facilities_with_maps.html` (HTML text containing mappings).
- Add a base counties GeoJSON at `hfsrb-ui/public/geo/counties.il.geojson` (Illinois counties; properties should include a `name` or `county` field). You can auto-generate it:
  - `make geo-counties` (downloads Census counties and filters to Illinois using mapshaper)
- Run: `python3 scripts/build_hsa_hpa_geo.py`
  - Outputs: `hfsrb-ui/public/geo/hsa.geojson`, `hfsrb-ui/public/geo/hpa.geojson`

Notes
- The generator annotates county polygons (no geometry dissolve). Leaflet renders a single overlay layer per file.
- If your counties file uses a different property name for county names, the script attempts to detect it automatically.
