#!/usr/bin/env python3
"""
Build HSA/HPA GeoJSON overlays from an HTML reference and a base counties GeoJSON.

Inputs (defaults):
- references/HSA_HPA_facilities_with_maps.html — text contains HSA/HPA → counties mapping
- hfsrb-ui/public/geo/counties.il.geojson — base counties polygons

Outputs:
- hfsrb-ui/public/geo/hsa.geojson
- hfsrb-ui/public/geo/hpa.geojson

Notes:
- This uses naive HTML-to-text stripping and heuristics to parse mappings.
- It assigns properties to counties and emits one combined GeoJSON with all county features annotated.
- Leaflet overlay loads the entire GeoJSON; it does not dissolve polygons by code (no geometry libs required).
"""
from __future__ import annotations
import argparse
import csv
import json
import re
from pathlib import Path
from typing import Dict, List, Tuple, Any

ROOT = Path(__file__).resolve().parent.parent


def read_text_strip_html(path: Path) -> str:
    t = path.read_text(encoding='utf-8', errors='ignore')
    # Remove scripts/styles
    t = re.sub(r'<script[\s\S]*?</script>', ' ', t, flags=re.I)
    t = re.sub(r'<style[\s\S]*?</style>', ' ', t, flags=re.I)
    # Replace tags with space
    t = re.sub(r'<[^>]+>', ' ', t)
    # Collapse whitespace
    t = re.sub(r'\s+', ' ', t)
    return t


def parse_mapping_from_text(txt: str) -> Tuple[Dict[str, List[str]], Dict[str, List[str]]]:
    """
    Attempt to parse constructs like:
      HSA 1: Adams, Alexander, Bond, ...
      HPA A-01: X County, Y County, ...
    Returns (hsa_map, hpa_map) where values are lists of county names.
    """
    hsa_map: Dict[str, List[str]] = {}
    hpa_map: Dict[str, List[str]] = {}

    # Split by sentinel markers; fallback to regex searches
    # Extract HSA blocks
    for m in re.finditer(r'(HSA\s+(\d{1,2}))\s*[:\-]\s*([^H]+?)(?=HSA\s+\d{1,2}|HPA\s+[A-Z]-\d{2}|$)', txt, flags=re.I):
        code = m.group(2)
        body = m.group(3)
        counties = [c.strip().rstrip('.') for c in re.split(r'[;,]', body) if c.strip()]
        # Filter out obvious non-county words
        counties = [c for c in counties if len(c) >= 3]
        if counties:
            hsa_map[code] = counties

    # Extract HPA blocks if they are formatted like "HPA X-YY: counties..." (rare)
    for m in re.finditer(r'(HPA\s+([A-Z]-\d{2}))\s*[:\-]\s*([^H]+?)(?=HSA\s+\d{1,2}|HPA\s+[A-Z]-\d{2}|$)', txt, flags=re.I):
        code = m.group(2).upper()
        body = m.group(3)
        counties = [c.strip().rstrip('.') for c in re.split(r'[;,]', body) if c.strip()]
        counties = [c for c in counties if len(c) >= 3]
        if counties:
            hpa_map[code] = counties

    return hsa_map, hpa_map


def norm_county_name(s: str) -> str:
    s = s.strip().lower()
    # Remove trailing 'county' word
    s = re.sub(r'\bcounty\b', '', s)
    # Remove punctuation/extra spaces
    s = re.sub(r'[^a-z]+', '', s)
    return s


def detect_county_name_key(props: dict) -> str | None:
    for k in props.keys():
        lk = k.lower()
        if lk in ('name', 'county', 'county_nam', 'county_name'):
            return k
    # Fallback: first property containing 'name'
    for k in props.keys():
        if 'name' in k.lower():
            return k
    return None


