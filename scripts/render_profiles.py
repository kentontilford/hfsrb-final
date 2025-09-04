#!/usr/bin/env python3
"""
Render Facility Profile HTML (and PDF if WeasyPrint available) from schema_payload.json,
showing ALL payload fields, labeled and grouped according to the corresponding
data dictionary (Markdown) for the selected schema.

Outputs:
  out/profiles/<year>/<type>/<slug>.html
  out/profiles/<year>/<type>/<slug>.pdf  (if WeasyPrint is installed)

Design goals:
  - Accurate: reflect dictionary labels/structure, not ad-hoc summaries.
  - Complete: include every non-empty payload field.
  - Clear: group fields by dictionary sections derived from field_id hierarchy.
  - Minimal dependencies; WeasyPrint optional.
"""
from __future__ import annotations

import argparse
import html
import json
from pathlib import Path
from typing import Dict, Any, Tuple, List

BASE_DATA = Path('data')
OUT = Path('out/profiles')


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding='utf-8'))


def _num_like(s: str) -> bool:
    import re
    return bool(re.fullmatch(r"[-+]?\d+(?:\.\d+)?", s))


def fmt_value(val: Any, context: str = '') -> str:
    if val is None:
        return ''
    if isinstance(val, bool):
        return 'Yes' if val else 'No'
    if isinstance(val, (int, float)):
        try:
            return f"{val:,}"
        except Exception:
            return str(val)
    if isinstance(val, list):
        return ', '.join(fmt_value(x) for x in val)
    s = str(val).strip()
    ctx = (context or '').lower()
    # Avoid numeric formatting for identifiers like ZIP, CCN, FEIN already formatted, license IDs
    if any(tok in ctx for tok in ['zip', 'ccn', 'license', 'idph', 'fein']):
        return html.escape(s)
    if _num_like(s):
        try:
            f = float(s)
            if f.is_integer():
                return f"{int(f):,}"
            return f"{f:,.2f}"
        except Exception:
            pass
    return html.escape(s)


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
        "<style>body{font-family:Aptos,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif} a{color:#28658D} h3{color:#28658D}</style>"
        # Chart.js for interactive pies in HTML (Puppeteer injects its own copy for PDFs)
        "<script src=\"https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js\"></script>"
        "<link rel=\"stylesheet\" href=\"../../brand.css\">"
        "</head>"
    )

def _charts_block(ftype: str, payload: Dict[str, Any]) -> str:
    """Inline demographics charts + tables to mirror dashboard popup.
    Draws Payer Mix, Patients by Race, Patients by Ethnicity as doughnut charts,
    and a combined demographics table with patient/day shares (days only for Hospital).
    """
    import json as _json
    data_json = _json.dumps({'type': ftype, 'payload': payload}, ensure_ascii=False)
    return (
        '<div class="card col-12" id="demographics">'
        '  <h3>Demographics & Payer Mix</h3>'
        '  <div class="charts" style="display:grid;grid-template-columns:repeat(3, minmax(220px,1fr));gap:12px">'
        '    <canvas id="chart-payer" height="140"></canvas>'
        '    <canvas id="chart-race" height="140"></canvas>'
        '    <canvas id="chart-eth" height="140"></canvas>'
        '  </div>'
        '  <div id="demo-tables"></div>'
        '  <script>(function(){\n'
        '    const C = ' + data_json + ';\n'
        "    function toNum(n){const x=Number(String(n??'').replace(/[^0-9.-]/g,''));return Number.isFinite(x)?x:0;}\n"
        "    function fmt(n){const x=Number(String(n??'').replace(/[^0-9.-]/g,''));return Number.isFinite(x)?x.toLocaleString('en-US'):String(n??'');}\n"
        "    function payerOrder(a){const order=['Medicare','Medicaid','Private Insurance','Other Public','Private Pay','Charity Care'];return a.slice().sort((x,y)=>order.indexOf(x)-order.indexOf(y));}\n"
        "    function raceOrder(a){const order=['White','Black/African American','Black','Asian','AI/AN','American Indian','NH/PI','Unknown'];return a.slice().sort((x,y)=>order.indexOf(x)-order.indexOf(y));}\n"
        "    function drawDoughnut(sel,title,labels,data){var cv=document.querySelector(sel);if(!cv||!labels.length){return;}var ctx=cv.getContext('2d');new Chart(ctx,{type:'doughnut',data:{labels:labels,datasets:[{data:data}]},options:{plugins:{title:{display:true,text:title},legend:{display:true},tooltip:{callbacks:{label:(ctx)=>{const ds=ctx.dataset;const total=(ds&&ds.data||[]).reduce((a,b)=>a+(Number(b)||0),0)||0;const val=Number(ctx.raw)||0;const pct=total?((val/total)*100).toFixed(1)+'%':'';const lbl=ctx.label||'';return lbl+': '+val.toLocaleString('en-US')+' '+(pct?('('+pct+')'):'');}}}}});}\n"
        "    function buildTables(type,p){const host=document.getElementById('demo-tables');if(!host) return;const parts=[];function makeRows(labels,patMap,daysMap){const patVals=labels.map(k=>toNum(patMap[k]));const patTotal=patVals.reduce((a,b)=>a+b,0);const daysVals=labels.map(k=>toNum(daysMap&&daysMap[k]));const daysTotal=daysVals.reduce((a,b)=>a+b,0);const rows=labels.map((k,i)=>{const pv=patVals[i];const dv=daysVals[i]||0;const pShare=patTotal?((pv/patTotal)*100).toFixed(1)+'%':'';const dShare=daysTotal?((dv/daysTotal)*100).toFixed(1)+'%':'';return '<tr><td>'+k+'</td><td class=\"right\">'+fmt(pv)+'</td><td class=\"right\">'+pShare+'</td><td class=\"right\">'+fmt(dv)+'</td><td class=\"right\">'+dShare+'</td></tr>';}).join('');const totalRow='<tr><th>Total</th><th class=\"right\">'+fmt(patTotal)+'</th><th></th><th class=\"right\">'+fmt(daysTotal)+'</th><th></th></tr>';return '<table><thead><tr><th>Category</th><th class=\"right\">Patients</th><th class=\"right\">Patients Share</th><th class=\"right\">Inpatient Days</th><th class=\"right\">Days Share</th></tr></thead><tbody>'+rows+totalRow+'</tbody></table>';}\n"
        "      const t=C.type;const p=C.payload||{};\n"
        "      const payerMap=(t==='Hospital')?{'Inpatient Medicare':p.pay_inp_medicare,'Inpatient Medicaid':p.pay_inp_medicaid,'Inpatient Private Insurance':p.pay_inp_private_ins,'Inpatient Other Public':p.pay_inp_other_public,'Inpatient Private Pay':p.pay_inp_private_pay}:{'Medicare':p.pat_medicare,'Medicaid':p.pat_medicaid,'Private Insurance':p.pat_private_insurance,'Other Public':p.pat_other_public,'Private Pay':p.pat_private_payment,'Charity Care':p.pat_charity};\n"
        "      const payerLabels=(t==='Hospital'?Object.keys(payerMap):payerOrder(Object.keys(payerMap))).filter(k=>String(payerMap[k]??'').trim()!=='');\n"
        "      const payerVals=payerLabels.map(k=>toNum(payerMap[k]));\n"
        "      const raceMap=(t==='Hospital')?{'White':p.race_inp_white,'Black/African American':p.race_inp_black,'Asian':p.race_inp_asian,'AI/AN':p.race_inp_ai_an,'NH/PI':p.race_inp_nh_pi,'Unknown':p.race_inp_unknown}:{'White':p.race_white,'Black/African American':p.race_black||p.race_black_african_american,'Asian':p.race_asian,'AI/AN':p.race_american_indian,'NH/PI':p.race_native_hawaiian_pacific_islander||p.race_nh_pi,'Unknown':p.race_unknown};\n"
        "      const raceLabels=raceOrder(Object.keys(raceMap)).filter(k=>String(raceMap[k]??'').trim()!=='');\n"
        "      const raceVals=raceLabels.map(k=>toNum(raceMap[k]));\n"
        "      const ethMap=(t==='Hospital')?{'Not Hispanic/Latino':p.eth_inp_not_hispanic,'Hispanic/Latino':p.eth_inp_hispanic,'Unknown':p.eth_inp_unknown}:{'Non-Hispanic':p.ethnicity_non_hispanic||p.eth_not_hispanic,'Hispanic/Latino':p.ethnicity_hispanic_latino||p.eth_hispanic,'Unknown':p.ethnicity_unknown||p.eth_unknown};\n"
        "      const ethLabels=Object.keys(ethMap).filter(k=>String(ethMap[k]??'').trim()!=='');\n"
        "      const ethVals=ethLabels.map(k=>toNum(ethMap[k]));\n"
        "      function renderCharts(){ if (typeof Chart==='undefined') return; if(payerLabels.length) drawDoughnut('#chart-payer','Payer Mix',payerLabels,payerVals); if(raceLabels.length) drawDoughnut('#chart-race','Patients by Race',raceLabels,raceVals); if(ethLabels.length) drawDoughnut('#chart-eth','Patients by Ethnicity',ethLabels,ethVals); const raceDays=(t==='Hospital')?{'White':p.days_by_race_white,'Black/African American':p.days_by_race_black,'Asian':p.days_by_race_asian,'AI/AN':p.days_by_race_ai_an,'NH/PI':p.days_by_race_nh_pi,'Unknown':p.days_by_race_unknown}:{}; const ethDays=(t==='Hospital')?{'Not Hispanic/Latino':p.days_by_eth_not_hispanic,'Hispanic/Latino':p.days_by_eth_hispanic,'Unknown':p.days_by_eth_unknown}:{}; const tables=[]; tables.push('<div class=\"card col-12\"><h3>Race Breakdown</h3>'+makeRows(raceLabels,raceMap,raceDays)+'</div>'); tables.push('<div class=\"card col-12\"><h3>Ethnicity Breakdown</h3>'+makeRows(ethLabels,ethMap,ethDays)+'</div>'); document.getElementById('demo-tables').innerHTML=tables.join(''); }\n"
        "      function makeRows(labels,patMap,daysMap){return makeRowsImpl(labels,patMap,daysMap);}\n"
        "      function makeRowsImpl(labels,patMap,daysMap){const patVals=labels.map(k=>toNum(patMap[k]));const patTotal=patVals.reduce((a,b)=>a+b,0);const daysVals=labels.map(k=>toNum(daysMap&&daysMap[k]));const daysTotal=daysVals.reduce((a,b)=>a+b,0);const rows=labels.map((k,i)=>{const pv=patVals[i];const dv=daysVals[i]||0;const pShare=patTotal?((pv/patTotal)*100).toFixed(1)+'%':'';const dShare=daysTotal?((dv/daysTotal)*100).toFixed(1)+'%':'';return '<tr><td>'+k+'</td><td class=\"right\">'+fmt(pv)+'</td><td class=\"right\">'+pShare+'</td><td class=\"right\">'+fmt(dv)+'</td><td class=\"right\">'+dShare+'</td></tr>';}).join('');const totalRow='<tr><th>Total</th><th class=\"right\">'+fmt(patTotal)+'</th><th></th><th class=\"right\">'+fmt(daysTotal)+'</th><th></th></tr>';return '<table><thead><tr><th>Category</th><th class=\"right\">Patients</th><th class=\"right\">Patients Share</th><th class=\"right\">Inpatient Days</th><th class=\"right\">Days Share</th></tr></thead><tbody>'+rows+totalRow+'</tbody></table>';}\n"
        "      if (typeof Chart!=='undefined') { renderCharts(); } else { window.__renderProfileCharts = renderCharts; }\n"
        '  })();</script>'
        '</div>'
    )


