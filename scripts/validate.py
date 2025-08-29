#!/usr/bin/env python3
import argparse
import json
from pathlib import Path

try:
    import jsonschema
except Exception as e:
    print('jsonschema package is required. Please install it in your environment.')
    raise

SCHEMAS_JSON_DIR = Path('schemas/json')

def load_schema(name: str):
    path = SCHEMAS_JSON_DIR / f"{name}.schema.json"
    if not path.exists():
        raise SystemExit(f"Schema not found: {path}")
    return json.loads(path.read_text(encoding='utf-8'))

def main():
    ap = argparse.ArgumentParser(description='Validate JSON data against a generated schema')
    ap.add_argument('schema', help='Schema name (folder name under schemas/, e.g., astc, esrd, ahq-short, ltc2, ltc-1)')
    ap.add_argument('data', help='Path to JSON data file to validate')
    args = ap.parse_args()

    schema = load_schema(args.schema)
    data_path = Path(args.data)
    data = json.loads(data_path.read_text(encoding='utf-8'))

    jsonschema.validate(instance=data, schema=schema)
    print(f"Valid: {data_path} against {args.schema}")

if __name__ == '__main__':
    main()

