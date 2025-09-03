#!/usr/bin/env python3
"""
Render Facility Profile HTML (and PDF if WeasyPrint available) from schema_payload.json.

Outputs:
  out/profiles/<year>/<type>/<slug>.html
  out/profiles/<year>/<type>/<slug>.pdf  (if WeasyPrint is installed)

Design goals:
  - Print-friendly, single- or two-page summaries.
  - Use normalized payload keys from schema_payload.json where possible.
  - Gracefully handle missing values.
  - Minimal dependencies; WeasyPrint optional.
"""
from __future__ import annotations

import argparse
import html
import json
from pathlib import Path
from typing import Dict, Any, Tuple

BASE_DATA = Path('data')
OUT = Path('out/profiles')


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding='utf-8'))


def fmt_int(val: Any) -> str:
    try:
        n = int(str(val).replace(',', '').replace(' ', ''))
        return f"{n:,}"
    except Exception:
        return str(val) if val is not None else ''


def fmt_text(val: Any) -> str:
    if val is None:
        return ''
    return html.escape(str(val))


def inline_css() -> str:
    css_path = Path('templates/styles.css')
    css = css_path.read_text(encoding='utf-8') if css_path.exists() else ''
    return f"<style>\n{css}\n</style>"


def head_html(title: str) -> str:
    return (
        "<head>"
        "<meta charset=\"utf-8\">"
        f"<title>{html.escape(title)}</title>"
        f"{inline_css()}"
        "</head>"
    )


def section_card(title: str, inner_html: str, classes: str = 'col-6', anchor_id: str | None = None) -> str:
    aid = f' id="{html.escape(anchor_id)}"' if anchor_id else ''
    return f'<div{aid} class="card {classes}"><h3>{html.escape(title)}</h3>{inner_html}</div>'


def table(rows: list[Tuple[str, str]], headers: Tuple[str, str]) -> str:
    th1, th2 = headers
    trs = ''.join(
        f'<tr><td>{html.escape(k)}</td><td class="right mono">{fmt_text(v)}</td></tr>' for k, v in rows
    )
    return f'<table><thead><tr><th>{html.escape(th1)}</th><th class="right">{html.escape(th2)}</th></tr></thead><tbody>{trs}</tbody></table>'


def render(meta: Dict[str, Any], payload: Dict[str, Any]) -> str:
    name = meta.get('facility_name') or payload.get('facility_name') or 'Facility'
    year = meta.get('year') or ''
    ftype = meta.get('facility_type') or ''
    # Identity
    address = payload.get('address_line1') or payload.get('facility_address') or ''
    city = payload.get('address_city') or payload.get('facility_city') or ''
    state = payload.get('address_state') or payload.get('facility_state') or 'IL'
    zipc = payload.get('address_zip') or payload.get('facility_zip') or ''

    header = (
        '<div class="header">'
        f'  <div><div class="title">{fmt_text(name)}</div>'
        f'       <div class="subtitle">{fmt_text(city)}, {fmt_text(state)} {fmt_text(zipc)} • {fmt_text(ftype)} • {fmt_text(year)}</div></div>'
        '</div>'
    )

    # Quick stats (basic examples; tailored per type in full version)
    stats = []
    for key in ['total_icu_admissions', 'ms_total_admissions', 'patients_oct1']:
        if key in payload and str(payload[key]).strip():
            stats.append((key.replace('_', ' ').title(), fmt_int(payload[key])))
    body_left = section_card('Selected Stats', table(stats, ('Metric', 'Value')) if stats else '<div class="muted">No quick stats available</div>')
    body_right = section_card('Address', table([
        ('Street', address),
        ('City/State/ZIP', f'{city}, {state} {zipc}'),
    ], ('Field', 'Value')))

    return (
        '<!doctype html><html lang="en">'
        + head_html(f"{name} — Profile")
        + '<body>'
        + header
        + f'<main class="grid">{body_left}{body_right}</main>'
        + '</body></html>'
    )


def ensure_out(year: int, ftype: str) -> Path:
    out_dir = OUT / str(year) / ftype
    out_dir.mkdir(parents=True, exist_ok=True)
    return out_dir


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--year', type=int)
    ap.add_argument('--type', choices=['Hospital', 'ESRD', 'ASTC', 'LTC'])
    ap.add_argument('--slug')
    ap.add_argument('--no-pdf', action='store_true', help='Only render HTML')
    args = ap.parse_args()

    years = [args.year] if args.year else [int(p.name) for p in BASE_DATA.iterdir() if p.is_dir() and p.name.isdigit()]
    types = [args.type] if args.type else ['Hospital', 'ESRD', 'ASTC', 'LTC']

    for y in sorted(years):
        for t in types:
            base = BASE_DATA / str(y) / t
            if not base.exists():
                continue
            out_dir = ensure_out(y, t)
            for fac_dir in sorted(base.iterdir()):
                if not fac_dir.is_dir():
                    continue
                if args.slug and fac_dir.name != args.slug:
                    continue
                sp = fac_dir / 'schema_payload.json'
                if not sp.exists():
                    continue
                doc = load_json(sp)
                meta = doc.get('meta', {})
                payload = doc.get('payload', {})
                html_text = render(meta, payload)
                out_html = out_dir / f"{fac_dir.name}.html"
                out_html.write_text(html_text, encoding='utf-8')
                # Optional PDF via WeasyPrint if installed
                if not args.no_pdf:
                    try:
                        from weasyprint import HTML  # type: ignore
                        HTML(string=html_text).write_pdf(str(out_html).replace('.html', '.pdf'))
                    except Exception:
                        pass


if __name__ == '__main__':
    main()

