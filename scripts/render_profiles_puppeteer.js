#!/usr/bin/env node
/*
Render PDFs from the generated HTML profiles using Puppeteer.

Usage examples:
  node scripts/render_profiles_puppeteer.js --year 2024 --type Hospital
  node scripts/render_profiles_puppeteer.js --year 2023 --type ESRD --slug some-slug
*/
const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      out[k] = v;
    }
  }
  return out;
}

async function ensureChartJs(page) {
  try {
    const chartPath = require.resolve('chart.js/dist/chart.umd.js');
    await page.addScriptTag({ path: chartPath });
    return true;
  } catch (e) {
    return false;
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const year = args.year;
  const type = args.type;
  const slug = args.slug;
  if (!year || !type) {
    console.error('Usage: --year <YYYY> --type <Hospital|ASTC|ESRD|LTC> [--slug <folder>]');
    process.exit(1);
  }
  const base = path.join('out', 'profiles', String(year), String(type));
  if (!fs.existsSync(base)) {
    console.error('No directory:', base);
    process.exit(1);
  }
  const targets = slug ? [path.join(base, slug + '.html')] : fs.readdirSync(base).filter(f => f.endsWith('.html')).map(f => path.join(base, f));

  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--font-render-hinting=none'] });
  const page = await browser.newPage();

  let ok = 0;
  for (const htmlPath of targets) {
    const abs = path.resolve(htmlPath);
    const url = 'file://' + abs;
    await page.goto(url, { waitUntil: 'networkidle0' });
    const hadChart = await ensureChartJs(page);
    // Trigger chart rendering if the HTML defined a deferred hook
    if (hadChart) {
      try { await page.evaluate(() => { if (window.__renderProfileCharts) window.__renderProfileCharts(); }); } catch {}
    }
    const pdfPath = abs.replace(/\.html$/i, '.pdf');
    await page.pdf({ path: pdfPath, format: 'Letter', printBackground: true, margin: { top: '0.6in', right: '0.7in', bottom: '0.6in', left: '0.7in' } });
    ok++;
  }

  await browser.close();
  console.log(`Rendered ${ok}/${targets.length} PDFs to ${base}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
