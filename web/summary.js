const S = {
  data: null,
  charts: {},
  sort: { county: { key: 'count', dir: 'desc' }, region: { key: 'count', dir: 'desc' } },
};

function el(sel) { return document.querySelector(sel); }
function fmt(n) {
  const x = Number(String(n).replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(x) ? x.toLocaleString('en-US') : (n || '');
}

async function load() {
  const res = await fetch('data/summary.json?v=2');
  S.data = await res.json();
  const years = Object.keys(S.data).sort((a, b) => b - a);
  el('#year').innerHTML = years.map(y => `<option>${y}</option>`).join('');
  el('#type').value = 'Hospital';
  update();
}

function update() {
  const y = el('#year').value;
  const t = el('#type').value;
  const bucket = (S.data[y] || {})[t] || { totals: 0, by_county: {}, by_region: {} };
  el('#totals').textContent = `${bucket.totals || 0} facilities`;
  draw('#county', 'By County', bucket.by_county || {});
  draw('#region', 'By Region', bucket.by_region || {});
  renderTable('county', bucket.by_county || {}, bucket.totals || 0);
  renderTable('region', bucket.by_region || {}, bucket.totals || 0);
}

function destroyChart(sel) { try { S.charts[sel] && S.charts[sel].destroy(); } catch {} }

function draw(sel, title, obj) {
  const labels = Object.keys(obj || {});
  const data = labels.map(k => obj[k]);
  destroyChart(sel);
  const ctx = el(sel).getContext('2d');
  S.charts[sel] = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ data }] },
    options: { plugins: { title: { display: true, text: title }, legend: { display: false } }, scales: { y: { beginAtZero: true } } },
  });
}

['change'].forEach(ev => { el('#year').addEventListener(ev, update); el('#type').addEventListener(ev, update); });
el('#exportCounty').addEventListener('click', () => exportCSV('county'));
el('#exportRegion').addEventListener('click', () => exportCSV('region'));

['#tbl-county', '#tbl-region'].forEach(sel => {
  el(sel).querySelectorAll('th').forEach(th => th.addEventListener('click', () => {
    const tbl = sel.includes('county') ? 'county' : 'region';
    const key = th.getAttribute('data-key');
    const cur = S.sort[tbl];
    const dir = (cur.key === key && cur.dir === 'desc') ? 'asc' : 'desc';
    S.sort[tbl] = { key, dir };
    update();
  }));
});

load();

function rowsFromMap(obj, total) {
  return Object.keys(obj || {}).map(name => {
    const count = obj[name] || 0;
    const percent = total ? ((count / total) * 100).toFixed(1) + '%' : '0.0%';
    return { name, count, percent };
  });
}

function renderTable(which, map, total) {
  const rows = rowsFromMap(map, total);
  const sort = S.sort[which] || { key: 'count', dir: 'desc' };
  rows.sort((a, b) => {
    const A = a[sort.key];
    const B = b[sort.key];
    if (sort.key === 'count') return sort.dir === 'asc' ? A - B : B - A;
    return sort.dir === 'asc' ? String(A).localeCompare(String(B)) : String(B).localeCompare(String(A));
  });
  const tbody = el(which === 'county' ? '#tbl-county tbody' : '#tbl-region tbody');
  tbody.innerHTML = rows.map(r => `<tr><td>${r.name}</td><td class="right">${fmt(r.count)}</td><td class="right">${r.percent}</td></tr>`).join('');
}

function exportCSV(which) {
  const y = el('#year').value;
  const t = el('#type').value;
  const bucket = (S.data[y] || {})[t] || { totals: 0 };
  const map = which === 'county' ? (bucket.by_county || {}) : (bucket.by_region || {});
  const rows = rowsFromMap(map, bucket.totals || 0);
  const header = which === 'county' ? ['county', 'count', 'percent'] : ['region', 'count', 'percent'];
  const csv = [header.join(',')].concat(rows.map(r => [r.name, r.count, r.percent].join(','))).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `summary-${which}-${y}-${t}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
}

