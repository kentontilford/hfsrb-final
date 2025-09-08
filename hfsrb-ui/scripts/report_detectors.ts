#!/usr/bin/env -S node --enable-source-maps
import { promises as fs } from "fs";
import * as XLSX from "xlsx";

function getHeadersFromXlsm(file: string, sheetName = 'Data') {
  const buf = XLSX.readFile(file);
  const ws = buf.Sheets[sheetName];
  if (!ws) throw new Error(`Missing sheet: ${sheetName}`);
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }) as any[];
  if (!rows.length) throw new Error('Empty sheet');
  const headers = (rows[0] as string[]).map(h => String(h || ''));
  return headers;
}

function detectRace(headers: string[]) {
  const cats: Record<string,string[]> = {
    white: ["white"],
    black: ["black", "african"],
    native: ["american indian", "native", "ai/an", "ai an", "ai_an"],
    asian: ["asian"],
    pacific: ["pacific", "hawaiian"],
    unknown: ["unknown", "other"],
  };
  const isAdmissions = (k: string) => /admissions?/i.test(k);
  const isPatientDays = (k: string) => /(patient\s*days|inpatient\s*days)/i.test(k);
  const match = (col: string, tokens: string[]) => tokens.some(t => col.toLowerCase().includes(t));
  const admissions: Record<string,string[]> = {} as any;
  const patientDays: Record<string,string[]> = {} as any;
  for (const c of Object.keys(cats)) {
    admissions[c] = headers.filter(h => match(h, cats[c]) && isAdmissions(h));
    patientDays[c] = headers.filter(h => match(h, cats[c]) && isPatientDays(h));
  }
  return { admissions, patientDays };
}

function detectPayers(headers: string[]) {
  const cats: Record<string,string[]> = {
    medicare: ["medicare"],
    medicaid: ["medicaid"],
    private: ["private"],
    otherPublic: ["other public", "other_public", "otherpublic"],
    privatePay: ["private pay", "self pay", "self-pay"],
    charity: ["charity"],
  };
  const isAdmissions = (k: string) => /admissions?/i.test(k) && /payer|payor/i.test(k);
  const isPatientDays = (k: string) => /(patient\s*days|inpatient\s*days)/i.test(k) && /payer|payor/i.test(k);
  const match = (col: string, tokens: string[]) => tokens.some(t => col.toLowerCase().includes(t));
  const admissions: Record<string,string[]> = {} as any;
  const patientDays: Record<string,string[]> = {} as any;
  for (const c of Object.keys(cats)) {
    admissions[c] = headers.filter(h => match(h, cats[c]) && isAdmissions(h));
    patientDays[c] = headers.filter(h => match(h, cats[c]) && isPatientDays(h));
  }
  return { admissions, patientDays };
}

function print(title: string, mapping: Record<string,string[]>) {
  console.log(`\n${title}`);
  for (const key of Object.keys(mapping)) {
    const cols = mapping[key];
    const list = cols.length ? ("\n  - " + cols.join("\n  - ")) : " (none)";
    console.log(` ${key}: ${cols.length}${list}`);
  }
}

async function main() {
  const file = process.env.DATA_XLSM;
  if (!file) { console.error('Set DATA_XLSM=/path/to/workbook.xlsm'); process.exit(2); }
  await fs.access(file);
  const headers = getHeadersFromXlsm(file, 'Data');
  const race = detectRace(headers);
  const payer = detectPayers(headers);
  console.log(`Headers detected: ${headers.length}`);
  print('Race - Admissions', race.admissions);
  print('Race - Patient Days', race.patientDays);
  print('Payer - Admissions', payer.admissions);
  print('Payer - Patient Days', payer.patientDays);
}

main().catch(e => { console.error(e); process.exit(1); });

