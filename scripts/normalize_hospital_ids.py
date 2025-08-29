#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from pathlib import Path

BASE = Path('data/2023/Hospital')


def slugify(text: str) -> str:
    import re as _re
    text = (text or '').strip().lower()
    text = _re.sub(r'[^a-z0-9]+', '-', text)
    text = _re.sub(r'-{2,}', '-', text)
    return text.strip('-')[:80]


def norm_hosp_id(val: str) -> str:
    digits = re.sub(r'\D+', '', val or '')
    return digits.zfill(7) if digits else ''


def main() -> None:
    if not BASE.exists():
        print(f"No directory: {BASE}")
        return
    renamed = 0
    for d in sorted(BASE.iterdir()):
        if not d.is_dir():
            continue
        data_path = d / 'data.json'
        if not data_path.exists():
            continue
        try:
            data = json.loads(data_path.read_text(encoding='utf-8'))
        except Exception:
            continue
        meta = data.get('meta', {})
        fid = meta.get('facility_id') or ''
        name = meta.get('facility_name') or ''
        norm = norm_hosp_id(fid)
        if not norm:
            continue
        target_name = f"{slugify(norm)}-{slugify(name) if name else 'facility'}"
        if d.name == target_name:
            # already normalized
            continue
        target_dir = d.parent / target_name
        # avoid accidental overwrite
        if target_dir.exists():
            # Try unique suffix
            i = 2
            while (d.parent / f"{target_name}-{i}").exists():
                i += 1
            target_dir = d.parent / f"{target_name}-{i}"
        d.rename(target_dir)
        # write back normalized id
        data.setdefault('meta', {})['facility_id_normalized'] = norm
        (target_dir / 'data.json').write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding='utf-8')
        print(f"Renamed: {d.name} -> {target_dir.name}")
        renamed += 1
    print(f"Done. Renamed {renamed} directories.")


if __name__ == '__main__':
    main()

