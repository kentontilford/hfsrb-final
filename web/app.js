const state = { all: [], filtered: [], charts: {}, showAllFields: false, fullscreen: false };

function el(sel) { return document.querySelector(sel); }

// Safe helpers (no special characters)
function safeStr(n) {
return (n === undefined || n === null) ? '' : String(n);
}
function fmt(n) {
const x = Number(safeStr(n).replace(/[^0-9.-]/g, ''));
return Number.isFinite(x) ? x.toLocaleString('en-US') :
safeStr(n);
}
function toNum(n) {
const x = Number(safeStr(n).replace(/[^0-9.-]/g, ''));
return Number.isFinite(x) ? x : 0;
}
// Deep-link helpers
function getParams() {
const u = new URL(window.location.href);
return Object.fromEntries(u.searchParams.entries());
}
function setParams(params) {
  const u = new URL(window.location.href);
  Object.entries(params).forEach(([k, v]) => {
      if (v != null && String(v).length)
  u.searchParams.set(k, v);
      else u.searchParams.delete(k);
  });
  window.history.replaceState({}, '', u.toString());
}

const IS_WEB_SUBDIR = window.location.pathname.includes('/web/');

async function loadIndex() {
  // Load index
  const res = await fetch('data/index.json?v=2');
  state.all = await res.json();

  // Year options
  const years = [...new Set(state.all.map(r => r.year))].sort((a, b) => b - a);
  const ysel = el('#year');
  ysel.innerHTML = ['<option value="">All Years</option>']
    .concat(years.map(y => `<option>${y}</option>`))
    .join('');

  // County and Region (HSA) options
  const counties = [...new Set(state.all.map(r => r.county).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
  const regions = [...new Set(state.all.map(r => String(r.region || '')).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
  el('#county').innerHTML = ['<option value="">All Counties</option>']
    .concat(counties.map(c => `<option>${c}</option>`))
    .join('');
  el('#region').innerHTML = ['<option value="">All Regions</option>']
    .concat(regions.map(r => `<option>${r}</option>`))
    .join('');

  // Apply deep link
  const p = getParams();
  if (p.year) el('#year').value = p.year;
  if (p.type) el('#type').value = p.type;
  if (p.county) el('#county').value = p.county;
  if (p.region) el('#region').value = p.region;
  if (p.q) el('#q').value = p.q;
  // Show-all toggle deep link
  if (p.show === 'all') { state.showAllFields = true; }
  const showBox = el('#showAllFields'); if (showBox) showBox.checked = !!state.showAllFields;

  applyFilters();

  const p2 = getParams();
  if (p2.slug && p2.year && p2.type) {
    openDetail({ year: p2.year, type: p2.type, slug: p2.slug });
  }
}

function applyFilters() {
const year = el('#year').value;
const type = el('#type').value;
const county = el('#county').value;
const region = el('#region').value;
const q = el('#q').value.trim().toLowerCase();

let rows = state.all.slice();
if (year) rows = rows.filter(r => String(r.year) ===
String(year));
if (type) rows = rows.filter(r => r.type === type);
if (county) rows = rows.filter(r => (r.county || '')
=== county);
if (region) rows = rows.filter(r => String(r.region ||
'') === String(region));
if (q) rows = rows.filter(r => (r.name
+ ' ' + (r.city || '') + ' ' + (r.zip ||
'')).toLowerCase().includes(q));

state.filtered = rows;
renderList();

// Update URL
setParams({ year, type, county, region, q });
}

function renderList() {
  const ul = el('#list');
  ul.innerHTML = state.filtered.map(r => `
    <li data-year="${r.year}" data-type="${r.type}" data-slug="${r.slug}">
      <div class="name">${r.name}</div>
      <div class="meta">${r.type} • ${r.city || ''} ${r.zip || ''} • ${r.year} ${r.variant ? '• ' + r.variant : ''}</div>
    </li>`).join('');
  el('#stats').textContent = `${state.filtered.length} facilities`;

  ul.querySelectorAll('li').forEach(li => li.addEventListener('click', () => openDetail(li.dataset)));
}

function payerOrder(labels) {
  const order = ['Medicare', 'Medicaid', 'Private Insurance', 'Other Public', 'Private Pay', 'Charity Care'];
  return labels.slice().sort((a, b) => order.indexOf(a) - order.indexOf(b));
}
function raceOrder(labels) {
  const order = ['White', 'Black/African American', 'Black', 'Asian', 'AI/AN', 'American Indian', 'NH/PI', 'Unknown'];
  return labels.slice().sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

async function openDetail(data) {
const rec = state.filtered.find(r => r.year == data.year
&& r.type == data.type && r.slug == data.slug);
if (!rec) return;

const res = await fetch(IS_WEB_SUBDIR ? ('../' + rec.data_path) : rec.data_path);
const doc = await res.json();
const meta = doc.meta || {};
const p = doc.payload || {};
const schemaSpec = doc.schema || ''; // e.g., "schemas/json/ahq-short.schema.json"
// Prefer filename so we can fetch from /schemas/json/
  const schemaFile = schemaSpec.split('/').pop();

// Preload schema properties for CSV/export and field rendering
let schemaProps = {};
try {
  if (schemaFile) {
    const schemaURL = `${IS_WEB_SUBDIR ? '../' : ''}schemas/json/${schemaFile}`;
    const sres = await fetch(schemaURL);
    if (sres.ok) {
      const schema = await sres.json();
      schemaProps = schema.properties || {};
    }
  }
} catch {}

const d = el('#detail'); d.hidden = false;

el('#meta').innerHTML = `${meta.facility_name || p.facility_name || rec.name}
    <div class="meta">${p.address_line1 || p.facility_address || ''}, ${p.address_city || p.facility_city || ''} ${p.address_zip || p.facility_zip || ''} — ${rec.type} • ${rec.year}</div>`;

// Summary cards (Facility, Ownership, Management) for Hospital to mirror 2022 profile
buildSummaryCards(rec.type, p);

// Action links (work from /web/ during dev and site root in publish)
const links = [];
const siteBase = IS_WEB_SUBDIR ? '..' : '.';
links.push(`<a href="${siteBase}/out/profiles/${rec.year}/${rec.type}/${rec.slug}.html" target="_blank">Open Profile (HTML)</a>`);
links.push(`<a href="${siteBase}/out/profiles/${rec.year}/${rec.type}/${rec.slug}.pdf" target="_blank">Open Profile (PDF)</a>`);
links.push(`<button id="dlcsv">Download CSV</button>`);
links.push(`<button id="dlcharts">Download Charts (PNG)</button>`);
links.push(`<button id="shareLink">Copy Share Link</button>`);
el('#links').innerHTML = links.join(' ');

el('#dlcsv').addEventListener('click', () => downloadCSV(meta, p, schemaProps));
el('#dlcharts').addEventListener('click',
downloadCharts);
const shareBtn = el('#shareLink'); if (shareBtn)
shareBtn.addEventListener('click', copyShareLink);

// Fullscreen control
addFullscreenControl();
if (state.fullscreen) setFullscreen(true);
renderFullscreenBar({ year: rec.year, type: rec.type, slug: rec.slug, siteBase, meta, payload: p, schemaProps });

// Bind show-all toggle to re-render fields and sync URL
const showBox2 = el('#showAllFields');
if (showBox2) {
  showBox2.checked = !!state.showAllFields;
  showBox2.addEventListener('change', () => {
    state.showAllFields = !!showBox2.checked;
    renderAllFields(p, schemaProps, state.showAllFields);
    const cur = getParams();
    setParams({ ...cur, show: state.showAllFields ? 'all' : null });
  });
}

drawCharts(rec.type, p);

// Update URL with selected facility
setParams({ year: rec.year, type: rec.type, slug: rec.slug, q: el('#q').value, county: el('#county').value, region: el('#region').value });
  
  // Render “All Fields” with schema descriptions (if available)
  try { renderAllFields(p, schemaProps, state.showAllFields); } catch { renderAllFields(p, {}, state.showAllFields); }
  // If already in fullscreen, reapply overlay/toolbar and scroll to top
  if (state.fullscreen) { setFullscreen(true); const dnode = el('#detail'); if (dnode) dnode.scrollTop = 0; }
}

function destroyCharts() {
for (const k in state.charts) { try
{ state.charts[k].destroy(); } catch {} }
state.charts = {};
}

function addFullscreenControl() {
  const linksHost = el('#links');
  if (!linksHost) return;
  if (!linksHost.querySelector('#fullscreenToggle')) {
    const btn = document.createElement('button');
    btn.id = 'fullscreenToggle';
    btn.textContent = state.fullscreen ? 'Exit Full Screen' : 'Full Screen';
    btn.addEventListener('click', () => {
      state.fullscreen = !state.fullscreen;
      setFullscreen(state.fullscreen);
      btn.textContent = state.fullscreen ? 'Exit Full Screen' : 'Full Screen';
      const cur = getParams();
      setParams({ ...cur, view: state.fullscreen ? 'full' : null });
    });
    linksHost.appendChild(btn);
  }
}

function setFullscreen(on) {
  const d = el('#detail');
  if (!d) return;
  const bar = el('#fsbar');
  if (on) {
    if (!state._detailParent) {
      state._detailParent = d.parentElement;
      state._detailNext = d.nextSibling;
    }
    let overlay = document.getElementById('detailOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'detailOverlay';
      overlay.className = 'detail-overlay';
      document.body.appendChild(overlay);
    }
    overlay.appendChild(d);
    d.style.width = '100%';
    document.body.classList.add('no-scroll');
    if (bar) bar.hidden = false;
  } else {
    if (state._detailParent) {
      if (state._detailNext && state._detailNext.parentNode === state._detailParent) {
        state._detailParent.insertBefore(d, state._detailNext);
      } else {
        state._detailParent.appendChild(d);
      }
    }
    const overlay = document.getElementById('detailOverlay');
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    d.style.removeProperty('width');
    document.body.classList.remove('no-scroll');
    if (bar) bar.hidden = true;
  }
}

function renderFullscreenBar(ctx) {
  const bar = el('#fsbar');
  if (!bar) return;
  // Build toolbar content
  const { year, type, slug, siteBase } = ctx || {};
  const html = [];
  html.push(`<button id="fs-back">⟵ Back to List</button>`);
  // Compact header (facility name + meta)
  const name = (ctx && ctx.meta && (ctx.meta.facility_name)) || (ctx && ctx.payload && ctx.payload.facility_name) || '';
  const city = (ctx && ctx.payload && (ctx.payload.address_city || ctx.payload.facility_city)) || '';
  const state = (ctx && ctx.payload && (ctx.payload.address_state || ctx.payload.facility_state)) || 'IL';
  const zip = (ctx && ctx.payload && (ctx.payload.address_zip || ctx.payload.facility_zip)) || '';
  const sub = [city, state].filter(Boolean).join(', ') + (zip ? ` ${zip}` : '') + (type ? ` • ${type}` : '') + (year ? ` • ${year}` : '');
  html.push(`<div class="fshead"><div class="fs-title">${name || 'Facility'}</div><div class="fs-sub">${sub}</div></div>`);
  // Facility picker (from current filtered list)
  const idx = (state.filtered || []).findIndex(r => String(r.slug)===String(slug) && String(r.year)===String(year) && String(r.type)===String(type));
  const opts = (state.filtered || []).map((r,i)=>`<option value="${i}" ${i===idx?'selected':''}>${r.name}</option>`).join('');
  html.push(`<button id="fs-prev" title="Previous">◂</button>`);
  html.push(`<select id="fs-pick" title="Jump to facility">${opts}</select>`);
  html.push(`<button id="fs-next" title="Next">▸</button>`);
  html.push(`<a href="${siteBase || '.'}/out/profiles/${year}/${type}/${slug}.html" target="_blank">Open HTML</a>`);
  html.push(`<a href="${siteBase || '.'}/out/profiles/${year}/${type}/${slug}.pdf" target="_blank">Open PDF</a>`);
  html.push(`<button id="fs-dlcsv">Download CSV</button>`);
  html.push(`<button id="fs-share">Share</button>`);
  html.push(`<button id="fs-print">Print</button>`);
  html.push(`<span class="spacer"></span>`);
  html.push(`<button id="fs-exit">Exit Full Screen</button>`);
  bar.innerHTML = html.join(' ');
  bar.hidden = !state.fullscreen;
  // Wire actions
  const meta = (ctx && ctx.meta) || {};
  const payload = (ctx && ctx.payload) || {};
  const props = (ctx && ctx.schemaProps) || {};
  const back = el('#fs-back'); if (back) back.addEventListener('click', () => {
    state.fullscreen = false; setFullscreen(false);
    const d = el('#detail'); if (d) d.hidden = true;
    const cur = getParams(); delete cur.slug; delete cur.view; setParams(cur);
    const list = el('#list'); if (list) list.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  const dl = el('#fs-dlcsv'); if (dl) dl.addEventListener('click', () => downloadCSV(meta, payload, props));
  const sh = el('#fs-share'); if (sh) sh.addEventListener('click', copyShareLink);
  const pr = el('#fs-print'); if (pr) pr.addEventListener('click', () => window.print());
  const ex = el('#fs-exit'); if (ex) ex.addEventListener('click', () => {
    state.fullscreen = false; setFullscreen(false);
    const cur = getParams(); setParams({ ...cur, view: null });
  });
  function openAt(i) {
    const row = (state.filtered || [])[i];
    if (!row) return;
    openDetail({ year: row.year, type: row.type, slug: row.slug });
  }
  const pick = el('#fs-pick'); if (pick) pick.addEventListener('change', () => openAt(parseInt(pick.value,10)));
  const prev = el('#fs-prev'); if (prev) prev.addEventListener('click', () => { const i = (pick?parseInt(pick.value,10):idx) - 1; if (i>=0) openAt(i); });
  const next = el('#fs-next'); if (next) next.addEventListener('click', () => { const i = (pick?parseInt(pick.value,10):idx) + 1; if (i<(state.filtered||[]).length) openAt(i); });
}

function drawCharts(type, p) {
  destroyCharts();

// Payer data
const payerMap = (type === 'Hospital')
    ? {
        'Inpatient Medicare': p.pay_inp_medicare,
        'Inpatient Medicaid': p.pay_inp_medicaid,
        'Inpatient Private Insurance':
p.pay_inp_private_ins,
        'Inpatient Other Public':
p.pay_inp_other_public,
        'Inpatient Private Pay': p.pay_inp_private_pay,
      }
    : {
        'Medicare': p.pat_medicare,
        'Medicaid': p.pat_medicaid,
        'Private Insurance': p.pat_private_insurance,
        'Other Public': p.pat_other_public,
        'Private Pay': p.pat_private_payment,
        'Charity Care': p.pat_charity,
      };
const payerLabels = (type === 'Hospital' ? Object.keys(payerMap) : payerOrder(Object.keys(payerMap)))
    .filter(k => String(payerMap[k] ?? '').trim() !== '');
const payerVals = payerLabels.map(k => toNum(payerMap[k]));
drawDoughnut('#chart-payer', 'Payer Mix', payerLabels, payerVals);

// Race data (patients) as pie
const raceMap = (type === 'Hospital')
    ? {
        'White': p.race_inp_white,
        'Black/African American': p.race_inp_black,
        'Asian': p.race_inp_asian,
        'AI/AN': p.race_inp_ai_an,
        'NH/PI': p.race_inp_nh_pi,
        'Unknown': p.race_inp_unknown,
      }
    : (type === 'ESRD')
      ? {
        'White': p.white_patients,
        'Black/African American': p.black_african_patients,
        'Asian': p.asian_patients,
        'AI/AN': p.american_indian_patients,
        'NH/PI': p.hawaiian_pacific_patients,
      }
      : {
        'White': p.race_white,
        'Black/African American': p.race_black || p.race_black_african_american,
        'Asian': p.race_asian,
        'AI/AN': p.race_american_indian,
        'NH/PI': p.race_native_hawaiian_pacific_islander || p.race_nh_pi,
        'Unknown': p.race_unknown,
      };
const raceLabels = raceOrder(Object.keys(raceMap))
    .filter(k => String(raceMap[k] ?? '').trim() !== '');
const raceVals = raceLabels.map(k => toNum(raceMap[k]));
drawDoughnut('#chart-race', 'Patients by Race', raceLabels, raceVals);

// Ethnicity data (patients) as pie
const ethMap = (type === 'Hospital')
    ? {
        'Not Hispanic/Latino': p.eth_inp_not_hispanic,
        'Hispanic/Latino': p.eth_inp_hispanic,
        'Unknown': p.eth_inp_unknown,
      }
    : (type === 'ESRD')
      ? {
        'Hispanic/Latino': p.hispanic_latino_patients,
        'Non-Hispanic/Latino': p.non_hispanic_latino_patients,
        'Unknown': p.unknown_ethnicity_patients,
      }
      : {
        'Non-Hispanic': p.ethnicity_non_hispanic || p.eth_not_hispanic,
        'Hispanic/Latino': p.ethnicity_hispanic_latino || p.eth_hispanic,
        'Unknown': p.ethnicity_unknown || p.eth_unknown,
      };
const ethLabels = Object.keys(ethMap).filter(k => String(ethMap[k] ?? '').trim() !== '');
const ethVals = ethLabels.map(k => toNum(ethMap[k]));
drawDoughnut('#chart-eth', 'Patients by Ethnicity', ethLabels, ethVals);

// Build demographics tables under charts
buildDemographicsTables(type, p, raceLabels, raceMap, ethLabels, ethMap);

// Extra charts per type
function drawExtra(sel, title, labels, data) {
  const cv = document.querySelector(sel);
  if (!cv) return;
  if (!labels.length) { cv.getContext('2d').clearRect(0,0,cv.width,cv.height); return; }
  const ctx = cv.getContext('2d');
  state.charts[sel] = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ data }] },
    options: { plugins: { title: { display: true, text: title }, legend: { display: false } }, scales: { y: { beginAtZero: true } } },
  });
}

  if (type === 'ESRD') {
    const stations = {
      'Auth Jan 1': p.stations_jan1_auth,
      'Cert Jan 1': p.stations_jan1_cert,
      'Auth Dec 31': p.stations_dec31_auth,
      'Cert Dec 31': p.stations_dec31_cert,
      'Peak Operated': p.stations_highest_operational,
      'Oct Setup': p.stations_oct_setup_staffed,
      'Oct Isolation': p.stations_oct_isolation,
    };
    const labels = Object.keys(stations).filter(k => String(stations[k] ?? '').trim() !== '');
    const data = labels.map(k => toNum(stations[k]));
    drawExtra('#chart-extra1', 'Stations', labels, data);
    // Weekly hours/patients (October snapshot)
    const wlabels = ['Oct1','Oct2','Oct3','Oct4','Oct5','Oct6','Oct7'];
    const hoursKeys = ['hours_oct1','hours_oct2','hours_oct3','hours_oct4','hours_oct5','hours_oct6','hours_oct7'];
    const patsKeys = ['patients_oct1','patients_oct2','patients_oct3','patients_oct4','patients_oct5','patients_oct6','patients_oct7'];
    const hoursAvail = hoursKeys.some(k => String(p[k] ?? '').trim() !== '');
    const patsAvail = patsKeys.some(k => String(p[k] ?? '').trim() !== '');
    let used2 = false, used3 = false;
    if (hoursAvail) {
      const d = hoursKeys.map(k => toNum(p[k]));
      drawExtra('#chart-extra2', 'Hours (Weekly Oct)', wlabels, d);
      used2 = true;
    } else {
      drawExtra('#chart-extra2', '', [], []);
    }
    if (patsAvail) {
      const d = patsKeys.map(k => toNum(p[k]));
      drawExtra('#chart-extra3', 'Patients (Weekly Oct)', wlabels, d);
      used3 = true;
    } else {
      drawExtra('#chart-extra3', '', [], []);
    }
    // Staffing (FTEs) fallback chart if space available
    const staff = {
      'RN': p.fte_rn,
      'Techs': p.fte_techs,
      'Dieticians': p.fte_dieticians,
      'Social Workers': p.fte_social_workers,
      'LPNs': p.fte_lpns,
      'Other Health': p.fte_other_health,
      'Other Non-Health': p.fte_other_nonhealth,
      'Total FTEs': p.fte_total,
    };
    const sLabels = Object.keys(staff).filter(k => String(staff[k] ?? '').trim() !== '');
    const sData = sLabels.map(k => toNum(staff[k]));
    if (sLabels.length) {
      if (!used2) { drawExtra('#chart-extra2', 'Staffing (FTEs)', sLabels, sData); used2 = true; }
      else if (!used3) { drawExtra('#chart-extra3', 'Staffing (FTEs)', sLabels, sData); used3 = true; }
    }
    // Finance fallback chart if space available
    const fin = {
      'Medicare': p.net_revenue_medicare,
      'Medicaid': p.net_revenue_medicaid,
      'Other Public': p.net_revenue_other_public,
      'Private Insurance': p.net_revenue_private_insur,
      'Private Payment': p.net_revenue_private_pay,
    };
    const fLabels = Object.keys(fin).filter(k => String(fin[k] ?? '').trim() !== '');
    const fData = fLabels.map(k => toNum(fin[k]));
    if (fLabels.length) {
      if (!used2) { drawExtra('#chart-extra2', 'Net Revenue by Source', fLabels, fData); used2 = true; }
      else if (!used3) { drawExtra('#chart-extra3', 'Net Revenue by Source', fLabels, fData); used3 = true; }
    }
  }

  if (type === 'Hospital') {
  // Helpers with fallbacks similar to profile renderer
  const MS = {
    adm: toNum(p.ms_total_admissions ?? p.med_surg_admissions),
    days: toNum(p.ms_total_pd ?? p.med_surg_days_total),
    beds: toNum(p.ms_beds_10_1_23 ?? p.med_surg_beds_oct1),
  };
  const ICU = {
    adm: toNum(p.total_icu_admissions ?? p.icu_total),
    days: toNum(p.total_icu_patient_days ?? p.icu_days),
    beds: toNum(p.total_icu_beds_10_1_23 ?? p.icu_beds_oct1),
  };
  const OBG = {
    adm: toNum(p.total_ob_gyn_admissions ?? p.obgyn_admissions_total),
    days: toNum(p.total_ob_gyn_patient_days ?? p.obgyn_days_total),
    beds: toNum(p.ob_gyn_beds_10_1_23 ?? p.obgyn_beds_oct1),
  };
  const PEDS = {
    adm: toNum(p.peds_admissions ?? p.pediatric_admissions ?? p.pedadm),
    days: toNum(p.peds_days ?? p.pediatric_patient_days ?? p.pedipd),
    beds: toNum(p.peds_beds_oct1 ?? p.pediatric_beds_set_up_10_1_23 ?? p.ped_oct1),
  };
  const NICU = {
    adm: toNum(p.nicu_admissions ?? p.nn_icu_admissions ?? p.ntliiiadm),
    days: toNum(p.nicu_days ?? p.nn_icu_patient_days ?? p.ntliiiipd),
    beds: toNum(p.nn_icu_beds_on_10_1_23 ?? p.nicu_beds_oct1),
  };
  const units = [
    ['Medical-Surgical', MS],
    ['ICU', ICU],
    ['OB/GYN', OBG],
    ['Pediatrics', PEDS],
    ['NICU', NICU],
  ];
  const labels = units.filter(u => (u[1].adm||u[1].days||u[1].beds)).map(u => u[0]);
  const admissions = units.filter(u => (u[1].adm||u[1].days||u[1].beds)).map(u => u[1].adm||0);
  const days = units.filter(u => (u[1].adm||u[1].days||u[1].beds)).map(u => u[1].days||0);
  const beds = units.filter(u => (u[1].adm||u[1].days||u[1].beds)).map(u => u[1].beds||0);
  drawExtra('#chart-extra1', 'Admissions by Unit', labels, admissions);
  drawExtra('#chart-extra2', 'Patient Days by Unit', labels, days);
  drawExtra('#chart-extra3', 'Beds (Oct 1) by Unit', labels, beds);
  }

  if (type === 'ASTC') {
    // Age distribution (sum male + female buckets if present)
    const ages = [
      ['0-14', (toNum(p.patients_age_male_0_14) + toNum(p.patients_age_female_0_14))],
      ['15-44', (toNum(p.patients_age_male_15_44) + toNum(p.patients_age_female_15_44))],
      ['45-64', (toNum(p.patients_age_male_45_64) + toNum(p.patients_age_female_45_64))],
      ['65-74', (toNum(p.patients_age_male_65_74) + toNum(p.patients_age_female_65_74))],
      ['75+', (toNum(p.patients_age_male_75_plus) + toNum(p.patients_age_female_75_plus))],
    ];
    const ageHas = ages.some(([_, v]) => v);
    if (ageHas) {
      drawExtra('#chart-extra1', 'Patients by Age', ages.map(a => a[0]), ages.map(a => a[1]));
    } else {
      drawExtra('#chart-extra1', '', [], []);
    }
    // Payer totals (sum male + female by payer)
    const payers = {
      'Medicare': toNum(p.patients_payment_male_medicare) + toNum(p.patients_payment_female_medicare),
      'Medicaid': toNum(p.patients_payment_male_medicaid) + toNum(p.patients_payment_female_medicaid),
      'Private Insurance': toNum(p.patients_payment_male_private_insurance) + toNum(p.patients_payment_female_private_insurance),
      'Other Public': toNum(p.patients_payment_male_other_public) + toNum(p.patients_payment_female_other_public),
      'Private Pay': toNum(p.patients_payment_male_private_payment) + toNum(p.patients_payment_female_private_payment),
      'Charity Care': toNum(p.patients_payment_male_charity_care) + toNum(p.patients_payment_female_charity_care),
    };
    const pl = Object.keys(payers).filter(k => payers[k]);
    if (pl.length) {
      drawExtra('#chart-extra2', 'Payer Mix (Total Patients)', pl, pl.map(k => payers[k]));
    } else {
      drawExtra('#chart-extra2', '', [], []);
    }
    // Clear any remaining
    drawExtra('#chart-extra3', '', [], []);
  }
  if (type === 'Hospital') {
    // Outpatient Activity
    const outpatient = {
      'OP Visits — On-campus': p.op_visits_on,
      'OP Visits — Off-campus': p.op_visits_off,
      'OP Visits — Total': p.op_visits_total,
      'Observation Beds (Dedicated)': p.obs_unit_beds,
      'Observation Days (Dedicated)': p.obs_unit_days,
    };
    const outLabs = Object.keys(outpatient).filter(k => String(outpatient[k] ?? '').trim() !== '');
    if (outLabs.length) {
      const rows = outLabs.map(k => `<tr><td>${k}</td><td class=\"right\">${fmt(outpatient[k])}</td></tr>`).join('');
      host.insertAdjacentHTML('beforeend', `<div class=\"card col-12\"><h3>Outpatient Activity</h3><table><thead><tr><th>Field</th><th class=\"right\">Value</th></tr></thead><tbody>${rows}</tbody></table></div>`);
    }
    // Payer Mix — Inpatient (numeric)
    const payer = {
      'Inpatients by Payment — Medicare': p.pay_inp_medicare,
      'Inpatients by Payment — Medicaid': p.pay_inp_medicaid,
      'Inpatients by Payment — Private Insurance': p.pay_inp_private_ins,
      'Inpatients by Payment — Other Public': p.pay_inp_other_public,
      'Inpatients by Payment — Private Payment': p.pay_inp_private_pay,
    };
    const payLabs = Object.keys(payer).filter(k => String(payer[k] ?? '').trim() !== '');
    if (payLabs.length) {
      const rows = payLabs.map(k => `<tr><td>${k}</td><td class=\"right\">${fmt(payer[k])}</td></tr>`).join('');
      host.insertAdjacentHTML('beforeend', `<div class=\"card col-12\"><h3>Payer Mix — Inpatient</h3><table><thead><tr><th>Field</th><th class=\"right\">Value</th></tr></thead><tbody>${rows}</tbody></table></div>`);
    }
    // Surgical Services summaries
    function surgerySummary(prefix, title) {
      const specs = {};
      Object.entries(p || {}).forEach(([k,v]) => {
        if (typeof k !== 'string' || !k.startsWith(prefix)) return;
        if (String(v ?? '').trim() === '') return;
        const parts = k.split('_');
        const metric = parts.slice(0,2).join('_'); // e.g., or_rooms, or_cases, or_hours or procB_rooms, etc.
        const rest = parts.slice(2);
        if (rest.length < 2) return; // e.g., metric_sub_spec
        const sub = rest[0];
        const spec = rest.slice(1).join('_');
        (specs[spec] = specs[spec] || {})[`${metric}_${sub}`] = v;
      });
      const specNames = Object.keys(specs);
      if (!specNames.length) return;
      const rows = specNames.sort().map(sp => {
        const kv = specs[sp] || {};
        // Summaries across ip/op/combined/total
        function sum(keys) { return keys.reduce((a,kk)=>a + (toNum(kv[kk])||0), 0); }
        const rooms = sum(['or_rooms_ip','or_rooms_op','or_rooms_combined','procB_rooms_ip','procB_rooms_op','procB_rooms_combined']);
        const cases = sum(['or_cases_ip','or_cases_op','procB_cases_ip','procB_cases_op']);
        const hours = sum(['or_hours_ip','or_hours_op','or_hours_total','procB_hours_ip','procB_hours_op','procB_hours_total']);
        const label = sp.replace(/_/g,' ').replace(/nh/g,'NH').replace(/pi/g,'PI');
        return `<tr><td>${label}</td><td class=\"right\">${fmt(rooms)}</td><td class=\"right\">${fmt(cases)}</td><td class=\"right\">${fmt(hours)}</td></tr>`;
      }).join('');
      host.insertAdjacentHTML('beforeend', `<div class=\"card col-12\"><h3>${title}</h3><table><thead><tr><th>Specialty</th><th class=\"right\">Rooms</th><th class=\"right\">Cases</th><th class=\"right\">Hours</th></tr></thead><tbody>${rows}</tbody></table></div>`);
    }
    surgerySummary('or_', 'Surgical Services — OR Class C');
    surgerySummary('procB_', 'Surgical Services — Class B');

    // Inpatient/Outpatient Services by Specialty (from ipserv_*/opserv_* and hrs_*_* if present)
    const svc = {};
    Object.entries(p || {}).forEach(([k,v]) => {
      if (String(v ?? '').trim() === '') return;
      if (/^ipserv_/.test(k)) {
        const sp = k.replace(/^ipserv_/, '');
        (svc[sp] = svc[sp] || {}).ip = toNum(v);
      } else if (/^opserv_/.test(k)) {
        const sp = k.replace(/^opserv_/, '');
        (svc[sp] = svc[sp] || {}).op = toNum(v);
      } else if (/^hrs_/.test(k)) {
        // hrs_<spec>_<i|o|t>
        const m = /^hrs_([^_]+)_(i|o|t)/.exec(k);
        if (m) {
          const sp = m[1]; const which = m[2];
          const row = (svc[sp] = svc[sp] || {});
          if (which === 'i') row.hi = toNum(v);
          else if (which === 'o') row.ho = toNum(v);
          else row.ht = toNum(v);
        }
      }
    });
    const spNames = Object.keys(svc);
    if (spNames.length) {
      const pretty = s => s.replace(/_/g,' ').toUpperCase();
      const rows = spNames.sort().map(sp => {
        const r = svc[sp];
        const hi = r.hi || 0, ho = r.ho || 0, ht = r.ht || (hi+ho);
        const ip = r.ip != null ? r.ip : '';
        const op = r.op != null ? r.op : '';
        return `<tr><td>${pretty(sp)}</td><td class=\"right\">${fmt(ip)}</td><td class=\"right\">${fmt(op)}</td><td class=\"right\">${fmt(hi)}</td><td class=\"right\">${fmt(ho)}</td><td class=\"right\">${fmt(ht)}</td></tr>`;
      }).join('');
      host.insertAdjacentHTML('beforeend', `<div class=\"card col-12\"><h3>Services by Specialty</h3><table><thead><tr><th>Specialty</th><th class=\"right\">IP Services</th><th class=\"right\">OP Services</th><th class=\"right\">Hours (IP)</th><th class=\"right\">Hours (OP)</th><th class=\"right\">Hours (Total)</th></tr></thead><tbody>${rows}</tbody></table></div>`);
    }
  }

  if (type === 'LTC') {
    // Beds & Occupancy snapshot
    const beds = {
      'Licensed (IDD)': p.beds_licensed_idd,
      'Setup (IDD)': p.beds_setup_idd,
      'Occupied (IDD)': p.beds_occupied_idd,
      'Peak Setup (IDD)': p.beds_peak_setup_idd,
      'Peak Occupied (IDD)': p.beds_peak_occupied_idd,
    };
    const bl = Object.keys(beds).filter(k => String(beds[k] ?? '').trim() !== '');
    if (bl.length) {
      drawExtra('#chart-extra1', 'Beds & Occupancy', bl, bl.map(k => toNum(beds[k])));
    } else {
      drawExtra('#chart-extra1', '', [], []);
    }
    // Resident flow
    const flow = {
      'Census Jan 1': p.census_jan1,
      'Initial Admissions': p.admissions_initial,
      'Discharges (Permanent)': p.discharges_permanent,
      'Total Days (IDD)': p.days_total_idd,
    };
    const fl = Object.keys(flow).filter(k => String(flow[k] ?? '').trim() !== '');
    if (fl.length) {
      drawExtra('#chart-extra2', 'Resident Flow', fl, fl.map(k => toNum(flow[k])));
    } else {
      drawExtra('#chart-extra2', '', [], []);
    }
    // Finance bar if available
    const fin = {
      'Medicare': p.net_revenue_medicare,
      'Medicaid': p.net_revenue_medicaid,
      'Other Public': p.net_revenue_other_public,
      'Private Insurance': p.net_revenue_private_insurance,
      'Private Payment': p.net_revenue_private_payment,
    };
    const flabels = Object.keys(fin).filter(k => String(fin[k] ?? '').trim() !== '');
    const fdata = flabels.map(k => toNum(fin[k]));
    if (flabels.length) drawExtra('#chart-extra3', 'Net Revenue by Source', flabels, fdata); else drawExtra('#chart-extra3', '', [], []);
  }
}

function drawDoughnut(sel, title, labels, data) {
const ctx = el(sel).getContext('2d');
state.charts[sel] = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data }] },
    options: {
      plugins: {
        title: { display: true, text: title },
        legend: { display: true },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const ds = ctx.dataset;
              const total = (ds && ds.data || []).reduce((a,b)=>a+(Number(b)||0), 0) || 0;
              const val = Number(ctx.raw) || 0;
              const pct = total ? ((val/total)*100).toFixed(1) + '%' : '';
              const lbl = ctx.label || '';
              return `${lbl}: ${val.toLocaleString('en-US')} ${pct ? '('+pct+')' : ''}`;
            }
          }
        }
      }
    }
});
state.charts[sel].$chart_config = { centerTotal: true, ringLabels: true };
}
function drawBar(sel, title, labels, data, percentLabels = false) {
const ctx = el(sel).getContext('2d');
state.charts[sel] = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ data }] },
    options: {
      plugins: { title: { display: true, text: title }, legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
});
state.charts[sel].$chart_config = { percentLabels };
}