def section_card(title: str, inner_html: str, classes: str = 'col-6', anchor_id: str | None = None) -> str:
    aid = f' id="{html.escape(anchor_id)}"' if anchor_id else ''
    return f'<div{aid} class="card {classes}"><h3>{html.escape(title)}</h3>{inner_html}</div>'

def table(rows: List[Tuple[int, str, str]], headers: Tuple[str, str]) -> str:
    th1, th2 = headers
    trs = ''.join(
        f'<tr><td>{html.escape(k)}</td><td class="right mono">{fmt_value(v, k)}</td></tr>'
        for _, k, v in rows
    )
    return (
        '<table>'
        f'<thead><tr><th>{html.escape(th1)}</th><th class="right">{html.escape(th2)}</th></tr></thead>'
        f'<tbody>{trs}</tbody></table>'
    )


def table_matrix(headers: List[str], rows: List[List[Any]]) -> str:
    thead = ''.join(f'<th>{html.escape(str(h))}</th>' for h in headers)
    body_rows = []
    for r in rows:
        tds = []
        for i, cell in enumerate(r):
            cell_str = fmt_value(cell, str(headers[i])) if i > 0 else html.escape(str(cell))
            klass = ' class="right mono"' if i > 0 else ''
            tds.append(f'<td{klass}>{cell_str}</td>')
        body_rows.append('<tr>' + ''.join(tds) + '</tr>')
    tbody = ''.join(body_rows)
    return f'<table><thead><tr>{thead}</tr></thead><tbody>{tbody}</tbody></table>'


def parse_dictionary(schema_path: Path) -> Dict[str, Dict[str, Any]]:
    """Return a map of field_name -> metadata from the Markdown dictionary corresponding to schema_path.
    Metadata includes: field_id, label, section_key, section_label, order_index, page, notes.
    """
    # schemas/json/ahq-short.schema.json -> schemas/ahq-short/README.md
    try:
        folder = schema_path.parent.parent / schema_path.stem.replace('.schema', '')
        md = folder / 'README.md'
    except Exception:
        return {}
    if not md.exists():
        return {}
    lines = md.read_text(encoding='utf-8').splitlines()
    # Find Fields table header
    start = None
    for i, line in enumerate(lines):
        if line.strip().lower().startswith('## fields'):
            j = i+1
            while j < len(lines) and not lines[j].strip():
                j += 1
            start = j
            break
    if start is None:
        return {}
    header = [h.strip().lower() for h in lines[start].strip().strip('|').split('|')]
    idx = start + 2  # skip separator
    out: Dict[str, Dict[str, Any]] = {}
    order = 0
    while idx < len(lines):
        line = lines[idx].rstrip('\n')
        if not line.strip() or line.startswith('## '):
            break
        if '|' not in line:
            break
        cols = [c.strip() for c in line.strip().strip('|').split('|')]
        while len(cols) < len(header):
            cols.append('')
        row = {header[j]: cols[j] for j in range(len(header))}
        fname = row.get('field_name', '').strip()
        fid = row.get('field_id', '').strip()
        label = row.get('field_label', '').strip() or fname
        page = row.get('section/page', '').strip()
        notes = row.get('notes', '').strip()
        req = (row.get('required', '') or '').strip().lower() == 'yes'
        segs = fid.split('.') if fid else []
        if len(segs) >= 2:
            section_key = '.'.join(segs[:2])
        elif segs:
            section_key = segs[0]
        else:
            section_key = 'Other'
        # Derive a readable section label from field_id without forcing Title Case
        section_label = section_key.replace('_', ' ').replace('.', ' — ').strip()
        if fname:
            out[fname] = {
                'field_id': fid,
                'label': label,
                'section_key': section_key,
                'section_label': section_label,
                'page': page,
                'notes': notes,
                'required': req,
                'order': order,
            }
            order += 1
        idx += 1
    return out


def _schema_name_from_path(schema_path: str | None) -> str:
    try:
        p = Path(str(schema_path))
        return p.stem.replace('.schema', '')  # e.g., 'ahq-short'
    except Exception:
        return ''


def _hospital_group_for(fid: str, fname: str) -> Tuple[str, int]:
    # Return (label, order)
    f = fid or ''
    n = fname or ''
    def starts(*prefixes: str) -> bool:
        return any(f.startswith(px) for px in prefixes)
    def name_starts(*prefixes: str) -> bool:
        return any(n.startswith(px) for px in prefixes)

    if starts('facility.') or name_starts('facility_', 'address_', 'license_', 'fein'):
        return ('Facility', 10)
    if starts('ownership.') or name_starts('ownership_', 'operator_', 'plant_owner'):
        return ('Ownership', 20)
    if starts('cms.', 'hospital.characterization', 'chna.') or name_starts('cms_', 'hospital_characterization', 'chna_'):
        return ('Organization & Certification', 30)
    if starts('mgmt.contracts') or name_starts('mgmt_'):
        return ('Management Contracts', 40)
    if starts('utilization.med_surg') or name_starts('med_surg_'):
        return ('Utilization — Medical-Surgical', 50)
    if starts('utilization.icu') or name_starts('icu_'):
        return ('Utilization — ICU', 55)
    if starts('utilization.ob_gyn') or name_starts('ob_', 'gyn_', 'obgyn_'):
        return ('Utilization — OB/GYN', 57)
    if starts('utilization.pediatrics') or name_starts('peds_', 'pediatric_'):
        return ('Utilization — Pediatrics', 58)
    if starts('utilization.nicu') or name_starts('nicu_', 'nn_icu_'):
        return ('Utilization — NICU', 59)
    if name_starts('ltc_', 'swing_'):
        return ('Utilization — Long-Term Care & Swing', 60)
    if name_starts('total_'):
        return ('Totals', 70)
    if name_starts('op_', 'obs_unit_'):
        return ('Outpatient', 80)
    if name_starts('pay_inp_'):
        return ('Payer Mix — Inpatient', 90)
    if starts('inpatients_by_race') or name_starts('race_inp_'):
        return ('Inpatients by Race', 100)
    if starts('inpatient_days_by_race') or name_starts('days_by_race_'):
        return ('Inpatient Days by Race', 110)
    if starts('inpatients_by_ethnicity') or name_starts('eth_inp_'):
        return ('Inpatients by Ethnicity', 120)
    if starts('inpatient_days_by_ethnicity') or name_starts('days_by_eth_'):
        return ('Inpatient Days by Ethnicity', 130)
    if starts('surgery.or_class_c') or name_starts('or_rooms_', 'or_cases_', 'or_hours_'):
        return ('Surgery — OR Class C', 140)
    if starts('surgery.class_b') or name_starts('procB_'):
        return ('Surgery — Class B', 150)
    return ('Other', 999)


