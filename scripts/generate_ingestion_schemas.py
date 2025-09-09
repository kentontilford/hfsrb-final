#!/usr/bin/env python3
import json
from pathlib import Path

SRC = Path('schemas/json')
DST = Path('schemas/json_ingestion')

# Fields that are commonly noisy in source data; relax their constraints for ingestion
RELAX_FIELDS = {
    'fein',
    'address_zip',
    'reg_agent_phone',
    'phone',  # generic fallbacks if present
    'fax',
}

# Enums to drop entirely for ingestion (accept free-text and clean later)
RELAX_ENUM_FIELDS = {
    'ownership_type',
}

# Date fields with inconsistent zero-padding in inputs; drop strict patterns for ingestion
RELAX_DATE_FIELDS = {
    'fy_start',
    'fy_end',
}


def strip_required(node):
    if isinstance(node, dict):
        node.pop('required', None)
        for k, v in list(node.items()):
            node[k] = strip_required(v)
    elif isinstance(node, list):
        return [strip_required(x) for x in node]
    return node


def relax_noisy_fields(node):
    """Remove strict patterns from known-problematic fields for ingestion.

    Walks the schema recursively; when encountering an object with 'properties',
    if a property name is in RELAX_FIELDS, drop its 'pattern' and 'format'.
    """
    if isinstance(node, dict):
        # Relax properties
        props = node.get('properties')
        if isinstance(props, dict):
            for pname, pnode in list(props.items()):
                if not isinstance(pnode, dict):
                    continue
                # Relax patterns for noisy fields
                if pname in RELAX_FIELDS or pname in RELAX_DATE_FIELDS:
                    pnode.pop('pattern', None)
                    # Some phone fields use 'format' (rare); drop to avoid false negatives
                    if pnode.get('format') in ('regex', 'phone', 'date'):
                        pnode.pop('format', None)
                # Drop mismatched enums where type is numeric but enum is categorical strings
                enum_vals = pnode.get('enum')
                if pnode.get('type') in ('integer', 'number') and isinstance(enum_vals, list) and any(isinstance(x, str) for x in enum_vals):
                    pnode.pop('enum', None)
                # Specific ASTC patients_payment_* counters: drop enums entirely for ingestion
                if pname.startswith('patients_payment_') and 'enum' in pnode:
                    pnode.pop('enum', None)
                # Drop enums for known free-text/categorical fields where source data varies widely
                if pname in RELAX_ENUM_FIELDS and 'enum' in pnode:
                    pnode.pop('enum', None)
        # Recurse
        for k, v in list(node.items()):
            node[k] = relax_noisy_fields(v)
    elif isinstance(node, list):
        return [relax_noisy_fields(x) for x in node]
    return node


def main():
    DST.mkdir(parents=True, exist_ok=True)
    for path in SRC.glob('*.schema.json'):
        schema = json.loads(path.read_text(encoding='utf-8'))
        schema = strip_required(schema)
        schema = relax_noisy_fields(schema)
        out = DST / path.name
        out.write_text(json.dumps(schema, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
        print(f"Wrote {out}")

if __name__ == '__main__':
    main()
