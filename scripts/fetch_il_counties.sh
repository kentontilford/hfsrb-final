#!/usr/bin/env bash
set -euo pipefail

# Downloads Census US counties shapefile and builds Illinois-only GeoJSON using mapshaper.
# Output: hfsrb-ui/public/geo/counties.il.geojson

URL="https://www2.census.gov/geo/tiger/GENZ2023/shp/cb_2023_us_county_5m.zip"
OUT_REL="hfsrb-ui/public/geo/counties.il.geojson"
PROJECT_DIR="$(pwd)"
OUT="${PROJECT_DIR}/${OUT_REL}"
WORKDIR="${PROJECT_DIR}/.tmp_counties"

echo "Preparing work dir: $WORKDIR"
rm -rf "$WORKDIR" && mkdir -p "$WORKDIR"
pushd "$WORKDIR" >/dev/null

echo "Downloading US counties shapefile (5m)..."
curl -fL "$URL" -o counties.zip

echo "Unzipping..."
unzip -q counties.zip

SHP="cb_2023_us_county_5m.shp"
if [ ! -f "$SHP" ]; then
  echo "Error: expected $SHP after unzip" >&2
  exit 2
fi

echo "Filtering to Illinois (STATEFP=17) and exporting GeoJSON via mapshaper..."
# Use npx to avoid global install
npx --yes mapshaper "$SHP" -filter 'STATEFP=="17"' -rename-fields name=NAME -o format=geojson "$OUT"

popd >/dev/null
rm -rf "$WORKDIR"

echo "Wrote $OUT"