def _render_hospital_matrices(payload: Dict[str, Any]) -> Tuple[str, set[str]]:
    used: set[str] = set()
    parts: List[str] = []

    # Utilization matrix (Admissions / Days / Beds (Oct 1))
    units = [
        ('Medical-Surgical',
         ('ms_total_admissions', 'med_surg_admissions'),
         ('ms_total_pd', 'med_surg_days_total'),
         ('ms_beds_10_1_23', 'med_surg_beds_oct1')),
        ('ICU',
         ('total_icu_admissions', 'icu_total'),
         ('total_icu_patient_days', 'icu_days'),
         ('total_icu_beds_10_1_23', 'icu_beds_oct1')),
        ('OB/GYN',
         ('total_ob_gyn_admissions', 'obgyn_admissions_total'),
         ('total_ob_gyn_patient_days', 'obgyn_days_total'),
         ('ob_gyn_beds_10_1_23', 'obgyn_beds_oct1')),
        ('Pediatrics',
         ('peds_admissions', 'pediatric_admissions', 'pedadm'),
         ('peds_days', 'pediatric_patient_days', 'pedipd'),
         ('peds_beds_oct1', 'pediatric_beds_set_up_10_1_23', 'ped_oct1')),
        ('NICU',
         ('nicu_admissions', 'nn_icu_admissions', 'ntliiiadm'),
         ('nicu_days', 'nn_icu_patient_days', 'ntliiiipd'),
         ('nn_icu_beds_on_10_1_23', 'nicu_beds_oct1')),
        ('LTC', ('ltc_admissions',), ('ltc_days',), tuple()),
        ('Swing', ('swing_admissions',), ('swing_days',), tuple()),
    ]

    util_rows: List[List[Any]] = []
    for label, adm_keys, day_keys, bed_keys in units:
        adm = next((payload.get(k) for k in adm_keys if k in payload and str(payload.get(k) or '').strip() != ''), '')
        day = next((payload.get(k) for k in day_keys if k in payload and str(payload.get(k) or '').strip() != ''), '')
        bed = next((payload.get(k) for k in bed_keys if k in payload and str(payload.get(k) or '').strip() != ''), '')
        if str(adm).strip() != '' or str(day).strip() != '' or str(bed).strip() != '':
            util_rows.append([label, adm, day, bed])
            for k in list(adm_keys) + list(day_keys) + list(bed_keys):
                if k:
                    used.add(k)
    if util_rows:
        parts.append(section_card('Inpatient Utilization by Unit', table_matrix(['Unit', 'Admissions', 'Inpatient Days', 'Beds (Oct 1)'], util_rows), 'col-12'))

    # Surgery matrices (OR Class C and Class B)
    def surgery_matrix(prefix: str, title: str) -> None:
        specs: Dict[str, Dict[str, Any]] = {}
        for k, v in payload.items():
            if not isinstance(k, str) or not k.startswith(prefix):
                continue
            if str(v or '').strip() == '':
                continue
            parts_k = k.split('_')
            metric = '_'.join(parts_k[0:2])  # e.g., or_rooms, or_cases, or_hours or procB_rooms, etc.
            rest = parts_k[2:]
            # For or_* keys, format like or_rooms_ip_<spec>, or_hours_total_<spec>
            if prefix == 'or_':
                if len(rest) >= 2:
                    sub = rest[0]  # ip, op, combined, total
                    spec = '_'.join(rest[1:])
                else:
                    continue
            else:
                # procB_rooms_op_gastro_intestinal => metric=procB_rooms, sub=op, spec=gastro_intestinal
                if len(rest) >= 2:
                    sub = rest[0]
                    spec = '_'.join(rest[1:])
                else:
                    continue
            rec = specs.setdefault(spec, {})
            rec[f'{metric}_{sub}'] = v
            used.add(k)

        if not specs:
            return
        cols = ['Specialty', 'Rooms IP', 'Rooms OP', 'Rooms Combined', 'Cases IP', 'Cases OP', 'Hours IP', 'Hours OP', 'Hours Total']
        rows: List[List[Any]] = []
        for spec, kv in sorted(specs.items()):
            row = [spec.replace('_', ' ').title(),
                   kv.get('or_rooms_ip') or kv.get('procB_rooms_ip') or '',
                   kv.get('or_rooms_op') or kv.get('procB_rooms_op') or '',
                   kv.get('or_rooms_combined') or kv.get('procB_rooms_combined') or '',
                   kv.get('or_cases_ip') or kv.get('procB_cases_ip') or '',
                   kv.get('or_cases_op') or kv.get('procB_cases_op') or '',
                   kv.get('or_hours_ip') or kv.get('procB_hours_ip') or '',
                   kv.get('or_hours_op') or kv.get('procB_hours_op') or '',
                   kv.get('or_hours_total') or kv.get('procB_hours_total') or '',]
            rows.append(row)
        parts.append(section_card(title, table_matrix(cols, rows), 'col-12'))

    surgery_matrix('or_', 'Surgical Services — OR Class C')
    surgery_matrix('procB_', 'Surgical Services — Class B')

    # Finance — Net Revenue by Source (Inpatient / Outpatient)
    def _fmt_currency(v: Any) -> str:
        try:
            import re
            s = re.sub(r'[^0-9\-\.]', '', str(v))
            if s in ('', '.', '-'):
                return ''
            x = float(s)
            return f"${x:,.0f}"
        except Exception:
            return str(v)
    def finance_rows(prefix: str) -> Tuple[str, List[List[Any]], bool]:
        mapping = [
            ('Medicare', f'{prefix}_medicare_revenue'),
            ('Medicaid', f'{prefix}_medicaid_revenue'),
            ('Other Public', f'{prefix}_other_public_revenue'),
            ('Private Insurance', f'{prefix}_private_insurance_revenue'),
            ('Private Payment', f'{prefix}_private_payment_revenue'),
        ]
        rows: List[List[Any]] = []
        any_val = False
        for lab, key in mapping:
            val = payload.get(key, '')
            if str(val or '').strip() != '':
                any_val = True
            rows.append([lab, _fmt_currency(val)])
            used.add(key)
        title = 'Inpatient Net Revenue by Source' if prefix == 'inpatient' else 'Outpatient Net Revenue by Source'
        return (title, rows, any_val)

    t1, r1, ok1 = finance_rows('inpatient')
    if ok1:
        parts.append(section_card(t1, table_matrix(['Source', 'Net Revenue'], r1), 'col-12'))
    t2, r2, ok2 = finance_rows('outpatient')
    if ok2:
        parts.append(section_card(t2, table_matrix(['Source', 'Net Revenue'], r2), 'col-12'))

    return ''.join(parts), used