function buildDemographicsTables(type, p, raceLabels, raceMap, ethLabels, ethMap) {
  const host = el('#demo-tables');
  if (!host) return;
  const parts = [];
  function makeRows(labels, patMap, daysMap) {
    const patVals = labels.map(k => toNum(patMap[k]));
    const patTotal = patVals.reduce((a,b)=>a+b,0);
    const daysVals = labels.map(k => toNum(daysMap && daysMap[k]));
    const daysTotal = daysVals.reduce((a,b)=>a+b,0);
    const rows = labels.map((k, i) => {
      const pv = patVals[i];
      const dv = daysVals[i] || 0;
      const pShare = patTotal ? ((pv/patTotal)*100).toFixed(1) + '%' : '';
      const dShare = daysTotal ? ((dv/daysTotal)*100).toFixed(1) + '%' : '';
      return `<tr><td>${k}</td><td class="right">${fmt(pv)}</td><td class="right">${pShare}</td><td class="right">${fmt(dv)}</td><td class="right">${dShare}</td></tr>`;
    }).join('');
    const totalRow = `<tr><th>Total</th><th class="right">${fmt(patTotal)}</th><th></th><th class="right">${fmt(daysTotal)}</th><th></th></tr>`;
    return `<table><thead><tr><th>Category</th><th class="right">Patients</th><th class="right">Patients Share</th><th class="right">Inpatient Days</th><th class="right">Days Share</th></tr></thead><tbody>${rows}${totalRow}</tbody></table>`;
  }
  host.innerHTML = '';
  if (type === 'Hospital') {
    const raceDays = {
      'White': p.days_by_race_white,
      'Black/African American': p.days_by_race_black,
      'Asian': p.days_by_race_asian,
      'AI/AN': p.days_by_race_ai_an,
      'NH/PI': p.days_by_race_nh_pi,
      'Unknown': p.days_by_race_unknown,
    };
    const ethDays = {
      'Not Hispanic/Latino': p.days_by_eth_not_hispanic,
      'Hispanic/Latino': p.days_by_eth_hispanic,
      'Unknown': p.days_by_eth_unknown,
    };
    parts.push(`<div class="card col-12"><h3>Race Breakdown</h3>${makeRows(raceLabels, raceMap, raceDays)}</div>`);
    parts.push(`<div class="card col-12"><h3>Ethnicity Breakdown</h3>${makeRows(ethLabels, ethMap, ethDays)}</div>`);
  } else {
    const emptyDays = {};
    parts.push(`<div class="card col-12"><h3>Race Breakdown</h3>${makeRows(raceLabels, raceMap, emptyDays)}</div>`);
    parts.push(`<div class="card col-12"><h3>Ethnicity Breakdown</h3>${makeRows(ethLabels, ethMap, emptyDays)}</div>`);
  }
  host.innerHTML = parts.join('');
  // After demographics, append type-specific and finance tables
  appendTypeSpecificTables(type, p);
  appendFinanceTables(type, p);
}

