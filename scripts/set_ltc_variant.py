#!/usr/bin/env python3
import json
import re
from pathlib import Path

BASE = Path('data/2023/LTC')


def parse_int(val: str) -> int | None:
    if val is None:
        return None
    s = re.sub(r'[^0-9\-]', '', str(val))
    try:
        return int(s)
    except Exception:
        return None


def detect_variant(fields: dict) -> str:
    keys = list(fields.keys())
    has_idd = any(k.startswith('idd') or k.startswith('icfdd') for k in keys)
    has_s22 = any(k.startswith('s22') for k in keys)
    if has_idd:
        beds = None
        for k in ('iddbedssetup', 'iddlicbeds', 'iddbedsoccupied'):
            if k in fields:
                n = parse_int(fields.get(k))
                if n is not None:
                    beds = n
                    break
        if beds is not None and beds > 16:
            return 'ltc5'
        return 'ltc4'
    if has_s22:
        return 'ltc3'
    return 'ltc2'


def main():
    if not BASE.exists():
        print(f"No directory: {BASE}")
        return
    tagged = 0
    for d in sorted(BASE.iterdir()):
        if not d.is_dir():
            continue
        f = d / 'data.json'
        if not f.exists():
            continue
        doc = json.loads(f.read_text(encoding='utf-8'))
        fields = doc.get('fields', {})
        meta = doc.get('meta', {})
        variant = detect_variant(fields)
        if meta.get('ltc_variant') != variant:
            meta['ltc_variant'] = variant
            doc['meta'] = meta
            f.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
            tagged += 1
    print(f"Tagged {tagged} LTC facilities with ltc_variant")


if __name__ == '__main__':
    main()

