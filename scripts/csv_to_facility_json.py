#!/usr/bin/env python3
"""
Convert bulk survey CSVs into per-facility JSON files under:

data/<YEAR>/<FacilityType>/<facility-id>-<facility-name-slug>/data.json

Notes:
- Uses the same folder naming heuristic as setup_data_dirs.py.
- Adds a small `meta` block (year, type, source, facility_id/name).
- Preserves original CSV headers under `raw` and also writes a
  normalized snake_case mapping under `fields` for convenience.
- Hospital IDs are also provided as `facility_id_normalized` (digits-only, left-padded to 7).
"""
from __future__ import annotations

import csv
import json
import re
from pathlib import Path
from typing import Dict, Iterable, Optional, Tuple

BASE = Path('data')

CSV_FILES = [
    # pattern, facility type
    (re.compile(r'^hospital_survey_(\d{4})\.csv$', re.I), 'Hospital'),
    (re.compile(r'^astc_survey_(\d{4})\.csv$', re.I), 'ASTC'),
    (re.compile(r'^esrd_survey_(\d{4})\.csv$', re.I), 'ESRD'),
    (re.compile(r'^ltc_survey_(\d{4})\.csv$', re.I), 'LTC'),
]


def slugify(text: str) -> str:
    text = text.strip().lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    text = re.sub(r'-{2,}', '-', text)
    return text.strip('-')[:80]


def normalize_header(h: str) -> str:
    # Remove BOM and trim
    h = h.replace('\ufeff', '').strip()
    # Make snake_case from arbitrary header
    h = re.sub(r'[^A-Za-z0-9]+', '_', h)
    h = re.sub(r'_{2,}', '_', h)
    return h.strip('_').lower()


def _pick(headers: Iterable[str], candidates: Iterable[str]) -> Optional[str]:
    hset = {h.strip(): h.strip() for h in headers}
    for cand in candidates:
        if cand in hset:
            return hset[cand]
    lowmap = {h.strip().lower(): h.strip() for h in headers}
    for cand in candidates:
        if cand.lower() in lowmap:
            return lowmap[cand.lower()]
    return None


def id_name_columns(ftype: str, headers: Iterable[str]) -> Tuple[Optional[str], Optional[str]]:
    if ftype == 'Hospital':
        id_candidates = ['hn', 'ID #', 'ID', 'Hospital ID', 'Provider Number']
        name_candidates = ['hname', 'Hospital Name', 'Hospital']
    elif ftype == 'ASTC':
        id_candidates = ['ASTC_ID', 'ASTCLicense', 'ASTC License', 'License']
        name_candidates = ['ASTCName', 'ASTC Name']
    elif ftype == 'ESRD':
        id_candidates = ['Medicare ID', 'CCN', 'CMS Certification Number']
        name_candidates = ['Facility', 'Facility Name', 'Name']
    elif ftype == 'LTC':
        id_candidates = ['Facility ID', 'ID']
        name_candidates = ['Facility Name', 'Name']
    else:
        id_candidates = []
        name_candidates = []
    return _pick(headers, id_candidates), _pick(headers, name_candidates)


def normalize_facility_id(ftype: str, fid: str) -> str:
    fid = fid or ''
    if ftype == 'Hospital':
        digits = re.sub(r'\D+', '', fid)
        return digits.zfill(7) if digits else fid.strip()
    return fid.strip()


def folder_for(ftype: str, year: int, fid: str, name: str) -> Path:
    if fid:
        folder = f"{slugify(fid)}-{slugify(name) if name else 'facility'}"
    else:
        folder = slugify(name)
    return BASE / str(year) / ftype / folder


def convert_csv(csv_path: Path, ftype: str, year: int) -> int:
    count = 0
    with csv_path.open('r', encoding='utf-8-sig', newline='') as fh:
        reader = csv.DictReader(fh)
        if not reader.fieldnames:
            return 0
        id_col, name_col = id_name_columns(ftype, reader.fieldnames)
        headers = reader.fieldnames
        norm_headers = [normalize_header(h) for h in headers]

        for row in reader:
            raw: Dict[str, str] = {h: row.get(h, '') for h in headers}
            fields: Dict[str, str] = {nh: row.get(h, '') for h, nh in zip(headers, norm_headers)}
            fid = (row.get(id_col or '') or '').strip()
            name = (row.get(name_col or '') or '').strip()
            target_dir = folder_for(ftype, year, fid, name)
            target_dir.mkdir(parents=True, exist_ok=True)
            out_path = target_dir / 'data.json'

            data = {
                'meta': {
                    'year': year,
                    'facility_type': ftype,
                    'source_csv': csv_path.name,
                    'facility_id': fid,
                    'facility_id_normalized': normalize_facility_id(ftype, fid),
                    'facility_name': name,
                },
                'fields': fields,
                'raw': raw,
            }

            out_path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding='utf-8')
            count += 1
    return count


def main() -> None:
    cwd = Path('.')
    total = 0
    for path in cwd.glob('*.csv'):
        for pat, ftype in CSV_FILES:
            m = pat.match(path.name)
            if m:
                year = int(m.group(1))
                n = convert_csv(path, ftype, year)
                print(f"{path.name}: wrote {n} JSON files into data/{year}/{ftype}")
                total += n
                break
    print(f"Done. Total JSON files written: {total}")


if __name__ == '__main__':
    main()