def annotate_counties(base_geo: dict, hsa_map: Dict[str, List[str]], hpa_map: Dict[str, List[str]]) -> Tuple[dict, dict]:
    features = base_geo.get('features') or []
    if not features:
        raise ValueError('Base counties GeoJSON has no features')
    name_key = detect_county_name_key(features[0].get('properties', {}))
    if not name_key:
        raise ValueError('Unable to detect county name property in base GeoJSON')

    # Build lookup for county name -> indices
    county_index: Dict[str, List[int]] = {}
    for idx, f in enumerate(features):
        nm = f.get('properties', {}).get(name_key)
        if not isinstance(nm, str):
            continue
        key = norm_county_name(nm)
        county_index.setdefault(key, []).append(idx)

    def map_codes(code_to_counties: Dict[str, List[str]], code_prop: str) -> dict:
        # Copy base and annotate with code if matches
        out = {"type": "FeatureCollection", "features": []}
        for code, counties in code_to_counties.items():
            for cname in counties:
                key = norm_county_name(cname)
                idxs = county_index.get(key, [])
                if not idxs:
                    continue
                for i in idxs:
                    f = features[i]
                    g = {"type": f["type"], "geometry": f.get("geometry"), "properties": dict(f.get("properties", {}))}
                    g["properties"][code_prop] = code
                    out["features"].append(g)
        return out

    hsa_geo = map_codes(hsa_map, 'HSA')
    hpa_geo = map_codes(hpa_map, 'HPA')
    return hsa_geo, hpa_geo


def parse_hpa_chicago_from_text(txt: str) -> Dict[str, List[Dict[str, Any]]]:
    """Parse Chicago Community Areas lists under HPA sections.
    Looks for "HPA A-01" followed near by "Community Areas of <Name> (n), ...".
    Returns mapping: HPA code -> list of {name: str, num: int|None}.
    """
    out: Dict[str, List[Dict[str, Any]]] = {}
    # Find all HPA headers with a trailing window of text
    for m in re.finditer(r'HPA\s+([A-Z]-\d{2})', txt, flags=re.I):
        code = m.group(1).upper()
        start = m.end()
        window = txt[start:start+2000]
        m2 = re.search(r'Community Areas of\s+(.+?)[\.;]', window, flags=re.I)
        if not m2:
            continue
        body = m2.group(1)
        items = []
        for part in re.split(r',', body):
            part = part.strip()
            if not part:
                continue
            m3 = re.match(r"(.+?)\s*\((\d{1,3})\)$", part)
            if m3:
                name = m3.group(1).strip()
                num = int(m3.group(2))
            else:
                name = part
                num = None
            items.append({'name': name, 'num': num})
        if items:
            out[code] = items
    return out


def load_chicago_community_areas(path: Path):
    data = json.loads(path.read_text(encoding='utf-8'))
    feats = data.get('features') or []
    if not feats:
        raise SystemExit('No features in Chicago community areas GeoJSON')
    # detect name and number keys
    props = feats[0].get('properties', {})
    name_key = None
    num_key = None
    for k in props.keys():
        lk = k.lower()
        if lk in ('community', 'community_name', 'name', 'community area name'.lower()):
            name_key = k
        if 'area_num' in lk or lk in ('area_numbe', 'area_num_1', 'area_number'):
            num_key = k
    if not name_key:
        for k in props.keys():
            if 'name' in k.lower():
                name_key = k
                break
    return feats, name_key, num_key


def annotate_chicago_hpa(ca_geo_path: Path, hpa_ca_map: Dict[str, List[Dict[str, Any]]]) -> dict:
    feats, name_key, num_key = load_chicago_community_areas(ca_geo_path)
    # build indexes by lowercased name and by number
    by_name: Dict[str, List[int]] = {}
    by_num: Dict[int, List[int]] = {}
    for idx, f in enumerate(feats):
        props = f.get('properties', {})
        nm = str(props.get(name_key, '')).strip()
        if nm:
            by_name.setdefault(nm.lower(), []).append(idx)
        if num_key:
            try:
                n = int(str(props.get(num_key)).strip())
                by_num.setdefault(n, []).append(idx)
            except Exception:
                pass
    out = {"type": "FeatureCollection", "features": []}
    for code, items in hpa_ca_map.items():
        for it in items:
            nm = str(it.get('name', '')).strip().lower()
            num = it.get('num')
            idxs = []
            if num is not None and num in by_num:
                idxs = by_num[num]
            elif nm and nm in by_name:
                idxs = by_name[nm]
            for i in idxs:
                f = feats[i]
                g = {"type": f["type"], "geometry": f.get("geometry"), "properties": dict(f.get("properties", {}))}
                g["properties"]["HPA"] = code
                out["features"].append(g)
    return out


