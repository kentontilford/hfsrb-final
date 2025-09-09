#!/usr/bin/env python3
"""
Normalize common noisy fields across facility JSON payloads:
- FEIN -> NN-NNNNNNN when 9 digits present
- ZIP -> ##### or #####-#### when 5/9 digits present
- Phone (fields ending with 'phone' or exactly 'reg_agent_phone'/'phone') -> (###) ###-#### when 10 digits present
- FY dates (fy_start, fy_end) -> MM/DD/YYYY with zero padding when parseable

Targets files under data/<YEAR>/*/**/schema_payload.json (default YEAR=2023 and 2024).
Idempotent and safe; only rewrites when a change occurs.
"""
from __future__ import annotations
import json
import re
import sys
from pathlib import Path
from typing import Any, Dict

ROOT = Path(__file__).resolve().parent.parent

YEARS = ["2024", "2023"] if len(sys.argv) == 1 else sys.argv[1:]

FEIN_RE = re.compile(r"\d")
ZIP_RE = re.compile(r"\d")
DATE_RE = re.compile(r"^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$")
DIGITS_RE = re.compile(r"\D+")


def fmt_fein(s: str) -> str | None:
    digits = ''.join(FEIN_RE.findall(s))
    if len(digits) == 9:
        return f"{digits[:2]}-{digits[2:]}"
    return None


def fmt_zip(s: str) -> str | None:
    digits = ''.join(ZIP_RE.findall(s))
    if len(digits) == 5:
        return digits
    if len(digits) == 9:
        return f"{digits[:5]}-{digits[5:]}"
    return None


def fmt_phone(s: str) -> str | None:
    digits = DIGITS_RE.sub('', s)
    if len(digits) == 10:
        return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
    return None


def fmt_date(s: str) -> str | None:
    m = DATE_RE.match(s.strip())
    if not m:
        return None
    mm, dd, yy = m.groups()
    # normalize year: if YY, assume 20YY if < 50 else 19YY
    if len(yy) == 2:
        n = int(yy)
        yy = f"20{yy.zfill(2)}" if n < 50 else f"19{yy.zfill(2)}"
    try:
        mmi = int(mm)
        ddi = int(dd)
        yyi = int(yy)
        if not (1 <= mmi <= 12 and 1 <= ddi <= 31 and 1900 <= yyi <= 2099):
            return None
    except Exception:
        return None
    return f"{int(mm):02d}/{int(dd):02d}/{int(yy):04d}"


def normalize_payload(p: Dict[str, Any]) -> bool:
    changed = False
    # FEIN
    if isinstance(p.get('fein'), str):
        out = fmt_fein(p['fein'])
        if out and out != p['fein']:
            p['fein'] = out
            changed = True
    # ZIP
    for key in ('address_zip', 'zip'):
        if isinstance(p.get(key), str):
            out = fmt_zip(p[key])
            if out and out != p[key]:
                p[key] = out
                changed = True
    # Phones
    for k, v in list(p.items()):
        if not isinstance(v, str):
            continue
        lk = k.lower()
        if lk == 'phone' or lk.endswith('phone') or lk in ('reg_agent_phone',):
            out = fmt_phone(v)
            if out and out != v:
                p[k] = out
                changed = True
    # FY dates
    for key in ('fy_start', 'fy_end'):
        if isinstance(p.get(key), str):
            out = fmt_date(p[key])
            if out and out != p[key]:
                p[key] = out
                changed = True
    return changed


def iter_schema_files(year: str):
    base = ROOT / 'data' / year
    if not base.exists():
        return []
    return list(base.glob('**/schema_payload.json'))


def main():
    total_changed = 0
    for year in YEARS:
        files = iter_schema_files(year)
        for path in files:
            try:
                text = path.read_text(encoding='utf-8')
                j = json.loads(text)
            except Exception:
                continue
            payload = j.get('payload', j)
            if not isinstance(payload, dict):
                continue
            changed = normalize_payload(payload)
            if changed:
                if 'payload' in j:
                    j['payload'] = payload
                else:
                    j = payload
                path.write_text(json.dumps(j, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
                total_changed += 1
    print(f"normalize_common_fields: changed {total_changed} files across years {', '.join(YEARS)}")

if __name__ == '__main__':
    main()