// Build summary cards for the detail view (Facility, Ownership, Management)
function buildSummaryCards(type, p) {
  const host = el('#summary');
  if (!host) return;
  host.innerHTML = '';
  if (type !== 'Hospital') return;
  function rowHTML(label, val, opts = {}) {
    const v = String(val ?? '').trim();
    if (!v) return '';
    const display = opts.raw ? v : fmt(v);
    return `<tr><td>${label}</td><td class="right">${display}</td></tr>`;
  }
  // Facility
  const facRows = [];
  const addr1 = p.address_line1 || p.facility_address;
  const city = p.address_city || p.facility_city;
  const state = p.address_state || p.facility_state || 'IL';
  const zip = p.address_zip || p.facility_zip;
  if (addr1 || city || zip) {
    facRows.push(rowHTML('Street', addr1, { raw: true }));
    facRows.push(rowHTML('City/State/ZIP', `${city || ''}, ${state || ''} ${zip || ''}`, { raw: true }));
  }
  facRows.push(rowHTML('IDPH License', p.license_idph, { raw: true }));
  facRows.push(rowHTML('FEIN', p.fein, { raw: true }));
  if (facRows.filter(Boolean).length) {
    host.insertAdjacentHTML('beforeend', `<div class="card col-12"><h3>Facility</h3><table><thead><tr><th>Field</th><th class="right">Value</th></tr></thead><tbody>${facRows.join('')}</tbody></table></div>`);
  }
  // Ownership & Organization
  const ownRows = [];
  ownRows.push(rowHTML('Operating Entity', p.operator_entity));
  ownRows.push(rowHTML('Plant Owner', p.plant_owner));
  ownRows.push(rowHTML('Ownership Type', p.ownership_type));
  ownRows.push(rowHTML('CMS Certification', p.cms_certification));
  ownRows.push(rowHTML('Characterization', Array.isArray(p.hospital_characterization) ? p.hospital_characterization.join(', ') : p.hospital_characterization));
  ownRows.push(rowHTML('CHNA URL', p.chna_url, { raw: true }));
  if (ownRows.filter(Boolean).length) {
    host.insertAdjacentHTML('beforeend', `<div class="card col-12"><h3>Ownership & Organization</h3><table><thead><tr><th>Field</th><th class=\"right\">Value</th></tr></thead><tbody>${ownRows.join('')}</tbody></table></div>`);
  }
  // Management Contracts
  const mgmtRows = [];
  mgmtRows.push(rowHTML('Emergency Services Management', p.mgmt_emergency));
  mgmtRows.push(rowHTML('Psychiatric Services Management', p.mgmt_psych));
  mgmtRows.push(rowHTML('Rehabilitation Services Management', p.mgmt_rehab));
  if (mgmtRows.filter(Boolean).length) {
    host.insertAdjacentHTML('beforeend', `<div class="card col-12"><h3>Management Contracts</h3><table><thead><tr><th>Field</th><th class=\"right\">Value</th></tr></thead><tbody>${mgmtRows.join('')}</tbody></table></div>`);
  }
}

