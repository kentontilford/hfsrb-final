#!/usr/bin/env python3
import json
from pathlib import Path

CHECKS = {
    'Hospital': ['license_idph', 'facility_name', 'address_line1', 'address_city', 'address_zip', 'fein'],
    'ASTC': ['astc_license', 'facility_name', 'address_line1', 'address_city', 'address_zip', 'fein', 'address_state'],
    'ESRD': ['medicare_ccn', 'facility_name', 'address_line1', 'address_city', 'address_zip', 'fein'],
    'LTC': ['license_number', 'facility_name', 'address_line1', 'address_city', 'address_zip', 'fein']
}

def main():
    base = Path('data')
    for year_dir in sorted(base.iterdir()):
        if not year_dir.is_dir():
            continue
        for ftype_dir in sorted(year_dir.iterdir()):
            if not ftype_dir.is_dir():
                continue
            ftype = ftype_dir.name
            want = CHECKS.get(ftype)
            if not want:
                continue
            for fac_dir in sorted(ftype_dir.iterdir()):
                if not fac_dir.is_dir():
                    continue
                p = fac_dir / 'schema_payload.json'
                if not p.exists():
                    continue
                doc = json.loads(p.read_text(encoding='utf-8'))
                payload = doc.get('payload', {})
                missing = [k for k in want if k not in payload or str(payload.get(k, '')).strip() == '']
                if missing:
                    print(f"{year_dir.name}/{ftype}/{fac_dir.name}: missing {', '.join(missing)}")

if __name__ == '__main__':
    main()
