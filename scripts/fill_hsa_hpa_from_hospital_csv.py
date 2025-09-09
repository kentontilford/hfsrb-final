#!/usr/bin/env python3
"""
Fill county -> HSA/HPA mappings from hospital_survey_2024.csv (and optionally 2023).

Inputs:
- hospital_survey_2024.csv (required)
- hospital_survey_2023.csv (optional to resolve gaps)

Outputs (overwrites with complete mappings):
- references/hsa_county_map.csv
- references/hpa_county_map.csv

Logic:
- Read county,HSA,HPA from CSV(s)
- Normalize county names (strip 'County' and extra spaces)
- For each county, choose the most common HSA/HPA encountered among hospitals
"""
from __future__ import annotations
import csv
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

CSV_2024 = ROOT / 'hospital_survey_2024.csv'
CSV_2023 = ROOT / 'hospital_survey_2023.csv'
HSA_OUT = ROOT / 'references' / 'hsa_county_map.csv'
HPA_OUT = ROOT / 'references' / 'hpa_county_map.csv'


def norm_county(s: str) -> str:
    s = (s or '').strip()
    if not s:
        return s
    if s.lower().endswith(' county'):
        s = s[:-7]
    return s.strip()


def process_csv(path: Path, counts_hsa: dict[str, Counter], counts_hpa: dict[str, Counter]):
    if not path.exists():
        return
    with path.open('r', encoding='utf-8-sig', newline='') as f:
        r = csv.DictReader(f)
        for row in r:
            county = norm_county(row.get('County', ''))
            hsa = (row.get('HSA', '') or '').strip()
            hpa = (row.get('HPA', '') or '').strip()
            if county:
                if hsa:
                    counts_hsa.setdefault(county, Counter())[hsa] += 1
                if hpa:
                    counts_hpa.setdefault(county, Counter())[hpa] += 1


def choose_majority(counts: dict[str, Counter]) -> dict[str, str]:
    out: dict[str, str] = {}
    for county, ctr in counts.items():
        if not ctr:
            continue
        # pick highest count; tie-break by lexical
        items = sorted(ctr.items(), key=lambda kv: (-kv[1], kv[0]))
        out[county] = items[0][0]
    return out


def write_map(path: Path, mapping: dict[str, str], code_key: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    counties = sorted(mapping.keys())
    with path.open('w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=['county', code_key])
        w.writeheader()
        for c in counties:
            w.writerow({'county': c, code_key: mapping[c]})


def main():
    counts_hsa: dict[str, Counter] = {}
    counts_hpa: dict[str, Counter] = {}
    process_csv(CSV_2024, counts_hsa, counts_hpa)
    process_csv(CSV_2023, counts_hsa, counts_hpa)
    hsa_map = choose_majority(counts_hsa)
    hpa_map = choose_majority(counts_hpa)
    write_map(HSA_OUT, hsa_map, 'hsa')
    write_map(HPA_OUT, hpa_map, 'hpa')
    print(f"Wrote {HSA_OUT} and {HPA_OUT} from hospital survey CSVs")


if __name__ == '__main__':
    main()