// Append Finance tables by type, using known revenue field names
function appendFinanceTables(type, p) {
  const host = el('#demo-tables');
  if (!host) return;
  function fmtCurrency(n) {
    const x = Number(String(n ?? '').replace(/[^0-9.-]/g, ''));
    if (!Number.isFinite(x)) return String(n ?? '');
    try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(x); } catch { return x.toLocaleString('en-US'); }
  }
  function tableFromMap(title, map) {
    const labels = Object.keys(map).filter(k => String(map[k] ?? '').trim() !== '');
    if (!labels.length) return '';
    const rows = labels.map(k => `<tr><td>${k}</td><td class="right">${fmtCurrency(map[k])}</td></tr>`).join('');
    return `<div class="card col-12"><h3>${title}</h3><table><thead><tr><th>Source</th><th class="right">Net Revenue</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  if (type === 'Hospital') {
    const ip = {
      'Medicare': p.inpatient_medicare_revenue,
      'Medicaid': p.inpatient_medicaid_revenue,
      'Other Public': p.inpatient_other_public_revenue,
      'Private Insurance': p.inpatient_private_insurance_revenue,
      'Private Payment': p.inpatient_private_payment_revenue,
    };
    const op = {
      'Medicare': p.outpatient_medicare_revenue,
      'Medicaid': p.outpatient_medicaid_revenue,
      'Other Public': p.outpatient_other_public_revenue,
      'Private Insurance': p.outpatient_private_insurance_revenue,
      'Private Payment': p.outpatient_private_payment_revenue,
    };
    const ipHTML = tableFromMap('Inpatient Net Revenue by Source', ip);
    const opHTML = tableFromMap('Outpatient Net Revenue by Source', op);
    host.insertAdjacentHTML('beforeend', ipHTML + opHTML);
  }
  if (type === 'LTC') {
    const fin = {
      'Medicare': p.net_revenue_medicare,
      'Medicaid': p.net_revenue_medicaid,
      'Other Public': p.net_revenue_other_public,
      'Private Insurance': p.net_revenue_private_insurance,
      'Private Payment': p.net_revenue_private_payment,
    };
    const total = p.net_revenue_total;
    const finHTML = tableFromMap('Net Revenue by Primary Source of Payment', fin);
    const totHTML = (String(total ?? '').trim() !== '') ? `<div class="card col-12"><h3>Net Revenue — TOTAL</h3><table><tbody><tr><td>Total</td><td class="right">${fmtCurrency(total)}</td></tr></tbody></table></div>` : '';
    host.insertAdjacentHTML('beforeend', finHTML + totHTML);
  }
  if (type === 'ESRD') {
    const fin = {
      'Medicare': p.net_revenue_medicare,
      'Medicaid': p.net_revenue_medicaid,
      'Other Public': p.net_revenue_other_public,
      'Private Insurance': p.net_revenue_private_insur,
      'Private Payment': p.net_revenue_private_pay,
    };
    const total = p.total_revenue;
    const finHTML = tableFromMap('Net Revenue by Primary Source of Payment', fin);
    const totHTML = (String(total ?? '').trim() !== '') ? `<div class="card col-12"><h3>Net Revenue — TOTAL</h3><table><tbody><tr><td>Total</td><td class="right">${fmtCurrency(total)}</td></tr></tbody></table></div>` : '';
    host.insertAdjacentHTML('beforeend', finHTML + totHTML);
  }
}

function appendTypeSpecificTables(type, p) {
  const host = el('#demo-tables'); if (!host) return;
  if (type === 'ESRD') {
    const flow = {
      'Patients — Jan 1': p.beginning_patients,
      'Patients — Dec 31': p.ending_patients,
      'Unduplicated Patients Treated': p.total_patients_treated,
      'New Patients': p.number_of_new_patients,
      'Transient Patients': p.number_of_transient_patients,
      'Re-started Dialysis': p.number_patients_re_started,
      'Resumed after Transplant': p.number_post_transplant,
      'Recovered Kidney Function': p.number_recovered,
      'Transplant Recipients Ended': p.number_of_transplant_recipients,
      'Transferred Out': p.number_transferred,
      'Voluntarily Discontinued': p.number_voluntarily_discontinued,
      'Lost to Follow-up': p.number_lost_to_follow_up,
      'Deaths': p.number_of_patients_died,
    };
    const labels = Object.keys(flow).filter(k => String(flow[k] ?? '').trim() !== '');
    if (labels.length) {
      const rows = labels.map(k => `<tr><td>${k}</td><td class=\"right\">${fmt(flow[k])}</td></tr>`).join('');
      host.insertAdjacentHTML('beforeend', `<div class=\"card col-12\"><h3>Patient Flow (Year)</h3><table><thead><tr><th>Metric</th><th class=\"right\">Count</th></tr></thead><tbody>${rows}</tbody></table></div>`);
    }
    // Demographics — Age (Male/Female/Total)
    const ageRows = [
      ['Under 14', p.male_patients_under_14, p.female_patients_under_14],
      ['15-44', p.male_patients_15_44, p.female_patients_15_44],
      ['45-64', p.male_patients_45_64, p.female_patients_45_64],
      ['65-74', p.male_patients_65_74, p.female_patients_65_74],
      ['75+', p.male_patients_75_and_over, p.female_patients_75_and_over],
    ];
    if (ageRows.some(r => String(r[1] ?? '').trim() !== '' || String(r[2] ?? '').trim() !== '')) {
      const rows = ageRows.map(([lab,m,f]) => `<tr><td>${lab}</td><td class=\"right\">${fmt(m)}</td><td class=\"right\">${fmt(f)}</td><td class=\"right\">${fmt((toNum(m)||0)+(toNum(f)||0))}</td></tr>`).join('');
      host.insertAdjacentHTML('beforeend', `<div class=\"card col-12\"><h3>Patients by Age and Sex</h3><table><thead><tr><th>Age Group</th><th class=\"right\">Male</th><th class=\"right\">Female</th><th class=\"right\">Total</th></tr></thead><tbody>${rows}</tbody></table></div>`);
    }
    // Demographics — Race
    const race = {
      'White': p.white_patients,
      'Black/African American': p.black_african_patients,
      'Asian': p.asian_patients,
      'American Indian/Alaska Native': p.american_indian_patients,
      'Native Hawaiian/Pacific Islander': p.hawaiian_pacific_patients,
    };
    const rLab = Object.keys(race).filter(k => String(race[k] ?? '').trim() !== '');
    if (rLab.length) {
      const rows = rLab.map(k => `<tr><td>${k}</td><td class=\"right\">${fmt(race[k])}</td></tr>`).join('');
      host.insertAdjacentHTML('beforeend', `<div class=\"card col-12\"><h3>Patients by Race</h3><table><thead><tr><th>Race</th><th class=\"right\">Count</th></tr></thead><tbody>${rows}</tbody></table></div>`);
    }
    // Demographics — Ethnicity
    const eth = {
      'Hispanic/Latino': p.hispanic_latino_patients,
      'Non-Hispanic/Latino': p.non_hispanic_latino_patients,
      'Unknown': p.unknown_ethnicity_patients,
    };
    const eLab = Object.keys(eth).filter(k => String(eth[k] ?? '').trim() !== '');
    if (eLab.length) {
      const rows = eLab.map(k => `<tr><td>${k}</td><td class=\"right\">${fmt(eth[k])}</td></tr>`).join('');
      host.insertAdjacentHTML('beforeend', `<div class=\"card col-12\"><h3>Patients by Ethnicity</h3><table><thead><tr><th>Ethnicity</th><th class=\"right\">Count</th></tr></thead><tbody>${rows}</tbody></table></div>`);
    }
  }
  if (type === 'LTC') {
    const cnt = {
      'Medicare': p.patient_count_medicare,
      'Medicaid': p.patient_count_medicaid,
      'Private Insurance': p.patient_count_private_insurance,
      'Private Payment': p.patient_count_private_payment,
      'Other Public': p.patient_count_other_public,
      'Charity Care': p.patient_count_charity_care,
    };
    const cntL = Object.keys(cnt).filter(k => String(cnt[k] ?? '').trim() !== '');
    if (cntL.length) {
      const rows = cntL.map(k => `<tr><td>${k}</td><td class=\"right\">${fmt(cnt[k])}</td></tr>`).join('');
      host.insertAdjacentHTML('beforeend', `<div class=\"card col-12\"><h3>Payers — Resident Counts</h3><table><thead><tr><th>Payer</th><th class=\"right\">Count</th></tr></thead><tbody>${rows}</tbody></table></div>`);
    }
    const days = {
      'Medicare': p.patient_days_medicare,
      'Medicaid': p.patient_days_medicaid,
      'Private Insurance': p.patient_days_private_insurance,
      'Private Payment': p.patient_days_private_payment,
      'Other Public': p.patient_days_other_public,
      'Charity Care': p.patient_days_charity_care,
    };
    const dL = Object.keys(days).filter(k => String(days[k] ?? '').trim() !== '');
    if (dL.length) {
      const rows = dL.map(k => `<tr><td>${k}</td><td class=\"right\">${fmt(days[k])}</td></tr>`).join('');
      host.insertAdjacentHTML('beforeend', `<div class=\"card col-12\"><h3>Payers — Patient Days</h3><table><thead><tr><th>Payer</th><th class=\"right\">Days</th></tr></thead><tbody>${rows}</tbody></table></div>`);
    }
    const rates = [];
    if (String(p.private_room_rate ?? '').trim() !== '') rates.push(['Private Room Rate', p.private_room_rate]);
    if (String(p.shared_room_rate ?? '').trim() !== '') rates.push(['Shared Room Rate', p.shared_room_rate]);
    if (rates.length) {
      const rows = rates.map(([k,v]) => `<tr><td>${k}</td><td class="right">${fmt(v)}</td></tr>`).join('');
      host.insertAdjacentHTML('beforeend', `<div class="card col-12"><h3>Room Rates</h3><table><thead><tr><th>Type</th><th class="right">Rate</th></tr></thead><tbody>${rows}</tbody></table></div>`);
    }
    // Demographics — Age (Male/Female/Total)
    const ageRows = [
      ['Under 18', p.male_under_18, p.female_under_18],
      ['18-44', p.male_18_44, p.female_18_44],
      ['45-59', p.male_45_59, p.female_45_59],
      ['60-64', p.male_60_64, p.female_60_64],
      ['65-74', p.male_65_74, p.female_65_74],
      ['75-84', p.male_75_84, p.female_75_84],
      ['85+', p.male_85_plus, p.female_85_plus],
    ];
    if (ageRows.some(r => String(r[1] ?? '').trim() !== '' || String(r[2] ?? '').trim() !== '')) {
      const rows = ageRows.map(([lab,m,f]) => `<tr><td>${lab}</td><td class="right">${fmt(m)}</td><td class="right">${fmt(f)}</td><td class="right">${fmt((toNum(m)||0)+(toNum(f)||0))}</td></tr>`).join('');
      host.insertAdjacentHTML('beforeend', `<div class="card col-12"><h3>Residents by Age and Sex</h3><table><thead><tr><th>Age Group</th><th class="right">Male</th><th class="right">Female</th><th class="right">Total</th></tr></thead><tbody>${rows}</tbody></table></div>`);
    }
    // Demographics — Race
    const race = {
      'White': p.race_white,
      'Black/African American': p.race_black_african_american,
      'Asian': p.race_asian,
      'American Indian/Alaska Native': p.race_american_indian,
      'Native Hawaiian/Pacific Islander': p.race_native_hawaiian_pacific_islander,
      'Unknown': p.race_unknown,
    };
    const rLab = Object.keys(race).filter(k => String(race[k] ?? '').trim() !== '');
    if (rLab.length) {
      const rows = rLab.map(k => `<tr><td>${k}</td><td class="right">${fmt(race[k])}</td></tr>`).join('');
      host.insertAdjacentHTML('beforeend', `<div class="card col-12"><h3>Residents by Race</h3><table><thead><tr><th>Race</th><th class="right">Count</th></tr></thead><tbody>${rows}</tbody></table></div>`);
    }
    // Demographics — Ethnicity
    const eth = {
      'Hispanic/Latino': p.ethnicity_hispanic_latino,
      'Non-Hispanic': p.ethnicity_non_hispanic,
      'Unknown': p.ethnicity_unknown,
    };
    const eLab = Object.keys(eth).filter(k => String(eth[k] ?? '').trim() !== '');
    if (eLab.length) {
      const rows = eLab.map(k => `<tr><td>${k}</td><td class="right">${fmt(eth[k])}</td></tr>`).join('');
      host.insertAdjacentHTML('beforeend', `<div class="card col-12"><h3>Residents by Ethnicity</h3><table><thead><tr><th>Ethnicity</th><th class="right">Count</th></tr></thead><tbody>${rows}</tbody></table></div>`);
    }
    // Staffing FTEs
    const staff = [];
    [["Administrators (FTEs)", p.adminfte],["Physicians (FTEs)", p.physfte],["Director of Nursing (FTEs)", p.dirnursfte],["Registered Nurses (FTEs)", p.regnursfte],["LPNs (FTEs)", p.lpn_fte],["Certified Aides (FTEs)", p.certaidefte],["Other Health-related (FTEs)", p.otherhealthfte],["Other Non Health-related (FTEs)", p.othnonhealthfte]].forEach(([k,v])=>{ if (String(v ?? '').trim() !== '') staff.push([k,v]);});
    if (staff.length) {
      const rows = staff.map(([k,v]) => `<tr><td>${k}</td><td class="right">${fmt(v)}</td></tr>`).join('');
      host.insertAdjacentHTML('beforeend', `<div class="card col-12"><h3>Staffing (FTEs)</h3><table><thead><tr><th>Role</th><th class="right">FTEs</th></tr></thead><tbody>${rows}</tbody></table></div>`);
    }
  }
}

