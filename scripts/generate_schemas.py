#!/usr/bin/env python3
import re
import json
from pathlib import Path
from typing import Dict, List, Tuple

SCHEMAS_DIR = Path('schemas')
OUTPUT_DIR = SCHEMAS_DIR / 'json'

FIELD_TABLE_HEADER = ['field_id','field_label','field_name','type','required','allowed_values','format','unit','section/page','notes']

def parse_markdown_table(lines: List[str], start_idx: int) -> Tuple[List[Dict[str,str]], int]:
    rows = []
    i = start_idx
    # Skip header lines (header and separator)
    if i >= len(lines):
        return rows, i
    header = [h.strip().lower() for h in lines[i].strip().strip('|').split('|')]
    i += 1
    if i < len(lines) and set(lines[i].strip()) <= set('|- '):
        i += 1
    while i < len(lines):
        line = lines[i].rstrip('\n')
        if not line.strip():
            break
        if line.startswith('## '):
            break
        if '|' not in line:
            break
        cols = [c.strip() for c in line.strip().strip('|').split('|')]
        # Pad columns to header length
        while len(cols) < len(header):
            cols.append('')
        row = {header[j]: cols[j] for j in range(len(header))}
        rows.append(row)
        i += 1
    return rows, i

def extract_enums(lines: List[str]) -> Dict[str, List[str]]:
    enums: Dict[str, List[str]] = {}
    in_enums = False
    current_name = None
    bullet_re = re.compile(r'^-\s+(.*)')
    for line in lines:
        if line.startswith('## Enumerations'):
            in_enums = True
            continue
        if in_enums and line.startswith('## '):
            break
        if in_enums:
            if line.startswith('### '):
                current_name = line[4:].strip().lower().replace(' ', '_')
                enums.setdefault(current_name, [])
            else:
                m = bullet_re.match(line)
                if m and current_name:
                    item = m.group(1)
                    # Accept formats like "code — label" or "code - label"
                    code = item.split('—', 1)[0].split('-', 1)[0].strip()
                    if code:
                        enums[current_name].append(code)
    return enums

def mmddyyyy_pattern() -> str:
    return r'^(0[1-9]|1[0-2])/(0[1-9]|[12]\d|3[01])/(19|20)\d{2}$'

def build_property_spec(row: Dict[str,str], enum_sets: Dict[str, List[str]]) -> Dict:
    t = row.get('type','').strip().lower()
    fmt = row.get('format','').strip()
    allowed = row.get('allowed_values','').strip()
    prop: Dict = {}

    def set_type(json_type: str):
        prop['type'] = json_type

    if t in ('string','integer','number','boolean','array','object'):
        set_type(t)
    elif t in ('date','datetime'):
        set_type('string')
        # prefer pattern if format hints mm/dd/yyyy
        if fmt and 'mm/dd/yyyy' in fmt.lower():
            prop['pattern'] = mmddyyyy_pattern()
        else:
            prop['format'] = 'date'
    elif t == 'enum':
        set_type('string')
    else:
        # default to string
        set_type('string')

    # Allowed values handling
    if allowed:
        key = allowed.strip().lower()
        if key in enum_sets:
            prop['enum'] = enum_sets[key]
        else:
            # Inline comma-separated values support
            if ',' in allowed:
                prop['enum'] = [v.strip() for v in allowed.split(',') if v.strip()]

    # Format/pattern handling
    if fmt:
        if fmt.startswith('^'):
            prop['pattern'] = fmt
        else:
            low = fmt.lower()
            if low in ('email','uri'):
                prop['format'] = low
            elif 'mm/dd/yyyy' in low:
                prop['pattern'] = mmddyyyy_pattern()
            elif low == 'year' and prop.get('type') == 'integer':
                prop['minimum'] = 1900
                prop['maximum'] = 2100

    description_bits = []
    label = row.get('field_label','').strip()
    notes = row.get('notes','').strip()
    section = row.get('section/page','').strip()
    if label:
        description_bits.append(label)
    if section:
        description_bits.append(f'(Section/Page: {section})')
    if notes:
        description_bits.append(notes)
    if description_bits:
        prop['description'] = ' '.join(description_bits)

    # Enrich with dashboard metadata to enable grouping/order in UI
    if label:
        prop['x_label'] = label
    # Section is derived from the first segment of field_id (e.g., facility.name -> Facility)
    fid = row.get('field_id', '').strip()
    if fid:
        top = fid.split('.', 1)[0]
        # Humanize: replace separators and title-case
        sec_label = top.replace('_', ' ').replace('-', ' ').strip().title()
        if sec_label:
            prop['x_section'] = sec_label

    return prop

def generate_schema(readme: Path) -> Dict:
    text = readme.read_text(encoding='utf-8').splitlines()
    title = text[0].lstrip('#').strip() if text else readme.parent.name

    # Find Fields table start
    start = None
    for i, line in enumerate(text):
        if line.strip().lower().startswith('## fields'):
            # The header line is two lines down (skip blank lines)
            # Find next non-empty line
            j = i+1
            while j < len(text) and not text[j].strip():
                j += 1
            start = j
            break
    if start is None:
        raise ValueError(f'No Fields table found in {readme}')

    # Parse table
    rows, _ = parse_markdown_table(text, start)

    # Parse enums
    enum_sets = extract_enums(text)

    properties: Dict[str, Dict] = {}
    required: List[str] = []
    # Track section order by first appearance
    section_first_index: Dict[str, int] = {}
    # Assign incremental order for fields within the schema
    field_order = 0
    for row in rows:
        field_name = row.get('field_name','').strip()
        if not field_name:
            continue
        prop = build_property_spec(row, enum_sets)
        # Order metadata for dashboard rendering
        field_order += 1
        prop['x_order'] = field_order
        sec = prop.get('x_section') or 'Other'
        if sec not in section_first_index:
            section_first_index[sec] = len(section_first_index) + 1
        prop['x_section_order'] = section_first_index[sec]
        req = row.get('required','').strip().lower()
        if req == 'yes':
            prop['x_required'] = True
            required.append(field_name)
        properties[field_name] = prop

    schema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": title,
        "type": "object",
        "properties": properties,
    }
    if required:
        schema['required'] = required
    return schema

def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    generated = []
    for readme in SCHEMAS_DIR.glob('*/README.md'):
        if readme.parent.name.startswith('_'):
            continue
        schema = generate_schema(readme)
        out = OUTPUT_DIR / f"{readme.parent.name}.schema.json"
        out.write_text(json.dumps(schema, indent=2, ensure_ascii=False) + "\n", encoding='utf-8')
        generated.append(str(out))
    print("Generated schemas:\n" + "\n".join(generated))

if __name__ == '__main__':
    main()
