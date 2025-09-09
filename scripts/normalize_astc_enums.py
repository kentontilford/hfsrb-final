#!/usr/bin/env python3
"""
Normalize ASTC ownership_type values to canonical enum codes.

- Scans data/<YEAR>/ASTC/**/schema_payload.json (default YEAR=2023)
- Maps common free-text variants (e.g., "Limited liability company ra") to
  canonical codes like "for_profit:llc_ra".
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

YEAR = sys.argv[1] if len(sys.argv) > 1 else '2023'

ROOT = Path(__file__).resolve().parent.parent
ASTC_DIR = ROOT / 'data' / YEAR / 'ASTC'

CANON = {
    'for_profit:sole_proprietorship',
    'for_profit:corporation_ra',
    'for_profit:partnership',
    'for_profit:limited_partnership_ra',
    'for_profit:llp_ra',
    'for_profit:llc_ra',
    'for_profit:other',
    'nonprofit:church_related',
    'nonprofit:state',
    'nonprofit:county',
    'nonprofit:city',
    'nonprofit:township',
    'nonprofit:other',
}

def normalize(value: str | None) -> str | None:
    if not value:
        return value
    s = value.strip().lower()
    if s in CANON:
        return s
    # heuristics
    if 'not for profit' in s or 'non-profit' in s or 'nonprofit' in s:
        if 'church' in s:
            return 'nonprofit:church_related'
        if 'state' in s:
            return 'nonprofit:state'
        if 'county' in s:
            return 'nonprofit:county'
        if 'city' in s:
            return 'nonprofit:city'
        if 'township' in s:
            return 'nonprofit:township'
        return 'nonprofit:other'
    if 'limited liability company' in s or s.startswith('llc'):
        return 'for_profit:llc_ra'
    if 'limited partnership' in s:
        return 'for_profit:limited_partnership_ra'
    if 'llp' in s:
        return 'for_profit:llp_ra'
    if 'corporation' in s or s.startswith('corp'):
        return 'for_profit:corporation_ra'
    if 'sole proprietor' in s:
        return 'for_profit:sole_proprietorship'
    if 'partnership' in s:
        return 'for_profit:partnership'
    # fallback: if mentions church/state/county but not mark as non-profit above
    if 'church' in s:
        return 'nonprofit:church_related'
    # default to for-profit other
    return 'for_profit:other'

def iter_schema_files(base: Path):
    if not base.exists():
        return []
    return list(base.glob('**/schema_payload.json'))

def load_json(path: Path):
    try:
        return json.loads(path.read_text(encoding='utf-8'))
    except Exception:
        return None

def save_json(path: Path, obj):
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

def main():
    files = iter_schema_files(ASTC_DIR)
    if not files:
        print(f"No ASTC schema files under {ASTC_DIR}")
        return
    changed = 0
    for p in files:
        j = load_json(p)
        if not isinstance(j, dict):
            continue
        payload = j.get('payload', j)
        if not isinstance(payload, dict):
            continue
        val = payload.get('ownership_type')
        new_val = normalize(val if isinstance(val, str) else None)
        if new_val and new_val != val:
            payload['ownership_type'] = new_val
            # write back considering original envelope
            if 'payload' in j:
                j['payload'] = payload
            else:
                j = payload
            save_json(p, j)
            changed += 1
    print(f"ASTC ownership_type normalized in {changed} files (Year={YEAR})")

if __name__ == '__main__':
    main()

