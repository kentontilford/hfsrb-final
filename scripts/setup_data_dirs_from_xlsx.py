#!/usr/bin/env python3
"""
Create storage directories for ASTC and ESRD facilities based on Excel files
placed in the repo root (ASTC.xlsx and ESRD.xlsx), mirroring the structure used
for Hospital data:

data/<YEAR>/<FacilityType>/<facility-id>-<facility-name-slug>/

Usage:
  python3 scripts/setup_data_dirs_from_xlsx.py --year 2023

Notes:
- Minimal .xlsx reader implemented using zipfile + XML (no external deps).
- Uses the first worksheet in each workbook.
- Attempts to auto-detect ID and Name columns based on common header names.
"""
from __future__ import annotations

import argparse
import re
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple
from zipfile import ZipFile
import xml.etree.ElementTree as ET

BASE = Path('data')


def slugify(text: str) -> str:
    text = (text or '').strip().lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    text = re.sub(r'-{2,}', '-', text)
    return text.strip('-')[:80]


def col_to_index(cell_ref: str) -> int:
    # e.g., 'C12' -> 2 (0-based)
    letters = ''.join([ch for ch in cell_ref if ch.isalpha()])
    idx = 0
    for ch in letters:
        idx = idx * 26 + (ord(ch.upper()) - ord('A') + 1)
    return idx - 1


def read_xlsx_first_sheet(path: Path) -> List[Dict[str, str]]:
    rows: List[Dict[str, str]] = []
    with ZipFile(path, 'r') as zf:
        # Shared strings (optional)
        shared: List[str] = []
        if 'xl/sharedStrings.xml' in zf.namelist():
            ss = ET.fromstring(zf.read('xl/sharedStrings.xml'))
            # Namespace-insensitive search
            for si in ss.iter():
                if si.tag.endswith('si'):
                    # concatenate all text nodes in this si
                    text = ''.join(t.text or '' for t in si.iter() if t.tag.endswith('t'))
                    shared.append(text)
        # First worksheet (assume sheet1.xml)
        sheet_name = 'xl/worksheets/sheet1.xml'
        if sheet_name not in zf.namelist():
            # Fallback: find any worksheets/sheet*.xml
            candidates = [n for n in zf.namelist() if n.startswith('xl/worksheets/sheet') and n.endswith('.xml')]
            if not candidates:
                return rows
            sheet_name = sorted(candidates)[0]
        ws = ET.fromstring(zf.read(sheet_name))

        header: List[str] = []
        for row in ws.iter():
            if not row.tag.endswith('row'):
                continue
            cells: Dict[int, str] = {}
            for c in row:
                if not isinstance(c.tag, str) or not c.tag.endswith('c'):
                    continue
                r = c.attrib.get('r', 'A1')
                t = c.attrib.get('t')  # type
                v = None
                # inline string
                if t == 'inlineStr':
                    is_el = next((ch for ch in c if ch.tag.endswith('is')), None)
                    if is_el is not None:
                        txt = ''.join(tn.text or '' for tn in is_el.iter() if tn.tag.endswith('t'))
                        v = txt
                # shared string or value
                if v is None:
                    v_el = next((ch for ch in c if ch.tag.endswith('v')), None)
                    if v_el is not None and v_el.text is not None:
                        raw = v_el.text
                        if t == 's':
                            try:
                                idx = int(raw)
                                v = shared[idx] if 0 <= idx < len(shared) else raw
                            except Exception:
                                v = raw
                        else:
                            v = raw
                if v is None:
                    v = ''
                col = col_to_index(r)
                cells[col] = str(v)
            if not cells:
                continue
            # Build row list aligned to max col index
            max_col = max(cells.keys())
            values = [cells.get(i, '') for i in range(max_col + 1)]
            if not header:
                header = [h.strip() for h in values]
                continue
            rowdict = { (header[i] if i < len(header) else f'col_{i+1}'): values[i] for i in range(len(values)) }
            rows.append(rowdict)
    return rows


def pick_columns(ftype: str, headers: Iterable[str]) -> Tuple[Optional[str], Optional[str]]:
    def _pick(cands: Iterable[str]) -> Optional[str]:
        hset = {h: h for h in headers if h}
        for c in cands:
            if c in hset:
                return hset[c]
        low = {h.lower(): h for h in headers if h}
        for c in cands:
            if c.lower() in low:
                return low[c.lower()]
        return None

    if ftype == 'ASTC':
        id_c = ['ASTC_ID', 'ASTC License', 'License', 'ASTC License Number', 'License Number', 'ID']
        name_c = ['ASTC Name', 'Facility Name', 'Name', 'Facility']
    elif ftype == 'ESRD':
        id_c = ['CCN', 'Medicare CCN', 'CMS Certification Number', 'Medicare ID', 'Provider Number']
        name_c = ['Facility Name', 'Facility', 'Name']
    else:
        id_c = ['ID']
        name_c = ['Name']
    return _pick(id_c), _pick(name_c)


def ensure_dirs(rows: List[Dict[str, str]], ftype: str, year: int) -> int:
    if not rows:
        return 0
    headers = list(rows[0].keys())
    id_col, name_col = pick_columns(ftype, headers)
    made = 0
    for r in rows:
        fid = (r.get(id_col or '') or '').strip()
        name = (r.get(name_col or '') or '').strip()
        if not fid and not name:
            continue
        if fid:
            folder = f"{slugify(fid)}-{slugify(name) if name else 'facility'}"
        else:
            folder = slugify(name)
        target = BASE / str(year) / ftype / folder
        target.mkdir(parents=True, exist_ok=True)
        gk = target / '.gitkeep'
        if not gk.exists():
            gk.write_text('', encoding='utf-8')
        made += 1
    return made


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--year', type=int, required=True, help='Target year (e.g., 2023 or 2024)')
    args = ap.parse_args()

    year = args.year
    (BASE / str(year) / 'ASTC').mkdir(parents=True, exist_ok=True)
    (BASE / str(year) / 'ESRD').mkdir(parents=True, exist_ok=True)

    root = Path('.')
    total = 0
    for name, ftype in [('ASTC.xlsx', 'ASTC'), ('ESRD.xlsx', 'ESRD')]:
        p = root / name
        if not p.exists():
            print(f"{name} not found; skipping {ftype}.")
            continue
        print(f"Reading {name} …")
        try:
            rows = read_xlsx_first_sheet(p)
        except Exception as e:
            print(f"Failed to read {name}: {e}")
            continue
        made = ensure_dirs(rows, ftype, year)
        print(f"Created/ensured {made} directories under data/{year}/{ftype}")
        total += made
    print(f"Done. Total created/ensured: {total}")


if __name__ == '__main__':
    main()