def load_csv_map(path: Path, code_key: str) -> Dict[str, List[str]]:
    """Parse CSV with headers: county,<code_key> (e.g., county,hsa)
    Returns dict mapping code -> list[county]."""
    if not path.exists():
        return {}
    out: Dict[str, List[str]] = {}
    with path.open('r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            county = (row.get('county') or '').strip()
            code = (row.get(code_key) or '').strip()
            if not county or not code:
                continue
            out.setdefault(code, []).append(county)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--html', default=str(ROOT / 'references' / 'HSA_HPA_facilities_with_maps.html'))
    ap.add_argument('--counties', default=str(ROOT / 'hfsrb-ui' / 'public' / 'geo' / 'counties.il.geojson'))
    ap.add_argument('--hsa_csv', default=str(ROOT / 'references' / 'hsa_county_map.csv'))
    ap.add_argument('--hpa_csv', default=str(ROOT / 'references' / 'hpa_county_map.csv'))
    ap.add_argument('--chicago_ca', default=str(ROOT / 'hfsrb-ui' / 'public' / 'geo' / 'chicago_community_areas.geojson'))
    ap.add_argument('--outdir', default=str(ROOT / 'hfsrb-ui' / 'public' / 'geo'))
    args = ap.parse_args()

    html_path = Path(args.html)
    counties_path = Path(args.counties)
    chicago_ca_path = Path(args.chicago_ca)
    outdir = Path(args.outdir)
    outdir.mkdir(parents=True, exist_ok=True)

    if not html_path.exists():
        raise SystemExit(f"Missing HTML: {html_path}")
    if not counties_path.exists():
        raise SystemExit(f"Missing counties GeoJSON: {counties_path}")

    # Prefer CSV mappings if present
    hsa_map = load_csv_map(Path(args.hsa_csv), 'hsa')
    hpa_map = load_csv_map(Path(args.hpa_csv), 'hpa')
    txt = read_text_strip_html(html_path)
    # Parse any HSA/HPA county lists directly (rare)
    hsa_map2, hpa_map2 = parse_mapping_from_text(txt)
    # Merge parsed county lists into CSV maps
    for k, v in hsa_map2.items():
        hsa_map.setdefault(k, v)
    for k, v in hpa_map2.items():
        hpa_map.setdefault(k, v)

    # Parse Chicago community area lists under HPAs
    hpa_ca_map = parse_hpa_chicago_from_text(txt) if chicago_ca_path.exists() else {}
    if not (hsa_map or hpa_map or hpa_ca_map):
        raise SystemExit("No HSA/HPA mappings found: provide CSVs or HTML with county/community lists.")

    base_geo = json.loads(counties_path.read_text(encoding='utf-8'))
    hsa_geo, hpa_geo_counties = annotate_counties(base_geo, hsa_map, hpa_map)
    # If we have Chicago community area mapping, annotate and merge into HPA
    if hpa_ca_map and chicago_ca_path.exists():
        try:
            hpa_geo_chi = annotate_chicago_hpa(chicago_ca_path, hpa_ca_map)
            merged = {"type": "FeatureCollection", "features": []}
            merged["features"].extend(hpa_geo_counties.get("features", []))
            merged["features"].extend(hpa_geo_chi.get("features", []))
            hpa_geo = merged
        except Exception as e:
            print(f"Warning: failed to annotate Chicago community areas: {e}")
            hpa_geo = hpa_geo_counties
    else:
        hpa_geo = hpa_geo_counties

    (outdir / 'hsa.geojson').write_text(json.dumps(hsa_geo), encoding='utf-8')
    (outdir / 'hpa.geojson').write_text(json.dumps(hpa_geo), encoding='utf-8')
    print(f"Wrote overlays: {outdir / 'hsa.geojson'} and {outdir / 'hpa.geojson'}")

if __name__ == '__main__':
    main()