def _render_esrd_matrices(payload: Dict[str, Any]) -> Tuple[str, set[str]]:
    used: set[str] = set()
    parts: List[str] = []

    # Stations snapshot matrix
    stations_headers = ['Jan 1 Auth', 'Jan 1 Cert', 'Dec 31 Auth', 'Dec 31 Cert', 'Highest Operational', 'Oct Setup Staffed', 'Oct Isolation']
    stations_keys = ['stations_jan1_auth', 'stations_jan1_cert', 'stations_dec31_auth', 'stations_dec31_cert', 'stations_highest_operational', 'stations_oct_setup_staffed', 'stations_oct_isolation']
    stations_vals = [payload.get(k, '') for k in stations_keys]
    if any(str(v or '').strip() != '' for v in stations_vals):
        parts.append(section_card('Stations (Snapshot)', table_matrix(['Metric'] + stations_headers, [['Stations'] + stations_vals]), 'col-12'))
        used.update([k for k in stations_keys if k])

    # Shifts per day matrix (Mon..Sun)
    shifts_headers = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    shift_keys = ['shifts_mon', 'shifts_tue', 'shifts_wed', 'shifts_thu', 'shifts_fri', 'shifts_sat', 'shifts_sun']
    shift_vals = [payload.get(k, '') for k in shift_keys]
    if any(str(v or '').strip() != '' for v in shift_vals):
        parts.append(section_card('Shifts Per Day', table_matrix(['Metric'] + shifts_headers, [['Shifts'] + shift_vals]), 'col-12'))
        used.update([k for k in shift_keys if k])

    # Weekly Hours and Patients (Oct 1-7) matrices
    oct_headers = ['Oct 1', 'Oct 2', 'Oct 3', 'Oct 4', 'Oct 5', 'Oct 6', 'Oct 7']
    hours_keys = ['hours_oct1','hours_oct2','hours_oct3','hours_oct4','hours_oct5','hours_oct6','hours_oct7']
    pats_keys = ['patients_oct1','patients_oct2','patients_oct3','patients_oct4','patients_oct5','patients_oct6','patients_oct7']
    hours_vals = [payload.get(k, '') for k in hours_keys]
    pats_vals = [payload.get(k, '') for k in pats_keys]
    if any(str(v or '').strip() != '' for v in hours_vals):
        parts.append(section_card('Weekly Operating Hours (Oct)', table_matrix(['Metric'] + oct_headers, [['Hours'] + hours_vals]), 'col-12'))
        used.update([k for k in hours_keys if k])
    if any(str(v or '').strip() != '' for v in pats_vals):
        parts.append(section_card('Weekly Patients (Oct)', table_matrix(['Metric'] + oct_headers, [['Patients'] + pats_vals]), 'col-12'))
        used.update([k for k in pats_keys if k])

    # Finance — Net Revenue by Source
    fin_map = [
        ('Medicare', 'net_revenue_medicare'),
        ('Medicaid', 'net_revenue_medicaid'),
        ('Other Public', 'net_revenue_other_public'),
        ('Private Insurance', 'net_revenue_private_insur'),
        ('Private Payment', 'net_revenue_private_pay'),
    ]
    fin_rows: List[List[Any]] = []
    def _fmt_currency(v: Any) -> str:
        try:
            import re
            s = re.sub(r'[^0-9\-\.]', '', str(v))
            if s in ('', '.', '-'):
                return ''
            x = float(s)
            return f"${x:,.0f}"
        except Exception:
            return str(v)
    any_fin = False
    for lab, key in fin_map:
        val = payload.get(key, '')
        if str(val or '').strip() != '':
            any_fin = True
        fin_rows.append([lab, _fmt_currency(val)])
        used.add(key)
    total_rev = payload.get('total_revenue', '')
    if any_fin:
        parts.append(section_card('Net Revenue by Primary Source of Payment', table_matrix(['Source', 'Net Revenue'], fin_rows), 'col-12'))
        if str(total_rev or '').strip() != '':
            parts.append(section_card('Net Revenue — TOTAL', table_matrix(['Metric', 'Amount'], [['TOTAL', _fmt_currency(total_rev)]]), 'col-12'))
            used.add('total_revenue')

    # Staffing (FTEs) matrix
    staff_rows: List[List[Any]] = []
    staff_specs = [
        ('Registered Nurses (FTEs)', 'fte_rn'),
        ('Dialysis Technicians (FTEs)', 'fte_techs'),
        ('Dieticians (FTEs)', 'fte_dieticians'),
        ('Social Workers (FTEs)', 'fte_social_workers'),
        ('LPNs (FTEs)', 'fte_lpns'),
        ('Other Health-related Professionals (FTEs)', 'fte_other_health'),
        ('Other Non Health-related Professionals (FTEs)', 'fte_other_nonhealth'),
        ('Total FTEs Employed', 'fte_total'),
    ]
    any_staff = False
    for label, key in staff_specs:
        val = payload.get(key, '')
        if str(val or '').strip() != '':
            any_staff = True
        staff_rows.append([label, val])
        used.add(key)
    if any_staff:
        parts.append(section_card('Staffing (FTEs)', table_matrix(['Role', 'FTEs'], staff_rows), 'col-12'))

    # Patient Flow (Year)
    flow_labels = [
        ('Patients — Jan 1', 'beginning_patients'),
        ('Patients — Dec 31', 'ending_patients'),
        ('Unduplicated Patients Treated', 'total_patients_treated'),
        ('New Patients', 'number_of_new_patients'),
        ('Transient Patients', 'number_of_transient_patients'),
        ('Re-started Dialysis', 'number_patients_re_started'),
        ('Resumed after Transplant', 'number_post_transplant'),
        ('Recovered Kidney Function', 'number_recovered'),
        ('Transplant Recipients Ended', 'number_of_transplant_recipients'),
        ('Transferred Out', 'number_transferred'),
        ('Voluntarily Discontinued', 'number_voluntarily_discontinued'),
        ('Lost to Follow-up', 'number_lost_to_follow_up'),
        ('Deaths', 'number_of_patients_died'),
    ]
    flow_rows: List[List[Any]] = []
    any_flow = False
    for lab, key in flow_labels:
        val = payload.get(key, '')
        if str(val or '').strip() != '':
            any_flow = True
        flow_rows.append([lab, val])
        used.add(key)
    if any_flow:
        parts.append(section_card('Patient Flow (Year)', table_matrix(['Metric', 'Count'], flow_rows), 'col-12'))

    return ''.join(parts), used


def _render_astc_matrices(payload: Dict[str, Any]) -> Tuple[str, set[str]]:
    used: set[str] = set()
    parts: List[str] = []

    # Patients by Age (Male, Female, Total)
    age_specs = [
        ('0-14', 'patients_age_male_0_14', 'patients_age_female_0_14'),
        ('15-44', 'patients_age_male_15_44', 'patients_age_female_15_44'),
        ('45-64', 'patients_age_male_45_64', 'patients_age_female_45_64'),
        ('65-74', 'patients_age_male_65_74', 'patients_age_female_65_74'),
        ('75+', 'patients_age_male_75_plus', 'patients_age_female_75_plus'),
    ]
    age_rows: List[List[Any]] = []
    any_age = False
    for label, mk, fk in age_specs:
        mv = payload.get(mk, '')
        fv = payload.get(fk, '')
        if str(mv or '').strip() != '' or str(fv or '').strip() != '':
            any_age = True
        # compute total if numeric
        try:
            mt = float(str(mv).replace(',', '')) if str(mv or '').strip() != '' else 0
            ft = float(str(fv).replace(',', '')) if str(fv or '').strip() != '' else 0
            tv = mt + ft
        except Exception:
            tv = ''
        age_rows.append([label, mv, fv, tv])
        used.update([mk, fk])
    if any_age:
        parts.append(section_card('Patients by Age Group and Sex', table_matrix(['Age Group', 'Male', 'Female', 'Total'], age_rows), 'col-12'))

    # Patients by Payment and Sex matrix
    sources = [
        ('Medicaid', 'medicaid'),
        ('Medicare', 'medicare'),
        ('Other Public', 'other_public'),
        ('Private Insurance', 'private_insurance'),
        ('Private Payment', 'private_payment'),
        ('Charity Care', 'charity_care'),
    ]
    rows: List[List[Any]] = []
    any_val = False
    for label, key in sources:
        m_key = f'patients_payment_male_{key}'
        f_key = f'patients_payment_female_{key}'
        mv = payload.get(m_key, '')
        fv = payload.get(f_key, '')
        if str(mv or '').strip() != '' or str(fv or '').strip() != '':
            any_val = True
        # compute total if both provided
        try:
            mt = float(str(mv).replace(',', '')) if str(mv or '').strip() != '' else 0
            ft = float(str(fv).replace(',', '')) if str(fv or '').strip() != '' else 0
            tv = mt + ft
        except Exception:
            tv = ''
        rows.append([label, mv, fv, tv])
        used.update([m_key, f_key])
    if any_val:
        parts.append(section_card('Patients by Primary Source of Payment and Sex', table_matrix(['Payment Source', 'Male', 'Female', 'Total'], rows), 'col-12'))

    # Hours by Weekday (Mon..Sun)
    hours_map = [
        ('Monday', 'hours_mon'),
        ('Tuesday', 'hours_tue'),
        ('Wednesday', 'hours_wed'),
        ('Thursday', 'hours_thu'),
        ('Friday', 'hours_fri'),
        ('Saturday', 'hours_sat'),
        ('Sunday', 'hours_sun'),
    ]
    hrs_rows: List[List[Any]] = []
    any_hrs = False
    for lab, key in hours_map:
        val = payload.get(key, '')
        if str(val or '').strip() != '':
            any_hrs = True
        hrs_rows.append([lab, val])
        used.add(key)
    if any_hrs:
        parts.append(section_card('Operating Hours by Weekday', table_matrix(['Day', 'Hours'], hrs_rows), 'col-12'))

    # Rooms
    rooms_rows: List[List[Any]] = []
    for lab, key in [('Exam Rooms', 'rooms_exam'), ('OR Rooms — Class C', 'rooms_or_class_c')]:
        val = payload.get(key, '')
        if str(val or '').strip() != '':
            rooms_rows.append([lab, val])
            used.add(key)
    if rooms_rows:
        parts.append(section_card('Rooms', table_matrix(['Room', 'Count'], rooms_rows), 'col-12'))

    # Staffing FTEs
    staff_specs_astc = [
        ('Administrators (FTEs)', 'fte_admin'),
        ('Registered Nurses (FTEs)', 'fte_rn'),
        ('CRNA (FTEs)', 'fte_crna'),
        ('Director of Nursing (FTEs)', 'fte_don'),
        ('Certified Aides (FTEs)', 'fte_cert_aides'),
        ('Physicians (FTEs)', 'fte_physicians'),
        ('Other Health-related (FTEs)', 'fte_other_health'),
        ('Other Non Health-related (FTEs)', 'fte_other_nonhealth'),
    ]
    staff_rows_astc: List[List[Any]] = []
    any_staff_astc = False
    for lab, key in staff_specs_astc:
        val = payload.get(key, '')
        if str(val or '').strip() != '':
            any_staff_astc = True
        staff_rows_astc.append([lab, val])
        used.add(key)
    if any_staff_astc:
        parts.append(section_card('Staffing (FTEs)', table_matrix(['Role', 'FTEs'], staff_rows_astc), 'col-12'))

    return ''.join(parts), used


