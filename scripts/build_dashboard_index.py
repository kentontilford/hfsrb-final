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
                # Curated numeric metrics for NL query (optional per type)
                def to_num(v):
                    try:
                        s = str(v)
                        s = ''.join(ch for ch in s if (ch.isdigit() or ch in '.-'))
                        if not s:
                            return None
                        x = float(s)
                        return int(x) if x.is_integer() else x
                    except Exception:
                        return None
                def first_num(keys):
                    for k in keys:
                        if k in payload and payload[k] not in (None, ''):
                            n = to_num(payload.get(k))
                            if n is not None:
                                return n
                    return None
                def sum_prefix(prefix):
                    total = 0
                    found = False
                    for k, v in (payload or {}).items():
                        if isinstance(k, str) and k.startswith(prefix) and v not in (None, ''):
                            n = to_num(v)
                            if n is not None:
                                total += n
                                found = True
                    return total if found else None
                metrics = {}
                if ftype == 'Hospital':
                    metrics['ms_beds'] = first_num(['ms_beds_10_1_23','med_surg_beds_oct1'])
                    metrics['icu_beds'] = first_num(['total_icu_beds_10_1_23','icu_beds_oct1'])
                    metrics['op_visits_total'] = first_num(['op_visits_total'])
                    # Aggregate OR rooms across ip/op/combined
                    or_rooms = sum_prefix('or_rooms_')
                    if or_rooms is not None:
                        metrics['or_rooms_total'] = or_rooms
                    # Aggregate OR cases across ip/op and class B where available
                    or_cases = 0; found_cases = False
                    for key in ['or_cases_ip','or_cases_op','procB_cases_ip','procB_cases_op']:
                        n = to_num(payload.get(key))
                        if n is not None:
                            or_cases += n; found_cases = True
                    if found_cases:
                        metrics['or_cases_total'] = or_cases
                    # Separate class C vs class B cases if available
                    oc = 0; ocf=False
                    for key in ['or_cases_ip','or_cases_op']:
                        n = to_num(payload.get(key))
                        if n is not None: oc += n; ocf=True
                    if ocf: metrics['or_cases_class_c'] = oc
                    ob = 0; obf=False
                    for key in ['procB_cases_ip','procB_cases_op']:
                        n = to_num(payload.get(key))
                        if n is not None: ob += n; obf=True
                    if obf: metrics['or_cases_class_b'] = ob
                    # ED visits if present (best-effort)
                    metrics['ed_visits'] = first_num(['ed_visits','er_visits','ed_total_visits'])
                    # Inpatient payer counts
                    metrics['pay_medicare'] = first_num(['pay_inp_medicare'])
                    metrics['pay_medicaid'] = first_num(['pay_inp_medicaid'])
                    metrics['pay_private_ins'] = first_num(['pay_inp_private_ins'])
                    metrics['pay_other_public'] = first_num(['pay_inp_other_public'])
                    metrics['pay_private_pay'] = first_num(['pay_inp_private_pay'])
                elif ftype == 'ESRD':
                    metrics['stations_setup'] = first_num(['stations_oct_setup_staffed'])
                    metrics['fte_total'] = first_num(['fte_total'])
                elif ftype == 'ASTC':
                    metrics['or_rooms_class_c'] = first_num(['rooms_or_class_c'])
                    metrics['rooms_exam'] = first_num(['rooms_exam'])
                    metrics['fte_total'] = first_num(['fte_total'])
                elif ftype == 'LTC':
                    metrics['beds_licensed_idd'] = first_num(['beds_licensed_idd'])
                    metrics['days_total_idd'] = first_num(['days_total_idd'])

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
                    'metrics': metrics,
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
