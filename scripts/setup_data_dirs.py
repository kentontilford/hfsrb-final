#!/usr/bin/env python3
"""
Create storage directories for JSON data files organized as:

data/<YEAR>/<FacilityType>/<facility-id>-<facility-name-slug>/

- Years: 2008..2024
- Facility types per year: ASTC, ESRD, LTC, Hospital
- Facility directories are created for years where CSVs are present in repo root:
  - hospital_survey_<year>.csv
  - astc_survey_<year>.csv
  - esrd_survey_<year>.csv
  - ltc_survey_<year>.csv

This script does NOT convert CSVs to JSON; it only prepares folders.
"""
from __future__ import annotations

import csv
import re
from pathlib import Path
from typing import Dict, Iterable, Optional, Tuple

BASE = Path('data')
YEARS = list(range(2008, 2025))
FACILITY_TYPES = ['ASTC', 'ESRD', 'LTC', 'Hospital']

CSV_FILES = [
    # pattern, facility type
    (re.compile(r'^hospital_survey_(\d{4})\.csv$', re.I), 'Hospital'),
    (re.compile(r'^astc_survey_(\d{4})\.csv$', re.I), 'ASTC'),
    (re.compile(r'^esrd_survey_(\d{4})\.csv$', re.I), 'ESRD'),
    (re.compile(r'^ltc_survey_(\d{4})\.csv$', re.I), 'LTC'),
]


def slugify(text: str) -> str:
    text = text.strip().lower()
    # Replace non-alphanumeric with hyphen
    text = re.sub(r'[^a-z0-9]+', '-', text)
    # Collapse multiple hyphens
    text = re.sub(r'-{2,}', '-', text)
    # Strip hyphens
    return text.strip('-')[:80]


def ensure_skeleton() -> None:
    for year in YEARS:
        for ftype in FACILITY_TYPES:
            (BASE / str(year) / ftype).mkdir(parents=True, exist_ok=True)


def find_csvs(cwd: Path) -> Iterable[Tuple[Path, str, int]]:
    for path in cwd.glob('*.csv'):
        for pat, ftype in CSV_FILES:
            m = pat.match(path.name)
            if m:
                year = int(m.group(1))
                yield path, ftype, year
                break


def _pick(headers: Iterable[str], candidates: Iterable[str]) -> Optional[str]:
    hset = {h.strip(): h.strip() for h in headers}
    for cand in candidates:
        if cand in hset:
            return hset[cand]
    # case-insensitive fallback
    lowmap = {h.strip().lower(): h.strip() for h in headers}
    for cand in candidates:
        if cand.lower() in lowmap:
            return lowmap[cand.lower()]
    return None


def id_name_columns(ftype: str, headers: Iterable[str]) -> Tuple[Optional[str], Optional[str]]:
    """Return (id_col, name_col) best guess for a facility type."""
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

    id_col = _pick(headers, id_candidates)
    name_col = _pick(headers, name_candidates)
    return id_col, name_col


def create_facility_dirs(csv_path: Path, ftype: str, year: int) -> int:
    count = 0
    with csv_path.open('r', encoding='utf-8-sig', newline='') as fh:
        reader = csv.DictReader(fh)
        if not reader.fieldnames:
            return 0
        id_col, name_col = id_name_columns(ftype, reader.fieldnames)
        for row in reader:
            fid = (row.get(id_col or '') or '').strip()
            name = (row.get(name_col or '') or '').strip()
            if not fid and not name:
                continue
            # Avoid empty identifiers; prefer id, else slug name only
            if fid:
                folder = f"{slugify(fid)}-{slugify(name) if name else 'facility'}"
            else:
                folder = slugify(name)
            target = BASE / str(year) / ftype / folder
            target.mkdir(parents=True, exist_ok=True)
            # Keep directory in VCS-friendly state
            gitkeep = target / '.gitkeep'
            if not gitkeep.exists():
                gitkeep.write_text('', encoding='utf-8')
            count += 1
    return count


def main() -> None:
    ensure_skeleton()
    cwd = Path('.')
    total = 0
    for csv_path, ftype, year in find_csvs(cwd):
        made = create_facility_dirs(csv_path, ftype, year)
        print(f"{csv_path.name}: created/ensured {made} facility directories under data/{year}/{ftype}")
        total += made
    print(f"Done. Base skeleton ensured. Total facility directories processed: {total}")


if __name__ == '__main__':
    main()