def _render_ltc_matrices(payload: Dict[str, Any]) -> Tuple[str, set[str]]:
    used: set[str] = set()
    parts: List[str] = []

    # Beds snapshot (IDD)
    beds_headers = ['Licensed (IDD)', 'Setup (IDD)', 'Occupied (IDD)', 'Peak Setup (IDD)', 'Peak Occupied (IDD)']
    beds_keys = ['beds_licensed_idd', 'beds_setup_idd', 'beds_occupied_idd', 'beds_peak_setup_idd', 'beds_peak_occupied_idd']
    bed_vals = [payload.get(k, '') for k in beds_keys]
    if any(str(v or '').strip() != '' for v in bed_vals):
        parts.append(section_card('Beds & Occupancy (IDD)', table_matrix(['Metric'] + beds_headers, [['Beds'] + bed_vals]), 'col-12'))
        used.update([k for k in beds_keys if k])

    # Resident flow
    flow_headers = ['Census Jan 1', 'Initial Admissions', 'Discharges (Permanent)', 'Total Days (IDD)']
    flow_keys = ['census_jan1', 'admissions_initial', 'discharges_permanent', 'days_total_idd']
    flow_vals = [payload.get(k, '') for k in flow_keys]
    if any(str(v or '').strip() != '' for v in flow_vals):
        parts.append(section_card('Resident Flow', table_matrix(['Metric'] + flow_headers, [['Values'] + flow_vals]), 'col-12'))
        used.update([k for k in flow_keys if k])

    # Payer Mix — Counts and Patient Days
    payer_counts = [
        ('Medicare', 'patient_count_medicare'),
        ('Medicaid', 'patient_count_medicaid'),
        ('Private Insurance', 'patient_count_private_insurance'),
        ('Private Payment', 'patient_count_private_payment'),
        ('Other Public', 'patient_count_other_public'),
        ('Charity Care', 'patient_count_charity_care'),
    ]
    payer_days = [
        ('Medicare', 'patient_days_medicare'),
        ('Medicaid', 'patient_days_medicaid'),
        ('Private Insurance', 'patient_days_private_insurance'),
        ('Private Payment', 'patient_days_private_payment'),
        ('Other Public', 'patient_days_other_public'),
        ('Charity Care', 'patient_days_charity_care'),
    ]
    cnt_rows: List[List[Any]] = []
    any_cnt = False
    for lab, key in payer_counts:
        val = payload.get(key, '')
        if str(val or '').strip() != '':
            any_cnt = True
        cnt_rows.append([lab, val])
        used.add(key)
    if any_cnt:
        parts.append(section_card('Payers — Resident Counts', table_matrix(['Payer', 'Count'], cnt_rows), 'col-12'))
    day_rows: List[List[Any]] = []
    any_days = False
    for lab, key in payer_days:
        val = payload.get(key, '')
        if str(val or '').strip() != '':
            any_days = True
        day_rows.append([lab, val])
        used.add(key)
    if any_days:
        parts.append(section_card('Payers — Patient Days', table_matrix(['Payer', 'Days'], day_rows), 'col-12'))

    # Room Rates (if present)
    rate_rows: List[Tuple[str, Any]] = []
    for k, lab in [('private_room_rate', 'Private Room Rate'), ('shared_room_rate', 'Shared Room Rate')]:
        v = payload.get(k)
        if v is not None and str(v).strip() != '':
            rate_rows.append((lab, v))
            used.add(k)
    if rate_rows:
        parts.append(_card('Room Rates', rate_rows))

    # Finance — Net Revenue by Source
    ltc_fin_map = [
        ('Medicare', 'net_revenue_medicare'),
        ('Medicaid', 'net_revenue_medicaid'),
        ('Other Public', 'net_revenue_other_public'),
        ('Private Insurance', 'net_revenue_private_insurance'),
        ('Private Payment', 'net_revenue_private_payment'),
    ]
    ltc_rows: List[List[Any]] = []
    def _fmt_currency(v: Any) -> str:
        try:
            import re
            s = re.sub(r'[^0-9\-\.]', '', str(v))
            if s in ('', '.', '-'):
                return ''
            x = float(s)
            return f"${x:,.0f}"
        except Exception:
            return str(v)
    any_ltc_fin = False
    for lab, key in ltc_fin_map:
        val = payload.get(key, '')
        if str(val or '').strip() != '':
            any_ltc_fin = True
        ltc_rows.append([lab, _fmt_currency(val)])
        used.add(key)
    total_key = 'net_revenue_total'
    if any_ltc_fin:
        parts.append(section_card('Net Revenue by Primary Source of Payment', table_matrix(['Source', 'Net Revenue'], ltc_rows), 'col-12'))
        if str(payload.get(total_key, '') or '').strip() != '':
            parts.append(section_card('Net Revenue — TOTAL', table_matrix(['Metric', 'Amount'], [['TOTAL', _fmt_currency(payload.get(total_key, ''))]]), 'col-12'))
            used.add(total_key)

    return ''.join(parts), used


def _card(title: str, rows: List[Tuple[str, Any]]) -> str:
    # 2-column table with friendly labels
    def pretty_label(s: str) -> str:
        return s.replace('_', ' ').replace('-', ' ').strip().title()
    trows: List[Tuple[int, str, str]] = []
    order = 0
    for k, v in rows:
        label = pretty_label(k)
        trows.append((order, label, str(v)))
        order += 1
    return section_card(title, table(trows, ('Field', 'Value')), 'col-12')


