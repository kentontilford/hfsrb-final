#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict, Tuple

try:
    import jsonschema  # for optional validation
except Exception:
    jsonschema = None

MAPPINGS_DIR = Path('mappings')


def load_mapping(ftype: str, year: int) -> Dict:
    name = None
    # Prefer exact year mapping, else generic by type
    candidates = [
        f"{ftype.lower()}_{year}.json",
        f"{ftype.lower()}.json",
    ]
    for c in candidates:
        p = MAPPINGS_DIR / c
        if p.exists():
            return json.loads(p.read_text(encoding='utf-8'))
    raise SystemExit(f"No mapping found for {ftype} {year} in {MAPPINGS_DIR}")


def pick_hospital_schema_variant(meta: Dict, mapping_schema: str) -> Path:
    # mapping_schema can contain '|' separated schema paths for hospital variants
    parts = [s.strip() for s in mapping_schema.split('|')]
    variant = meta.get('ahq_variant')
    if not variant:
        # default to short
        target = 'ahq-short.schema.json'
    else:
        target = 'ahq-long.schema.json' if variant == 'ahq-long' else 'ahq-short.schema.json'
    for p in parts:
        if p.endswith(target):
            return Path(p)
    # Fallback to first
    return Path(parts[0])


def build_payload(fields: Dict[str, str], mapping: Dict, schema_props: Dict[str, dict]) -> Tuple[Dict, Dict]:
    out: Dict = {}
    used = {}
    direct = mapping.get('direct', {})
    # Direct 1:1 mapping
    for src, dst in direct.items():
        if src in fields and dst in schema_props:
            out[dst] = fields[src]
            used[src] = dst

    # Constants
    for k, v in mapping.get('const', {}).items():
        if k in schema_props:
            out[k] = v

    return out, used


def validate_payload(payload: Dict, schema_path: Path) -> None:
    if not jsonschema:
        print("jsonschema not installed; skipping validation.")
        return
    schema = json.loads(Path(schema_path).read_text(encoding='utf-8'))
    jsonschema.validate(instance=payload, schema=schema)


def main():
    ap = argparse.ArgumentParser(description='Apply column->schema mappings to per-facility data.json files')
    ap.add_argument('--year', type=int, choices=range(2008, 2025), help='Specific year to process')
    ap.add_argument('--type', choices=['Hospital', 'ASTC', 'ESRD', 'LTC'], help='Specific facility type to process')
    ap.add_argument('--validate', action='store_true', help='Validate payloads against JSON Schema (requires jsonschema)')
    args = ap.parse_args()

    years = [args.year] if args.year else list(range(2008, 2025))
    types = [args.type] if args.type else ['Hospital', 'ASTC', 'ESRD', 'LTC']

    for year in years:
        for ftype in types:
            base = Path('data') / str(year) / ftype
            if not base.exists():
                continue
            # Load mapping for this type/year if available
            try:
                mapping = load_mapping(ftype, year)
            except SystemExit as e:
                # Skip if no mapping for this combo
                print(f"{e}. Skipping {ftype} {year}.")
                continue

            for fac_dir in sorted(base.iterdir()):
                if not fac_dir.is_dir():
                    continue
                data_path = fac_dir / 'data.json'
                if not data_path.exists():
                    continue
                doc = json.loads(data_path.read_text(encoding='utf-8'))
                fields = doc.get('fields', {})
                meta = doc.get('meta', {})

                # Determine schema path
                schema_spec = mapping.get('schema')
                if not schema_spec:
                    print(f"No schema specified in mapping for {ftype} {year}.")
                    continue
                if ftype == 'Hospital':
                    schema_path = pick_hospital_schema_variant(meta, schema_spec)
                else:
                    schema_path = Path(schema_spec)
                schema = json.loads(Path(schema_path).read_text(encoding='utf-8'))
                schema_props = schema.get('properties', {})

                payload, used = build_payload(fields, mapping, schema_props)
                out_doc = {
                    'meta': meta,
                    'payload': payload,
                    'unmapped_fields': sorted([k for k in fields.keys() if k not in used]),
                    'schema': str(schema_path)
                }
                out_path = fac_dir / 'schema_payload.json'
                out_path.write_text(json.dumps(out_doc, indent=2, ensure_ascii=False) + "\n", encoding='utf-8')

                if args.validate:
                    try:
                        validate_payload(payload, schema_path)
                    except Exception as e:
                        print(f"Validation failed for {fac_dir}: {e}")
                    else:
                        pass

            print(f"Processed mappings for {ftype} {year}")


if __name__ == '__main__':
    main()

