#!/usr/bin/env python3
"""
Generate or update HSA/HPA county mapping CSVs from the counties GeoJSON.

Inputs:
- hfsrb-ui/public/geo/counties.il.geojson
- references/hsa_county_map.csv (optional; preserved/augmented)
- references/hpa_county_map.csv (optional; preserved/augmented)

Outputs:
- references/hsa_county_map.csv (all counties listed; existing codes preserved)
- references/hpa_county_map.csv (all counties listed; existing codes preserved)
"""
from __future__ import annotations
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
COUNTIES = ROOT / 'hfsrb-ui' / 'public' / 'geo' / 'counties.il.geojson'
HSA_CSV = ROOT / 'references' / 'hsa_county_map.csv'
HPA_CSV = ROOT / 'references' / 'hpa_county_map.csv'


def load_geojson(path: Path):
    data = json.loads(path.read_text(encoding='utf-8'))
    feats = data.get('features') or []
    if not feats:
        raise SystemExit('No features in counties GeoJSON')
    # detect county name field
    props = feats[0].get('properties', {})
    name_key = None
    for k in props.keys():
        if k.lower() in ('name', 'county', 'county_name', 'county_nam', 'namelsad'):
            name_key = k
            break
    if name_key is None:
        for k in props.keys():
            if 'name' in k.lower():
                name_key = k
                break
    if name_key is None:
        raise SystemExit('Unable to detect county name property')
    counties = []
    for f in feats:
        nm = f.get('properties', {}).get(name_key)
        if not isinstance(nm, str):
            continue
        # normalize common patterns to single word + County
        if nm.lower().endswith('county'):
            nm2 = nm.rsplit(' ', 1)[0]
        else:
            nm2 = nm
        counties.append(nm2)
    # de-dupe and sort
    counties = sorted(dict.fromkeys(counties))
    return counties


def load_map_csv(path: Path, code_key: str) -> dict[str, str]:
    if not path.exists():
        return {}
    out: dict[str, str] = {}
    with path.open('r', encoding='utf-8') as f:
        r = csv.DictReader(f)
        for row in r:
            c = (row.get('county') or '').strip()
            v = (row.get(code_key) or '').strip()
            if c:
                out[c] = v
    return out


def write_map_csv(path: Path, counties: list[str], existing: dict[str, str], code_key: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=['county', code_key])
        w.writeheader()
        for c in counties:
            w.writerow({'county': c, code_key: existing.get(c, '')})


def main():
    counties = load_geojson(COUNTIES)
    hsa_existing = load_map_csv(HSA_CSV, 'hsa')
    hpa_existing = load_map_csv(HPA_CSV, 'hpa')
    write_map_csv(HSA_CSV, counties, hsa_existing, 'hsa')
    write_map_csv(HPA_CSV, counties, hpa_existing, 'hpa')
    print(f'Wrote {HSA_CSV} and {HPA_CSV} with {len(counties)} counties each')


if __name__ == '__main__':
    main()