def _render_hospital_curated(payload: Dict[str, Any]) -> Tuple[str, set[str]]:
    used: set[str] = set()
    parts: List[str] = []

    # Try template first
    try:
        tpl_path = Path('templates/profile_hospital_2022.json')
        if tpl_path.exists():
            spec = json.loads(tpl_path.read_text(encoding='utf-8'))
            for sec in spec.get('sections', []):
                st = sec.get('type')
                title = sec.get('title', '')
                width = sec.get('width', 'col-12')
                if st == 'table':
                    fields = sec.get('fields', [])
                    rows = []
                    for k in fields:
                        v = payload.get(k)
                        if v is not None and str(v).strip() != '':
                            rows.append((k, v))
                            used.add(k)
                    if rows:
                        parts.append(_card(title, rows))
                elif st == 'util_matrix':
                    units = sec.get('units', [])
                    util_rows: List[Tuple[int, str, str]] = []
                    order = 0
                    for u in units:
                        lab = u.get('label', '')
                        def first(keys: List[str]) -> Any:
                            for kk in keys:
                                vv = payload.get(kk)
                                if vv is not None and str(vv).strip() != '':
                                    used.add(kk)
                                    return vv
                            return ''
                        adm = first(u.get('admissions', []))
                        days = first(u.get('days', []))
                        beds = first(u.get('beds', []))
                        if str(adm).strip() or str(days).strip() or str(beds).strip():
                            util_rows.append((order, lab, f"{fmt_value(adm)} / {fmt_value(days)} / {fmt_value(beds)}"))
                            order += 1
                    if util_rows:
                        parts.append(section_card(title, table(util_rows, ('Unit', 'Admissions / Days / Beds')), 'col-12'))
                elif st == 'label_map':
                    labels = sec.get('labels', {})
                    rows_lm: List[Tuple[int, str, str]] = []
                    order = 0
                    for nice, key in labels.items():
                        v = payload.get(key)
                        if v is not None and str(v).strip() != '':
                            rows_lm.append((order, nice, str(v)))
                            used.add(key)
                            order += 1
                    if rows_lm:
                        parts.append(section_card(title, table(rows_lm, ('Field', 'Value')), width))
                elif st == 'surgery':
                    prefix = sec.get('prefix', '')
                    if not prefix:
                        continue
                    spec_map: Dict[str, Dict[str, Any]] = {}
                    for k, v in payload.items():
                        if not isinstance(k, str) or not k.startswith(prefix):
                            continue
                        if str(v).strip() == '':
                            continue
                        used.add(k)
                        spname = k.split('_')[-1]
                        spec_map.setdefault(spname, {})[k] = v
                    rows: List[Tuple[int, str, str]] = []
                    order = 0
                    for sp, kv in sorted(spec_map.items()):
                        try:
                            import re
                            def sum_keys(substr: str) -> int:
                                total = 0
                                for kk, vv in kv.items():
                                    if substr in kk:
                                        s = re.sub(r'[^0-9\-\.]', '', str(vv))
                                        if s not in ('', '.', '-'):
                                            total += int(float(s))
                                return total
                            rooms = sum_keys('rooms_')
                            cases = sum_keys('cases_')
                            hours = sum_keys('hours_')
                            val = f"Rooms {rooms} / Cases {cases} / Hours {hours}"
                        except Exception:
                            val = '—'
                        rows.append((order, sp.replace('_', ' ').title(), val))
                        order += 1
                    if rows:
                        parts.append(section_card(title, table(rows, ('Specialty', 'Summary')), 'col-12'))
            return ''.join(parts), used
    except Exception:
        # If template parsing fails, fall back to built-in curated logic below
        parts = []
        used.clear()

    # Facility: identity basics if present (fallback)
    fac_rows = []
    for k in ['facility_name', 'address_line1', 'address_city', 'address_state', 'address_zip', 'license_idph', 'fein']:
        if k in payload and str(payload[k]).strip():
            fac_rows.append((k, payload[k]))
            used.add(k)
    if fac_rows:
        parts.append(_card('Facility', fac_rows))

    # Ownership & Organization
    own_rows = []
    for k in ['operator_entity', 'plant_owner', 'ownership_type', 'cms_certification', 'hospital_characterization', 'chna_url']:
        if k in payload and str(payload[k]).strip():
            own_rows.append((k, payload[k]))
            used.add(k)
    if own_rows:
        parts.append(_card('Ownership & Organization', own_rows))

    # Management Contracts
    mgmt_rows = []
    for k in ['mgmt_emergency', 'mgmt_psych', 'mgmt_rehab']:
        if k in payload and str(payload[k]).strip():
            mgmt_rows.append((k, payload[k]))
            used.add(k)
    if mgmt_rows:
        parts.append(_card('Management Contracts', mgmt_rows))

    # Utilization matrix (Admissions, Days, Beds)
    def to_num(x: Any) -> int:
        try:
            import re
            s = re.sub(r'[^0-9\-\.]', '', str(x))
            return int(float(s)) if s not in ('', '.', '-') else 0
        except Exception:
            return 0

    units = [
        ('Medical-Surgical',
         ('ms_total_admissions', 'med_surg_admissions'),
         ('ms_total_pd', 'med_surg_days_total'),
         ('ms_beds_10_1_23', 'med_surg_beds_oct1'),
        ),
        ('ICU',
         ('total_icu_admissions', 'icu_total'),
         ('total_icu_patient_days', 'icu_days'),
         ('total_icu_beds_10_1_23', 'icu_beds_oct1'),
        ),
        ('OB/GYN',
         ('total_ob_gyn_admissions', 'obgyn_admissions_total'),
         ('total_ob_gyn_patient_days', 'obgyn_days_total'),
         ('ob_gyn_beds_10_1_23', 'obgyn_beds_oct1'),
        ),
        ('Pediatrics',
         ('peds_admissions', 'pediatric_admissions', 'pedadm'),
         ('peds_days', 'pediatric_patient_days', 'pedipd'),
         ('peds_beds_oct1', 'pediatric_beds_set_up_10_1_23', 'ped_oct1'),
        ),
        ('NICU',
         ('nicu_admissions', 'nn_icu_admissions', 'ntliiiadm'),
         ('nicu_days', 'nn_icu_patient_days', 'ntliiiipd'),
         ('nn_icu_beds_on_10_1_23', 'nicu_beds_oct1'),
        ),
        ('LTC',
         ('ltc_admissions',),
         ('ltc_days',),
         (None,),
        ),
        ('Swing',
         ('swing_admissions',),
         ('swing_days',),
         (None,),
        ),
    ]
    util_headers = ('Unit', 'Admissions', 'Inpatient Days', 'Beds (Oct 1)')
    util_rows: List[Tuple[int, str, str]] = []
    order = 0
    for (label, adm_keys, day_keys, bed_keys) in units:
        def first_val(keys: Tuple[Any, ...]) -> Any:
            for k in keys:
                if not k:
                    continue
                v = payload.get(k)
                if v is not None and str(v).strip() != '':
                    used.add(k)
                    return v
            return ''
        adm = first_val(adm_keys)
        days = first_val(day_keys)
        beds = first_val(bed_keys)
        if str(adm).strip() or str(days).strip() or str(beds).strip():
            util_rows.append((order, label, f"{fmt_value(adm)} / {fmt_value(days)} / {fmt_value(beds)}"))
            order += 1
    if util_rows:
        # Expand into 3-column table presented with combined value string label; keep simple for now
        # Render as 2-col where Value has 'Admissions / Days / Beds'
        parts.append(section_card('Inpatient Utilization by Unit', table(util_rows, ('Unit', 'Admissions / Days / Beds')), 'col-12'))

    # Outpatient Activity
    out_rows = []
    for k in ['op_visits_on', 'op_visits_off', 'op_visits_total', 'obs_unit_beds', 'obs_unit_days']:
        if k in payload and str(payload[k]).strip():
            out_rows.append((k, payload[k]))
            used.add(k)
    if out_rows:
        parts.append(_card('Outpatient Activity', out_rows))

    # Payer Mix — Inpatient
    payer = [
        ('Inpatients by Payment — Medicare', 'pay_inp_medicare'),
        ('Inpatients by Payment — Medicaid', 'pay_inp_medicaid'),
        ('Inpatients by Payment — Private Insurance', 'pay_inp_private_ins'),
        ('Inpatients by Payment — Other Public', 'pay_inp_other_public'),
        ('Inpatients by Payment — Private Payment', 'pay_inp_private_pay'),
    ]
    payer_rows: List[Tuple[int, str, str]] = []
    order = 0
    for label, key in payer:
        v = payload.get(key)
        if v is not None and str(v).strip():
            payer_rows.append((order, label, str(v)))
            used.add(key)
            order += 1
    if payer_rows:
        parts.append(section_card('Payer Mix — Inpatient', table(payer_rows, ('Field', 'Value')), 'col-12'))

    # Demographics — Race
    race_map = [
        ('Inpatients — White', 'race_inp_white'),
        ('Inpatients — Black/African American', 'race_inp_black'),
        ('Inpatients — Asian', 'race_inp_asian'),
        ('Inpatients — AI/AN', 'race_inp_ai_an'),
        ('Inpatients — NH/PI', 'race_inp_nh_pi'),
        ('Inpatients — Unknown Race', 'race_inp_unknown'),
    ]
    race_rows: List[Tuple[int, str, str]] = []
    order = 0
    for label, key in race_map:
        v = payload.get(key)
        if v is not None and str(v).strip():
            race_rows.append((order, label, str(v)))
            used.add(key)
            order += 1
    if race_rows:
        parts.append(section_card('Inpatients by Race', table(race_rows, ('Field', 'Value')), 'col-6'))

    # Demographics — Inpatient Days by Race
    days_race_map = [
        ('Inpatient Days — White', 'days_by_race_white'),
        ('Inpatient Days — Black/African American', 'days_by_race_black'),
        ('Inpatient Days — Asian', 'days_by_race_asian'),
        ('Inpatient Days — AI/AN', 'days_by_race_ai_an'),
        ('Inpatient Days — NH/PI', 'days_by_race_nh_pi'),
        ('Inpatient Days — Unknown Race', 'days_by_race_unknown'),
    ]
    dr_rows: List[Tuple[int, str, str]] = []
    order = 0
    for label, key in days_race_map:
        v = payload.get(key)
        if v is not None and str(v).strip():
            dr_rows.append((order, label, str(v)))
            used.add(key)
            order += 1
    if dr_rows:
        parts.append(section_card('Inpatient Days by Race', table(dr_rows, ('Field', 'Value')), 'col-6'))

    # Demographics — Ethnicity
    eth_map = [
        ('Inpatients — Hispanic/Latino', 'eth_inp_hispanic'),
        ('Inpatients — Not Hispanic/Latino', 'eth_inp_not_hispanic'),
        ('Inpatients — Ethnicity Unknown', 'eth_inp_unknown'),
        ('Inpatient Days — Hispanic/Latino', 'days_by_eth_hispanic'),
        ('Inpatient Days — Not Hispanic/Latino', 'days_by_eth_not_hispanic'),
        ('Inpatient Days — Unknown', 'days_by_eth_unknown'),
    ]
    eth_rows: List[Tuple[int, str, str]] = []
    order = 0
    for label, key in eth_map:
        v = payload.get(key)
        if v is not None and str(v).strip():
            eth_rows.append((order, label, str(v)))
            used.add(key)
            order += 1
    if eth_rows:
        parts.append(section_card('Inpatients by Ethnicity', table([r for r in eth_rows if 'Inpatients —' in r[1]], ('Field', 'Value')), 'col-6'))
        parts.append(section_card('Inpatient Days by Ethnicity', table([r for r in eth_rows if 'Inpatient Days —' in r[1]], ('Field', 'Value')), 'col-6'))

    # Surgery — OR Class C (specialty matrix)
    def collect_specialty(prefix: str) -> Tuple[str, List[Tuple[int, str, str]]]:
        # prefix: 'or_' fields for Class C or 'procB_' for Class B
        spec_map: Dict[str, Dict[str, Any]] = {}
        for k, v in payload.items():
            if not isinstance(k, str) or not k.startswith(prefix):
                continue
            if str(v).strip() == '':
                continue
            used.add(k)
            # Determine specialty name after last underscore
            parts_k = k.split('_')
            spec = parts_k[-1]
            spec = spec.replace('nh', 'NH').replace('pi', 'PI') if spec in ('nh', 'pi') else spec
            spec_map.setdefault(spec, {})
            spec_map[spec][k] = v
        rows: List[Tuple[int, str, str]] = []
        order = 0
        for spec, kv in sorted(spec_map.items()):
            # Show raw totals for spec; keep simple: sum hours/cases if multiple fields
            try:
                import re
                def sum_keys(substr: str) -> int:
                    total = 0
                    for kk, vv in kv.items():
                        if substr in kk:
                            s = re.sub(r'[^0-9\-\.]', '', str(vv))
                            if s not in ('', '.', '-'):
                                total += int(float(s))
                    return total
                rooms = sum_keys('rooms_')
                cases = sum_keys('cases_')
                hours = sum_keys('hours_')
                val = f"Rooms {rooms} / Cases {cases} / Hours {hours}"
            except Exception:
                val = '—'
            rows.append((order, spec.replace('_', ' ').title(), val))
            order += 1
        title = 'Surgical Services — OR Class C' if prefix == 'or_' else 'Surgical Services — Class B'
        return title, rows

    title_c, rows_c = collect_specialty('or_')
    if rows_c:
        parts.append(section_card(title_c, table(rows_c, ('Specialty', 'Summary')), 'col-12'))
    title_b, rows_b = collect_specialty('procB_')
    if rows_b:
        parts.append(section_card(title_b, table(rows_b, ('Specialty', 'Summary')), 'col-12'))

    return ''.join(parts), used


