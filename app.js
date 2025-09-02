
const state = { all: [], filtered: [], charts: {} };
function el(sel){ return document.querySelector(sel); }
function fmt(n){ const x=Number(String(n).replace(/[^0-9\.-]/g,'')); return isFinite(x)? x.toLocaleString('en-US'): (n||''); }
function getParams(){
  const u = new URL(window.location.href);
  const o = Object.fromEntries(u.searchParams.entries());
  return o;
}
function setParams(params){
  const u = new URL(window.location.href);
  Object.entries(params).forEach(([k,v])=>{
    if (v && String(v).length) u.searchParams.set(k, v); else u.searchParams.delete(k);
  });
  window.history.replaceState({}, '', u.toString());
}
async function loadIndex(){
  const res = await fetch('data/index.json');
  state.all = await res.json();
  const years = [...new Set(state.all.map(r=>r.year))].sort((a,b)=>b-a);
  const ysel = el('#year');
  ysel.innerHTML = '<option value="">All Years</option>' + years.map(y=>`<option>${y}</option>`).join('');
  const counties = [...new Set(state.all.map(r=>r.county).filter(Boolean))].sort((a,b)=> a.localeCompare(b));
  const regions = [...new Set(state.all.map(r=>r.region).filter(Boolean))].sort((a,b)=> String(a).localeCompare(String(b)));
  el('#county').innerHTML = '<option value="">All Counties</option>' + counties.map(c=>`<option>${c}</option>`).join('');
  el('#region').innerHTML = '<option value="">All Regions</option>' + regions.map(r=>`<option>${r}</option>`).join('');
  const p = getParams();
  if (p.year) el('#year').value = p.year;
  if (p.type) el('#type').value = p.type;
  if (p.county) el('#county').value = p.county;
  if (p.region) el('#region').value = p.region;
  if (p.q) el('#q').value = p.q;
  
  applyFilters();
  const p2 = getParams();
  if (p2.slug && p2.year && p2.type){ openDetail({ year: p2.year, type: p2.type, slug: p2.slug }); }
}
function applyFilters(){
  const year = el('#year').value;
  const type = el('#type').value;
  const county = el('#county').value;
  const region = el('#region').value;
  const q = el('#q').value.trim().toLowerCase();
  let rows = state.all.slice();
  if (year) rows = rows.filter(r=>String(r.year)===String(year));
  if (type) rows = rows.filter(r=>r.type===type);
  if (county) rows = rows.filter(r=> (r.county||'')===county);
  if (region) rows = rows.filter(r=> String(r.region||'')===String(region));
  if (q){ rows = rows.filter(r=> (r.name+' '+(r.city||'')+' '+(r.zip||'')).toLowerCase().includes(q)); }
  state.filtered = rows;
  renderList();
  setParams({year, type, county, region, q});
}
function renderList(){
  const ul = el('#list');
  ul.innerHTML = state.filtered.map(r=>`
    <li data-year="${r.year}" data-type="${r.type}" data-slug="${r.slug}">
      <div class="name">${r.name}</div>
      <div class="meta">${r.type} • ${r.city||''} ${r.zip||''} • ${r.year} ${r.variant? '• '+r.variant: ''}</div>
    </li>`).join('');
  el('#stats').textContent = `${state.filtered.length} facilities`;
  ul.querySelectorAll('li').forEach(li=> li.addEventListener('click', ()=> openDetail(li.dataset)) );
}
function payerOrder(labels){
  const order = ['Medicare','Medicaid','Private Insurance','Other Public','Private Pay','Charity Care'];
  return labels.slice().sort((a,b)=> order.indexOf(a)-order.indexOf(b));
}
function raceOrder(labels){
  const order = ['White','Black/African American','Black','Asian','AI/AN','American Indian','NH/PI','Unknown'];
  return labels.slice().sort((a,b)=> order.indexOf(a)-order.indexOf(b));
}
async function openDetail(data){
  const rec = state.filtered.find(r=> r.year==data.year && r.type==data.type && r.slug==data.slug);
  if (!rec) return;
  const res = await fetch(rec.data_path);
  const doc = await res.json();
  const meta = doc.meta||{}; const p = doc.payload||{};
  const d = el('#detail'); d.hidden=false;
  el('#meta').innerHTML = `<h2>${meta.facility_name||p.facility_name||rec.name}</h2>
    <div class="meta">${p.address_line1||p.facility_address||''}, ${p.address_city||p.facility_city||''} ${p.address_zip||p.facility_zip||''} — ${rec.type} • ${rec.year}</div>`;
  const links = [];
  links.push(`<a href="../out/profiles/${rec.year}/${rec.type}/${rec.slug}.html" target="_blank">Open Profile (HTML)</a>`);
  links.push(`<a href="../out/profiles/${rec.year}/${rec.type}/${rec.slug}.pdf" target="_blank">Open Profile (PDF)</a>`);
  links.push(`<button id="dlcsv">Download CSV</button>`);
  links.push(`<button id="dlcharts">Download Charts (PNG)</button>`);
  el('#links').innerHTML = links.join(' ');
  el('#dlcsv').addEventListener('click', ()=> downloadCSV(meta, p));
  el('#dlcharts').addEventListener('click', downloadCharts);
  drawCharts(rec.type, p);
  setParams({year: rec.year, type: rec.type, slug: rec.slug, q: el('#q').value, county: el('#county').value, region: el('#region').value});
}
function destroyCharts(){
  for (const k in state.charts){ try{ state.charts[k].destroy(); }catch{} }
  state.charts={};
}
function drawCharts(type, p){
  destroyCharts();
  const payerMap = type==='Hospital' ? {
    'Inpatient Medicare': p.pay_inp_medicare,
    'Inpatient Medicaid': p.pay_inp_medicaid,
    'Inpatient Private Insurance': p.pay_inp_private_ins,
    'Inpatient Other Public': p.pay_inp_other_public,
    'Inpatient Private Pay': p.pay_inp_private_pay,
  } : {
    'Medicare': p.pat_medicare,
    'Medicaid': p.pat_medicaid,
    'Private Insurance': p.pat_private_insurance,
    'Other Public': p.pat_other_public,
    'Private Pay': p.pat_private_payment,
    'Charity Care': p.pat_charity,
  };
  const payerLabels = (type==='Hospital'? Object.keys(payerMap): payerOrder(Object.keys(payerMap))).filter(k=> payerMap[k]!=null && String(payerMap[k]).trim()!=='');
  const payerVals = payerLabels.map(k=> Number(String(payerMap[k]).replace(/[^0-9\.-]/g,''))||0);
  drawDoughnut('#chart-payer','Payer Mix', payerLabels, payerVals);
  const raceMap = type==='Hospital'? {
    'Inpatient White': p.race_inp_white,
    'Inpatient Black': p.race_inp_black,
    'Inpatient Asian': p.race_inp_asian,
    'Inpatient AI/AN': p.race_inp_ai_an,
    'Inpatient NH/PI': p.race_inp_nh_pi,
    'Inpatient Unknown': p.race_inp_unknown,
  } : {
    'White': p.race_white,
    'Black/African American': p.race_black || p.race_black_african_american,
    'Asian': p.race_asian,
    'American Indian': p.race_american_indian,
    'NH/PI': p.race_native_hawaiian_pacific_islander || p.race_nh_pi,
    'Unknown': p.race_unknown,
  };
  const raceLabels = raceOrder(Object.keys(raceMap)).filter(k=> raceMap[k]!=null && String(raceMap[k]).trim()!=='');
  const raceVals = raceLabels.map(k=> Number(String(raceMap[k]).replace(/[^0-9\.-]/g,''))||0);
  drawBar('#chart-race','Race', raceLabels, raceVals, true);
  const ethMap = type==='Hospital'? {
    'Inpatient Not Hispanic': p.eth_inp_not_hispanic,
    'Inpatient Hispanic': p.eth_inp_hispanic,
    'Inpatient Unknown': p.eth_inp_unknown,
  } : {
    'Non-Hispanic': p.ethnicity_non_hispanic || p.eth_not_hispanic,
    'Hispanic/Latino': p.ethnicity_hispanic_latino || p.eth_hispanic,
    'Unknown': p.ethnicity_unknown || p.eth_unknown,
  };
  const ethLabels = Object.keys(ethMap).filter(k=> ethMap[k]!=null && String(ethMap[k]).trim()!=='');
  const ethVals = ethLabels.map(k=> Number(String(ethMap[k]).replace(/[^0-9\.-]/g,''))||0);
  drawBar('#chart-eth','Ethnicity', ethLabels, ethVals, true);
}
function drawDoughnut(sel, title, labels, data){
  const ctx = el(sel).getContext('2d');
  state.charts[sel] = new Chart(ctx, { type: 'doughnut', data: { labels, datasets: [{ data }] }, options: { plugins: { title: { display: true, text: title } } } });
  state.charts[sel].$chart_config = { centerTotal: true, ringLabels: true };
}
function drawBar(sel, title, labels, data, percentLabels=false){
  const ctx = el(sel).getContext('2d');
  state.charts[sel] = new Chart(ctx, { type: 'bar', data: { labels, datasets: [{ data }] }, options: { plugins: { title: { display: true, text: title }, legend: { display: false } }, scales: { y: { beginAtZero: true } } } });
  state.charts[sel].$chart_config = { percentLabels };
}
function downloadCSV(meta, payload){
  const rows = [['key','value']];
  Object.entries(payload||{}).forEach(([k,v])=> rows.push([k, String(v??'')]));
  const csv = rows.map(r => r.map(x => '"' + String(x).replace(/"/g, '""') + '"').join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (meta.facility_name||'facility').replace(/[^a-z0-9]+/gi,'-').toLowerCase()+'.csv';
  document.body.appendChild(a); a.click(); a.remove();
}
function downloadCharts(){
  for (const id of ['#chart-payer','#chart-race','#chart-eth']){
    const cv = el(id);
    if (!cv) continue;
    const a = document.createElement('a');
    a.href = cv.toDataURL('image/png');
    a.download = id.replace('#','')+'.png';
    document.body.appendChild(a); a.click(); a.remove();
  }
}
function initEvents(){
  ['#year','#type','#q','#county','#region'].forEach(id=> el(id).addEventListener('input', applyFilters));
  el('#close').addEventListener('click', ()=>{ el('#detail').hidden=true; destroyCharts(); });
  el('#exportFiltered').addEventListener('click', exportFilteredCSV);
}
initEvents();
loadIndex();

function exportFilteredCSV(){
  const headers = ['year','type','name','city','zip','county','region','variant','slug'];
  const rows = [headers].concat(state.filtered.map(r=> headers.map(h=> r[h] ?? '')));
  const csv = rows.map(r=> r.map(x=> '"'+String(x).replace(/"/g,'""')+'"').join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'facilities-filtered.csv';
  document.body.appendChild(a); a.click(); a.remove();
}
