#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Optional


def parse_int(val: str) -> Optional[int]:
    if val is None:
        return None
    s = str(val).strip()
    if s == '':
        return None
    # strip commas and non-digits
    s = re.sub(r'[^0-9-]', '', s)
    try:
        return int(s)
    except ValueError:
        return None


def beds_from_fields(fields: dict) -> Optional[int]:
    # 2024: total_beds_on_10_1_23
    for key in (
        'total_beds_on_10_1_23',
        'total_bed_set_up_oct_1',  # 2023 normalized
        'ms_beds_10_1_23',         # fallback
    ):
        if key in fields:
            v = parse_int(fields.get(key))
            if v is not None:
                return v
    return None


def process_year(path: Path) -> int:
    count = 0
    for d in sorted(path.iterdir()):
        if not d.is_dir():
            continue
        f = d / 'data.json'
        if not f.exists():
            continue
        data = json.loads(f.read_text(encoding='utf-8'))
        fields = data.get('fields', {})
        beds = beds_from_fields(fields)
        variant = 'ahq-long' if (beds is not None and beds >= 100) else 'ahq-short'
        data.setdefault('meta', {})['ahq_variant'] = variant
        if beds is not None:
            data['meta']['beds_10_1_23'] = beds
        f.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding='utf-8')
        count += 1
    return count


def main() -> None:
    total = 0
    for year in (2023, 2024):
        base = Path('data') / str(year) / 'Hospital'
        if base.exists():
            n = process_year(base)
            print(f"Tagged {n} hospitals in {year} with ahq_variant")
            total += n
    print(f"Done. Total hospitals tagged: {total}")


if __name__ == '__main__':
    main()