function downloadCSV(meta, payload, props) {
  // Include all fields from the data dictionary (props) in section and field order
  const keys = Object.keys(props || payload || {});
  const items = keys.map(k => ({
    key: k,
    label: (props && props[k] && (props[k].x_label || props[k].title)) || k,
    section: (props && props[k] && props[k].x_section) || 'Other',
    sectionOrder: (props && props[k] && Number(props[k].x_section_order)) || 9999,
    order: (props && props[k] && Number(props[k].x_order)) || 9999,
    desc: (props && props[k] && props[k].description) || '',
    required: !!(props && props[k] && props[k].x_required),
    val: (payload || {})[k],
  }));
  items.sort((a,b) => (a.sectionOrder - b.sectionOrder) || (a.order - b.order) || String(a.label).localeCompare(String(b.label)));
  const rows = [['section','label','key','value','required','description']];
  items.forEach(it => {
    rows.push([
      it.section,
      it.label,
      it.key,
      String(it.val ?? ''),
      it.required ? 'yes' : '',
      it.desc || '',
    ]);
  });
  const csv = rows
      .map(r => r.map(x => '"' + String(x).replace(/"/g,'""') + '"').join(','))
      .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (meta.facility_name || 'facility').replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '-full.csv';
  document.body.appendChild(a); a.click(); a.remove();
}
function downloadCharts() {
for (const id of ['#chart-payer', '#chart-race',
'#chart-eth']) {
    const cv = el(id);
    if (!cv) continue;
    const a = document.createElement('a');
    a.href = cv.toDataURL('image/png');
    a.download = id.replace('#', '') + '.png';
    document.body.appendChild(a); a.click(); a.remove();
}
}

// Render all payload fields with schema descriptions (if any)
function renderAllFields(payload, props, showAll = false) {
  // Group by x_section and order by x_order; include required fields even if empty
  const keys = new Set([
    ...Object.keys(payload || {}),
    ...Object.keys(props || {}),
  ]);
  const items = Array.from(keys)
    .filter(k => {
      const hasVal = String((payload || {})[k] ?? '').trim() !== '';
      const isReq = !!(props && props[k] && props[k].x_required);
      return showAll || hasVal || isReq;
    })
    .map(k => ({
      key: k,
      label: (props[k] && (props[k].x_label || props[k].title)) || k,
      section: (props[k] && props[k].x_section) || 'Other',
      sectionOrder: (props[k] && Number(props[k].x_section_order)) || 9999,
      order: (props[k] && Number(props[k].x_order)) || 9999,
      desc: (props[k] && props[k].description) || '',
      val: (payload || {})[k],
      required: !!(props[k] && props[k].x_required),
    }));
  // Build groups
  const groups = {};
  for (const it of items) {
    (groups[it.section] = groups[it.section] || []).push(it);
  }
  const sections = Object.keys(groups).sort((a,b)=> {
    // Prefer numeric section order if present on first item in each group
    const ao = (groups[a][0] && groups[a][0].sectionOrder) || 9999;
    const bo = (groups[b][0] && groups[b][0].sectionOrder) || 9999;
    if (ao !== bo) return ao - bo;
    return a.localeCompare(b);
  });
  const htmlParts = [];
  for (const sec of sections) {
    const arr = groups[sec].sort((a,b)=> a.order - b.order || a.label.localeCompare(b.label));
    const rows = arr.map(it => {
      const label = it.required ? `${it.label} *` : it.label;
      const val = String(it.val ?? '').trim().length ? fmt(it.val) : (showAll ? '' : '—');
      return `<tr><td>${label}</td><td class="right">${val}</td><td>${it.desc||''}</td></tr>`;
    }).join('');
    htmlParts.push(`
      <details class="card col-12" open>
        <summary><h3>${sec}</h3></summary>
        <table>
          <thead><tr><th>Field</th><th class="right">Value</th><th>Description</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </details>`);
  }
  el('#allfields').innerHTML = htmlParts.join('');
}

// Share link (copies current URL with filters/slug)
function copyShareLink() {
const url = window.location.href;
if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url)
      .then(() => alert('Link copied to clipboard'))
      .catch(() => fallbackCopy(url));
} else {
    fallbackCopy(url);
}
}
function fallbackCopy(text) {
const input = document.createElement('input');
input.value = text;
document.body.appendChild(input);
input.select();
document.execCommand('copy');
input.remove();
alert('Link copied to clipboard');
}

// Events
function initEvents() {
  ['#year', '#type', '#q', '#county', '#region'].forEach(id => el(id).addEventListener('input', applyFilters));
  el('#close').addEventListener('click', () => { el('#detail').hidden = true; destroyCharts(); });
  const exportBtn = el('#exportFiltered');
  if (exportBtn) exportBtn.addEventListener('click', exportFilteredCSV);
  // Keyboard shortcuts: Escape to exit full screen; 'f' to toggle when detail is open
  document.addEventListener('keydown', (e) => {
    const d = el('#detail');
    if (!d || d.hidden) return;
    if (e.key === 'Escape') {
      state.fullscreen = false;
      setFullscreen(false);
      const btn = el('#fullscreenToggle'); if (btn) btn.textContent = 'Full Screen';
      const cur = getParams(); setParams({ ...cur, view: null });
    } else if ((e.key || '').toLowerCase() === 'f') {
      state.fullscreen = !state.fullscreen;
      setFullscreen(state.fullscreen);
      const btn = el('#fullscreenToggle'); if (btn) btn.textContent = state.fullscreen ? 'Exit Full Screen' : 'Full Screen';
      const cur = getParams(); setParams({ ...cur, view: state.fullscreen ? 'full' : null });
    }
  });
}
initEvents();
loadIndex();

// Export filtered facility list
function exportFilteredCSV() {
  const headers = ['year', 'type', 'name', 'city', 'zip', 'county', 'region', 'variant', 'slug'];
  const rows = [headers].concat(state.filtered.map(r => headers.map(h => r[h] ?? '')));
  const csv = rows
      .map(r => r.map(x => '"' + String(x).replace(/"/g,'""') + '"').join(','))
      .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'facilities-filtered.csv';
  document.body.appendChild(a); a.click(); a.remove();
}