def render(meta: Dict[str, Any], payload: Dict[str, Any], dict_meta: Dict[str, Dict[str, Any]], schema_name: str) -> str:
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
        f'  <div><div class="title">{html.escape(str(name))}</div>'
        f'       <div class="subtitle">{html.escape(str(city))}, {html.escape(str(state))} {html.escape(str(zipc))} • {html.escape(str(ftype))} • {html.escape(str(year))}</div></div>'
        '</div>'
    )
    # Optional hospital-specific matrices (utilization and surgery) to improve readability
    injected_html = ''
    used_keys: set[str] = set()
    if schema_name.startswith('ahq-'):
        injected_html, used_keys = _render_hospital_matrices(payload)
    elif schema_name == 'esrd':
        injected_html, used_keys = _render_esrd_matrices(payload)
    elif schema_name == 'astc':
        injected_html, used_keys = _render_astc_matrices(payload)
    elif schema_name.startswith('ltc') or schema_name.startswith('ltc-'):
        injected_html, used_keys = _render_ltc_matrices(payload)

    # Add demographics/payer charts block consistent with dashboard
    # Determine display type
    typemap = {'esrd': 'ESRD', 'astc': 'ASTC'}
    disp_type = ftype or typemap.get(schema_name, 'Hospital' if schema_name.startswith('ahq-') else '')
    if disp_type:
        injected_html = _charts_block(disp_type, payload) + injected_html

    # Build items grouped strictly by data dictionary field_id hierarchy
    # Section = first segment of field_id
    sections: Dict[str, Dict[str, Any]] = {}
    rendered_keys: set[str] = set(used_keys)
    # Iterate fields in dictionary order to ensure required fields are always shown
    dict_items_sorted = sorted(dict_meta.items(), key=lambda kv: kv[1].get('order', 0)) if dict_meta else []
    for key, info in dict_items_sorted:
        val = payload.get(key)
        sval = str(val).strip() if val is not None else ''
        # Skip keys already shown in matrices
        if key in used_keys:
            continue
        # Include this row if value present OR it is required by dictionary
        include = (sval != '') or bool(info.get('required'))
        if not include:
            continue
        fid = info.get('field_id', '') or ''
        segs = [s for s in fid.split('.') if s] if fid else []
        # Section key defaults to the first segment, with overrides for combined groups
        sec_key = (segs[0] if segs else info.get('section_key', 'Other')) or 'Other'
        # Normalize Outpatient Activity section naming
        if fid.startswith('op_') or key.startswith('op_visits') or key.startswith('obs_unit_'):
            sec_key = 'outpatient_activity'
        if fid.startswith('finance.net_revenues'):
            sec_key = 'finance.net_revenues'
        if fid.startswith('patients_by_payment'):
            sec_key = 'patients_by_payment'
        # Labels: prettify known acronyms, with specific title overrides
        def prettify(name: str) -> str:
            parts = name.replace('_', ' ').replace('.', ' — ').strip().split(' ')
            acros = {'icu':'ICU','nicu':'NICU','ltc':'LTC','cms':'CMS','idph':'IDPH','or':'OR','nh':'NH','pi':'PI','ob':'OB','gyn':'GYN','esrd':'ESRD','astc':'ASTC'}
            pp = [acros.get(p.lower(), p.title()) for p in parts]
            label = ' '.join(pp)
            label = label.replace('Ob Gyn', 'OB/GYN')
            return label
        if sec_key == 'patients_by_payment' or fid.startswith('patients.primary_payment') or fid.startswith('patients.payment'):
            sec_label = 'Patients by Primary Source of Payment'
        elif sec_key == 'finance.net_revenues':
            sec_label = 'Net Revenue by Primary Source of Payment'
        elif sec_key == 'outpatient_activity':
            sec_label = 'Outpatient Activity'
        else:
            sec_label = prettify(sec_key)
        sec_bucket = sections.setdefault(sec_key, {
            'label': sec_label,
            'order': info.get('order', 0),
            'rows': []
        })
        label = info.get('label') or key
        if not label or label == key:
            label = key.replace('_', ' ').replace('-', ' ').strip().title()
        display_val = sval if sval != '' else '—'
        row_order = info.get('order', 0)
        sec_bucket['rows'].append((row_order, label, display_val))
        rendered_keys.add(key)

    # Ensure address basics appear in Facility if available
    if any([address, city, state, zipc]):
        sec_bucket = sections.setdefault('facility', {'label': 'Facility', 'order': -1, 'rows': []})
        sec_bucket['rows'] = [(-100, 'Street', address), (-99, 'City/State/ZIP', f'{city}, {state} {zipc}')] + sec_bucket['rows']

    def normalize_section_label(ftype: str, label: str) -> str:
        s = (label or '').strip()
        sl = s.lower()
        t = (disp_type or ftype or '').lower()
        if t == 'hospital':
            if 'ownership' in sl or 'owner' in sl or 'organization' in sl:
                return 'Ownership & Organization'
            if 'management' in sl or 'mgmt' in sl:
                return 'Management Contracts'
            if sl in ('facility', 'facility information', 'facility info'):
                return 'Facility'
            if 'outpatient' in sl and 'activity' in sl:
                return 'Outpatient Activity'
        return s

    # Sort sections and subsections; rows by order then label
    ordered_sections = sorted(sections.items(), key=lambda kv: (kv[1]['order'], kv[1]['label']))
    cards_html = []
    for _, sec in ordered_sections:
        rows_sorted = sorted(sec['rows'], key=lambda r: (r[0], str(r[1]).lower()))
        pretty = normalize_section_label(disp_type, sec['label'])
        cards_html.append(section_card(pretty, table(rows_sorted, ('Field', 'Value')), 'col-12'))

    # Coverage verifier: compute missing dictionary keys not rendered; expose via ?debug=coverage
    import json as _json
    dict_keys = set(dict_meta.keys()) if dict_meta else set()
    missing = sorted([k for k in dict_keys if k not in rendered_keys])
    extra = sorted([k for k in rendered_keys if k not in dict_keys])
    cov_blob = _json.dumps({'total_dict': len(dict_keys), 'rendered': len(rendered_keys), 'missing': missing, 'extra': extra}, ensure_ascii=False)
    coverage_card = (
        '<div class="card col-12" id="coverage-card" style="display:none">'
        '  <h3>Coverage Report</h3>'
        '  <pre id="coverage-json" style="white-space:pre-wrap"></pre>'
        '</div>'
        '<script>(function(){ try { const data = ' + cov_blob + '; const u=new URL(window.location.href); if(u.searchParams.get("debug")===' + "'coverage'" + '){ const el=document.getElementById("coverage-json"); if(el){ el.textContent=JSON.stringify(data,null,2); document.getElementById("coverage-card").style.display="block"; } } } catch(e){} })();</script>'
    )

    # Build props map from dictionary metadata for client-side re-rendering
    import json as _json
    props = {}
    for k, info in dict_meta.items():
        sec_label = info.get('section_label') or 'Other'
        # Normalize to preferred phrasing in client-side view
        sec_label = normalize_section_label(disp_type, sec_label)
        # Coarse section order derived from the first time we see a section
        props[k] = {
            'x_label': info.get('label') or k,
            'x_section': sec_label,
            'x_section_order': 9999,  # will be normalized in JS
            'x_order': info.get('order', 0),
            'x_required': bool(info.get('required')),
            'description': (info.get('notes') or '') + (f" (Section/Page: {info.get('page')})" if info.get('page') else ''),
        }
    data_blob = _json.dumps({'payload': payload, 'props': props}, ensure_ascii=False)

    # Controls and container to allow client-side toggle of all fields
    controls = (
        '<div class="card col-12" id="pf-controls">'
        '  <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">'
        '    <label style="display:inline-flex;align-items:center;gap:6px">'
        '      <input type="checkbox" id="pfShowAll" /> Show all fields (include empty optionals)'
        '    </label>'
        '    <button id="pfExportAll" class="tiny">Export All Tables (CSV)</button>'
        '  </div>'
        '</div>'
    )

    client_js = (
        '<script>(function(){\n'
        '  try {\n'
        '    const DATA = ' + data_blob + ';\n'
        "    function fmt(n){const x=Number(String(n??'').replace(/[^0-9.-]/g,''));return Number.isFinite(x)?x.toLocaleString('en-US'):String(n??'');}\n"
        "    function csvEscape(v){const s=String(v==null?'':v);return /[\",\n]/.test(s)?'\"'+s.replace(/\"/g,'\"\"')+'\"':s;}\n"
        "    function tableToCSV(table,title){const rows=[]; if(title) rows.push([title]); const ths=table.querySelectorAll('thead th'); if(ths.length){rows.push(Array.from(ths).map(th=>th.textContent.trim()));} table.querySelectorAll('tbody tr').forEach(tr=>{rows.push(Array.from(tr.children).map(td=>td.textContent.trim()));}); return rows.map(r=>r.map(csvEscape).join(',')).join('\\n');}\n"
        "    function addPerCardExports(containerSel){const cont=(typeof containerSel==='string')?document.querySelector(containerSel):containerSel; if(!cont) return; cont.querySelectorAll('.card').forEach(card=>{const h3=card.querySelector('h3'); const table=card.querySelector('table'); if(!h3||!table) return; if(h3.querySelector('button[data-export]')) return; const btn=document.createElement('button'); btn.className='tiny'; btn.setAttribute('data-export',''); btn.textContent='Export CSV'; btn.addEventListener('click',()=>{const title=h3.childNodes[0]?h3.childNodes[0].textContent.trim():'table'; const csv=tableToCSV(table,title); const blob=new Blob([csv],{type:'text/csv'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); const safe=title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$|--+/g,'-'); a.download=(safe||'table')+'.csv'; document.body.appendChild(a); a.click(); a.remove();}); h3.appendChild(btn);});}\n"
        "    function renderAll(payload, props, showAll){const keys=new Set([...Object.keys(payload||{}), ...Object.keys(props||{})]); const items=[...keys].map(k=>{const p=props[k]||{};return {key:k,label:p.x_label||k,section:p.x_section||'Other',sectionOrder:Number(p.x_section_order||9999),order:Number(p.x_order||9999),desc:p.description||'',required:!!p.x_required,val:(payload||{})[k]};}).filter(it=> showAll || String(it.val??'').trim()!=='' || it.required); const secOrder={}; let idx=0; items.forEach(it=>{ if(!(it.section in secOrder)) secOrder[it.section]=++idx; if(!it.sectionOrder||it.sectionOrder===9999) it.sectionOrder=secOrder[it.section];}); items.sort((a,b)=> (a.sectionOrder-b.sectionOrder) || (a.order-b.order) || String(a.label).localeCompare(String(b.label))); const groups={}; items.forEach(it=>{(groups[it.section]=groups[it.section]||[]).push(it);}); const container=document.getElementById('all-sections'); if(!container) return; container.innerHTML=''; Object.keys(groups).forEach(sec=>{ const arr=groups[sec]; const rows=arr.map(it=>{ const label=it.required? (it.label+' *') : it.label; const val=String(it.val??'').trim().length? fmt(it.val) : (showAll? '' : '—'); return '<tr><td>'+label+'</td><td class=\"right\">'+val+'</td><td>'+(it.desc||'')+'</td></tr>'; }).join(''); const card=['<div class=\"card col-12\">','<h3>'+sec+'</h3>','<table><thead><tr><th>Field</th><th class=\"right\">Value</th><th>Description</th></tr></thead><tbody>'+rows+'</tbody></table>','</div>'].join(''); container.insertAdjacentHTML('beforeend', card); }); }\n"
        "    function exportAll(containerSel){ const cont=(typeof containerSel==='string')?document.querySelector(containerSel):containerSel; if(!cont) return ''; const parts=[]; cont.querySelectorAll('.card').forEach(card=>{ const h3=card.querySelector('h3'); const title=h3? (h3.childNodes[0]?.textContent?.trim()||'') : ''; const table=card.querySelector('table'); if(!table) return; parts.push(tableToCSV(table, title)); parts.push(''); }); return parts.join('\\n'); }\n"
        "    function applyFromURL(){ const u=new URL(window.location.href); const show=(u.searchParams.get('show')==='all'); const box=document.getElementById('pfShowAll'); if(box){ box.checked=show; } renderAll(DATA.payload, DATA.props, show); addPerCardExports('#all-sections'); addPerCardExports('#demo-tables'); const ex=document.getElementById('pfExportAll'); if(ex){ ex.addEventListener('click', ()=>{ const csv = [ exportAll('#demographics'), exportAll('#demo-tables'), exportAll('#all-sections') ].join('\n'); const blob=new Blob([csv],{type:'text/csv'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='profile-all-tables.csv'; document.body.appendChild(a); a.click(); a.remove(); }); } }\n"
        "    document.addEventListener('DOMContentLoaded', function(){ applyFromURL(); const box=document.getElementById('pfShowAll'); if(box){ box.addEventListener('change', ()=>{ const show=!!box.checked; const u=new URL(window.location.href); if(show) u.searchParams.set('show','all'); else u.searchParams.delete('show'); history.replaceState({},'',u.toString()); renderAll(DATA.payload, DATA.props, show); addPerCardExports('#all-sections'); }); } addPerCardExports('#demo-tables'); });\n"
        "    window.__renderAllFields = function(){ renderAll(DATA.payload, DATA.props, true); };\n"
        '  } catch(e) { /* noop */ }\n'
        '})();</script>'
    )

    return (
        '<!doctype html><html lang="en">'
        + head_html(f"{name} — Profile")
        + '<body>'
        + header
        + f'<main class="grid">' + injected_html + controls + '<div id="all-sections">' + ''.join(cards_html) + '</div>' + coverage_card + client_js + '</main>'
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
                schema_spec = doc.get('schema')
                dict_meta: Dict[str, Dict[str, Any]] = {}
                if schema_spec:
                    dict_meta = parse_dictionary(Path(schema_spec)) or {}
                html_text = render(meta, payload, dict_meta, _schema_name_from_path(schema_spec))
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
