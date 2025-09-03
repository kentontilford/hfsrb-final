#!/usr/bin/env python3
"""
Build a lightweight index for the public dashboard.

Writes: web/data/index.json with one record per facility containing:
  - year, type, slug, name
  - city, zip, county, region, variant
  - relative path to data JSON (schema_payload)

Also writes: web/data/summary.json rollups by county and region.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, Any

DATA = Path('data')
OUT = Path('web/data')


def load_json(p: Path) -> Dict[str, Any]:
    return json.loads(p.read_text(encoding='utf-8'))


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    rows = []
    summary: Dict[str, Dict[str, Dict[str, Dict[str, int]]]] = {}
    for year_dir in sorted(DATA.iterdir()):
        if not year_dir.is_dir() or not year_dir.name.isdigit():
            continue
        year = int(year_dir.name)
        for ftype in ['Hospital', 'ESRD', 'ASTC', 'LTC']:
            base = year_dir / ftype
            if not base.exists():
                continue
            for fac_dir in sorted(base.iterdir()):
                if not fac_dir.is_dir():
                    continue
                sp = fac_dir / 'schema_payload.json'
                if not sp.exists():
                    continue
                try:
                    doc = load_json(sp)
                except Exception:
                    continue
                meta = doc.get('meta', {})
                payload = doc.get('payload', {})
                # Try reading original fields for additional metadata
                fields = {}
                dj = fac_dir / 'data.json'
                try:
                    if dj.exists():
                        d0 = load_json(dj)
                        fields = d0.get('fields', {}) or {}
                except Exception:
                    fields = {}
                name = meta.get('facility_name') or payload.get('facility_name') or fac_dir.name
                city = payload.get('address_city') or payload.get('facility_city') or ''
                zipc = payload.get('address_zip') or payload.get('facility_zip') or ''
                variant = meta.get('ahq_variant') or meta.get('ltc_variant') or ''
                county = payload.get('county') or fields.get('county') or ''
                # Region/HSA if available
                region = (
                    payload.get('hsa')
                    or fields.get('hsa')
                    or fields.get('health_service_area')
                    or ''
                )
                rows.append({
                    'year': year,
                    'type': ftype,
                    'slug': fac_dir.name,
                    'name': name,
                    'city': city,
                    'zip': zipc,
                    'county': county,
                    'region': region,
                    'variant': variant,
                    'data_path': str(sp),
                })
                # Build summary rollups
                ykey = str(year)
                tkey = ftype
                summary.setdefault(ykey, {}).setdefault(tkey, {})
                bucket = summary[ykey][tkey]
                # Totals
                bucket['totals'] = bucket.get('totals', 0) + 1
                # By county
                bc = bucket.setdefault('by_county', {})
                if county:
                    bc[county] = bc.get(county, 0) + 1
                # By region
                br = bucket.setdefault('by_region', {})
                if region:
                    br[region] = br.get(region, 0) + 1
    (OUT / 'index.json').write_text(json.dumps(rows, indent=2), encoding='utf-8')
    (OUT / 'summary.json').write_text(json.dumps(summary, indent=2), encoding='utf-8')
    print(f"Wrote {len(rows)} facilities to {OUT/'index.json'} and rollups to {OUT/'summary.json'}")


if __name__ == '__main__':
    main()

