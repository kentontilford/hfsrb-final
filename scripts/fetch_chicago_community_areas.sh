#!/usr/bin/env bash
set -euo pipefail

# Downloads Chicago Community Areas GeoJSON and writes to hfsrb-ui/public/geo/chicago_community_areas.geojson
# Source: City of Chicago Data Portal (Socrata). Using export endpoint to avoid API tokens.

URL="https://data.cityofchicago.org/api/geospatial/cauq-8yn6?method=export&format=GeoJSON"
OUT="hfsrb-ui/public/geo/chicago_community_areas.geojson"

mkdir -p "$(dirname "$OUT")"
echo "Downloading Chicago Community Areas..."
curl -fL "$URL" -o "$OUT"
echo "Wrote $OUT"

