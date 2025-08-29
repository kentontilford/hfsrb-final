#!/usr/bin/env python3
import json
from pathlib import Path

SRC = Path('schemas/json')
DST = Path('schemas/json_ingestion')


def strip_required(node):
    if isinstance(node, dict):
        node.pop('required', None)
        for k, v in list(node.items()):
            node[k] = strip_required(v)
    elif isinstance(node, list):
        return [strip_required(x) for x in node]
    return node


def main():
    DST.mkdir(parents=True, exist_ok=True)
    for path in SRC.glob('*.schema.json'):
        schema = json.loads(path.read_text(encoding='utf-8'))
        schema = strip_required(schema)
        out = DST / path.name
        out.write_text(json.dumps(schema, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
        print(f"Wrote {out}")

if __name__ == '__main__':
    main()

