#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict, Tuple, List, Optional

try:
    import jsonschema  # for optional validation
except Exception:
    jsonschema = None

MAPPINGS_DIR = Path('mappings')


def load_mapping(ftype: str, year: int, meta: Dict[str, object] | None = None) -> Dict:
    name = None
    # Prefer exact year mapping, else generic by type
    if ftype == 'LTC' and meta:
        variant = meta.get('ltc_variant')
        if isinstance(variant, str):
            candidates = [
                f"{variant}_{year}.json",
                f"{variant}.json",
            ]
        else:
            candidates = [f"ltc_{year}.json", f"ltc.json"]
    else:
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


def build_payload(fields: Dict[str, str], mapping: Dict, schema_props: Dict[str, dict], meta: Dict[str, object]) -> Tuple[Dict, Dict]:
    out: Dict = {}
    used: Dict[str, str] = {}
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

    # Meta passthroughs
    for dst, meta_key in mapping.get('meta', {}).items():
        if dst in schema_props and meta_key in meta:
            out[dst] = meta[meta_key]

    # Derived sums
    def parse_int(val: Optional[str]) -> Optional[int]:
        if val is None:
            return None
        s = str(val).strip()
        if s == '':
            return None
        import re as _re
        s = _re.sub(r'[^0-9\-]', '', s)
        try:
            return int(s)
        except Exception:
            return None

    for dst, src_list in mapping.get('sum', {}).items():
        total = 0
        seen = False
        for src in src_list:
            if src in fields:
                seen = True
                n = parse_int(fields.get(src))
                if n is not None:
                    total += n
                    used[src] = dst
        if seen and dst in schema_props:
            out[dst] = total

    # Arrays from numbered groups
    for arr in mapping.get('arrays', []):
        dest = arr.get('dest')
        count = int(arr.get('count', 0))
        item_spec: Dict[str, str] = arr.get('item', {})
        require_keys: List[str] = arr.get('require', [])
        items: List[Dict[str, str]] = []
        for i in range(1, count + 1):
            obj: Dict[str, str] = {}
            present = False
            for dst_key, src_tpl in item_spec.items():
                src_key = src_tpl.replace('{n}', str(i))
                val = fields.get(src_key)
                if val is not None and str(val).strip() != '':
                    obj[dst_key] = val
                    present = True
                    used[src_key] = f"{dest}[].{dst_key}"
            if not present:
                continue
            # Check required keys have values
            if require_keys and not all(obj.get(k) for k in require_keys):
                continue
            items.append(obj)
        if items and dest:
            out[dest] = items

    # Simple transforms
    for tf in mapping.get('transforms', []):
        src = tf.get('src')
        dst = tf.get('dst')
        op = tf.get('op')
        if not src or not dst or dst not in schema_props:
            continue
        val = fields.get(src)
        if val is None:
            continue
        sval = str(val)
        if op == 'digits':
            import re as _re
            sval = _re.sub(r'\D+', '', sval)
            pad = tf.get('pad')
            if isinstance(pad, int) and pad > 0:
                sval = sval.zfill(pad)
        elif op == 'upper':
            sval = sval.upper()
        elif op == 'lower':
            sval = sval.lower()
        out[dst] = sval
        used[src] = dst

    return out, used


def _strip_required(schema: Dict) -> Dict:
    if isinstance(schema, dict):
        schema.pop('required', None)
        for k, v in list(schema.items()):
            schema[k] = _strip_required(v)
    elif isinstance(schema, list):
        for i in range(len(schema)):
            schema[i] = _strip_required(schema[i])
    return schema


def validate_payload(payload: Dict, schema_path: Path, ingestion: bool = False) -> None:
    if not jsonschema:
        print("jsonschema not installed; skipping validation.")
        return
    schema = json.loads(Path(schema_path).read_text(encoding='utf-8'))
    if ingestion:
        schema = _strip_required(schema)
    jsonschema.validate(instance=payload, schema=schema)


def main():
    ap = argparse.ArgumentParser(description='Apply column->schema mappings to per-facility data.json files')
    ap.add_argument('--year', type=int, choices=range(2008, 2025), help='Specific year to process')
    ap.add_argument('--type', choices=['Hospital', 'ASTC', 'ESRD', 'LTC'], help='Specific facility type to process')
    ap.add_argument('--validate', action='store_true', help='Validate payloads against JSON Schema (requires jsonschema)')
    ap.add_argument('--ingestion', action='store_true', help='In ingestion mode, drop required constraints before validating')
    args = ap.parse_args()

    years = [args.year] if args.year else list(range(2008, 2025))
    types = [args.type] if args.type else ['Hospital', 'ASTC', 'ESRD', 'LTC']

    for year in years:
        for ftype in types:
            base = Path('data') / str(year) / ftype
            if not base.exists():
                continue
            # Load default mapping once (non-LTC); LTC mapping depends on per-facility meta
            mapping_default = None
            if ftype != 'LTC':
                try:
                    mapping_default = load_mapping(ftype, year, None)
                except SystemExit as e:
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
                # Load mapping for LTC per facility
                if ftype == 'LTC':
                    try:
                        mapping = load_mapping(ftype, year, meta)
                    except SystemExit as e:
                        # No mapping for this LTC variant; skip
                        print(f"{e}. Skipping {fac_dir}.")
                        continue
                else:
                    mapping = mapping_default

                # Determine schema path
                schema_spec = mapping.get('schema')
                if not schema_spec:
                    print(f"No schema specified in mapping for {ftype} {year}.")
                    continue
                if ftype == 'Hospital':
                    schema_path = pick_hospital_schema_variant(meta, schema_spec)
                else:
                    schema_path = Path(schema_spec)
                # Prefer prebuilt ingestion schema file if requested
                if args.ingestion:
                    ing_variant = Path('schemas/json_ingestion') / Path(schema_path).name
                    if ing_variant.exists():
                        schema_path = ing_variant
                schema = json.loads(Path(schema_path).read_text(encoding='utf-8'))
                schema_props = schema.get('properties', {})

                payload, used = build_payload(fields, mapping, schema_props, meta)
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
                        validate_payload(payload, schema_path, ingestion=args.ingestion)
                    except Exception as e:
                        print(f"Validation failed for {fac_dir}: {e}")
                    else:
                        pass

            print(f"Processed mappings for {ftype} {year}")


if __name__ == '__main__':
    main()
