Place boundary files in this folder to overlay on the map.

Expected filenames:
- hsa.geojson — Illinois Health Service Areas
- hpa.geojson — Illinois Health Planning Areas

Each file should be a valid GeoJSON FeatureCollection with Polygon/MultiPolygon features.
Include a property with the area code (e.g., `HSA` or `HPA`).

