#!/usr/bin/env python3
import subprocess
import sys

def run(cmd: list[str]):
    print("$", " ".join(cmd))
    subprocess.check_call(cmd)

def main():
    # 1) Generate schemas
    run([sys.executable, 'scripts/generate_schemas.py'])

    # 2) Ensure data tree + facility dirs
    run([sys.executable, 'scripts/setup_data_dirs.py'])

    # 3) Convert CSVs to per-facility JSON
    run([sys.executable, 'scripts/csv_to_facility_json.py'])

    # 4) Normalize 2023 hospital IDs; set AHQ variant
    run([sys.executable, 'scripts/normalize_hospital_ids.py'])
    run([sys.executable, 'scripts/set_hospital_variant.py'])

    # 5) Apply mappings with ingestion validation
    combos = [
        ('2024','Hospital'),
        ('2023','Hospital'),
        ('2023','ESRD'),
        ('2023','ASTC'),
        ('2023','LTC'),
    ]
    for year, ftype in combos:
        run([sys.executable, 'scripts/apply_mappings.py', '--year', year, '--type', ftype, '--validate', '--ingestion'])

if __name__ == '__main__':
    main()

