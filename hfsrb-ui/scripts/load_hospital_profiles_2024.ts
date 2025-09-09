#!/usr/bin/env -S node --enable-source-maps
// @ts-nocheck
import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";
import * as XLSX from "xlsx";
import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

/**
 * Minimal ETL for 2024 IL Hospital Profiles Data sheet
 * Usage: DATA_XLSM=/absolute/path/to/workbook.xlsm pnpm load:hospital2024
 */

const Row = z.object({
  facility_id: z.string().min(1),
  name: z.string().min(1),
  county: z.string().optional().nullable(),
  hsa: z.string().optional().nullable(),
  hpa: z.string().optional().nullable(),
  hospital_type: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  zip: z.string().optional().nullable(),
  ms_con: z.coerce.number().int().nullable().optional(),
  icu_con: z.coerce.number().int().nullable().optional(),
  ped_con: z.coerce.number().int().nullable().optional(),
  obgyn_con: z.coerce.number().int().nullable().optional(),
  ltc_con: z.coerce.number().int().nullable().optional(),
  ms_admissions: z.coerce.number().int().nullable().optional(),
  ms_patient_days: z.coerce.number().int().nullable().optional(),
  ms_observation_days: z.coerce.number().int().nullable().optional(),
  race_white: z.coerce.number().nullable().optional(),
  race_black: z.coerce.number().nullable().optional(),
  race_native_american: z.coerce.number().nullable().optional(),
  race_asian: z.coerce.number().nullable().optional(),
  race_pacific_islander: z.coerce.number().nullable().optional(),
  race_unknown: z.coerce.number().nullable().optional(),
  ethnicity_hispanic: z.coerce.number().nullable().optional(),
  ethnicity_non_hispanic: z.coerce.number().nullable().optional(),
  ethnicity_unknown: z.coerce.number().nullable().optional(),
}).strict();

function mapHeaders(h: string): string {
  const m: Record<string, string> = {
    "ID #": "facility_id",
    "Hospital Name": "name",
    "County": "county",
    "Hospital Address": "address",
    "Hospital City": "city",
    "ZIP": "zip",
    "HSA": "hsa",
    "HPA": "hpa",
    "Hospital Type": "hospital_type",
    "MS-CON": "ms_con",
    "ICU-CON": "icu_con",
    "PED-CON": "ped_con",
    "OBGYN-CON": "obgyn_con",
    "LTC-CON": "ltc_con",
    "MS Total Admissions": "ms_admissions",
    "MS Total PD": "ms_patient_days",
    "MS Observation Days": "ms_observation_days",
    // Add race/ethnicity mappings if present in Data sheet
  };
  return m[h] ?? h;
}

function toJsonRows(wb: XLSX.WorkBook, sheetName: string) {
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`Missing sheet: ${sheetName}`);
  const raw = XLSX.utils.sheet_to_json(ws, { defval: null, header: 1 }) as any[];
  if (raw.length === 0) return [];
  const headers = (raw[0] as string[]).map(mapHeaders);
  const out: any[] = [];
  for (let i = 1; i < raw.length; i++) {
    const row = raw[i] as any[];
    const o: Record<string, any> = {};
    headers.forEach((h, idx) => { o[h] = row[idx] ?? null; });
    out.push(o);
  }
  return out;
}

function cleanNum(v: any) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

async function main() {
  const file = process.env.DATA_XLSM;
  if (!file) {
    console.error("Set DATA_XLSM=/absolute/path/to/2024 workbook .xlsm");
    process.exit(2);
  }
  const buf = await fs.readFile(file);
  const wb = XLSX.read(buf, { type: "buffer" });
  const rows = toJsonRows(wb, "Data");
  console.log(`Rows: ${rows.length}`);
  const detectors = detectColumns(rows);
  const payers = detectPayers(rows);
  // Detector report (compact)
  function logDetector(title: string, det: Record<string, string[]>) {
    const keys = Object.keys(det);
    const parts = keys.map(k => `${k}=${det[k].length}`).join(', ');
    console.log(`${title}: ${parts}`);
  }
  console.log('Detector summary');
  logDetector('race.admissions', detectors.admissions as any);
  logDetector('race.patientDays', detectors.patientDays as any);
  logDetector('payer.admissions', payers.admissions as any);
  logDetector('payer.patientDays', payers.patientDays as any);

  let ok = 0, bad = 0;
  for (const r0 of rows) {
    try {
      const r = Row.parse({
        ...r0,
        facility_id: String(r0["facility_id"] ?? r0["ID #"] ?? "").trim(),
      });
      if (!r.facility_id) continue;
      // facility upsert (type=Hospital)
      const addressJson = r.address || r.city || r.zip ? JSON.stringify({
        street: (r.address ?? undefined),
        city: (r.city ?? undefined),
        zip: (r.zip ?? undefined),
        state: "IL",
      }) : null;
      await db.execute(sql`
        insert into facility (id,type,name,county,hsa,hpa,address,active)
        values (${r.facility_id}, 'Hospital', ${r.name.trim()}, ${r.county ?? null}, ${r.hsa ?? null}, ${r.hpa ?? null}, ${addressJson}, true)
        on conflict (id) do update
        set name=excluded.name, county=excluded.county, hsa=excluded.hsa, hpa=excluded.hpa, address=excluded.address, active=true
      `);

      // payer shares per row (if present)
      const payerShare = computePayerRowShare(r0, payers);

      // profile upsert (legacy 2024 table)
      await db.execute(sql`
        insert into hospital_profile_2024 (
          facility_id, year, hospital_type,
          ms_con, icu_con, ped_con, obgyn_con, ltc_con,
          ms_admissions, ms_patient_days, ms_observation_days,
          race_white, race_black, race_native_american, race_asian, race_pacific_islander, race_unknown,
          ethnicity_hispanic, ethnicity_non_hispanic, ethnicity_unknown,
          payer_medicare, payer_medicaid, payer_private, payer_other_public, payer_private_pay, payer_charity
        ) values (
          ${r.facility_id}, 2024, ${r.hospital_type ?? null},
          ${cleanNum(r.ms_con)}, ${cleanNum(r.icu_con)}, ${cleanNum(r.ped_con)}, ${cleanNum(r.obgyn_con)}, ${cleanNum(r.ltc_con)},
          ${cleanNum(r.ms_admissions)}, ${cleanNum(r.ms_patient_days)}, ${cleanNum(r.ms_observation_days)},
          ${cleanNum(r.race_white)}, ${cleanNum(r.race_black)}, ${cleanNum(r.race_native_american)}, ${cleanNum(r.race_asian)}, ${cleanNum(r.race_pacific_islander)}, ${cleanNum(r.race_unknown)},
          ${cleanNum(r.ethnicity_hispanic)}, ${cleanNum(r.ethnicity_non_hispanic)}, ${cleanNum(r.ethnicity_unknown)},
          ${payerShare?.medicare ?? null}, ${payerShare?.medicaid ?? null}, ${payerShare?.private ?? null}, ${payerShare?.otherPublic ?? null}, ${payerShare?.privatePay ?? null}, ${payerShare?.charity ?? null}
        )
        on conflict (facility_id) do update set
          hospital_type=excluded.hospital_type,
          ms_con=excluded.ms_con,
          icu_con=excluded.icu_con,
          ped_con=excluded.ped_con,
          obgyn_con=excluded.obgyn_con,
          ltc_con=excluded.ltc_con,
          ms_admissions=excluded.ms_admissions,
          ms_patient_days=excluded.ms_patient_days,
          ms_observation_days=excluded.ms_observation_days,
          race_white=excluded.race_white,
          race_black=excluded.race_black,
          race_native_american=excluded.race_native_american,
          race_asian=excluded.race_asian,
          race_pacific_islander=excluded.race_pacific_islander,
          race_unknown=excluded.race_unknown,
          ethnicity_hispanic=excluded.ethnicity_hispanic,
          ethnicity_non_hispanic=excluded.ethnicity_non_hispanic,
          ethnicity_unknown=excluded.ethnicity_unknown,
          payer_medicare=excluded.payer_medicare,
          payer_medicaid=excluded.payer_medicaid,
          payer_private=excluded.payer_private,
          payer_other_public=excluded.payer_other_public,
          payer_private_pay=excluded.payer_private_pay,
          payer_charity=excluded.payer_charity,
          updated_at=now()
      `);

      // upsert into unified by-year table
      await db.execute(sql`
        insert into hospital_profile_by_year (
          facility_id, year, hospital_type,
          ms_con, icu_con, ped_con, obgyn_con, ltc_con,
          ms_admissions, ms_patient_days, ms_observation_days,
          race_white, race_black, race_native_american, race_asian, race_pacific_islander, race_unknown,
          ethnicity_hispanic, ethnicity_non_hispanic, ethnicity_unknown,
          payer_medicare, payer_medicaid, payer_private, payer_other_public, payer_private_pay, payer_charity
        ) values (
          ${r.facility_id}, 2024, ${r.hospital_type ?? null},
          ${cleanNum(r.ms_con)}, ${cleanNum(r.icu_con)}, ${cleanNum(r.ped_con)}, ${cleanNum(r.obgyn_con)}, ${cleanNum(r.ltc_con)},
          ${cleanNum(r.ms_admissions)}, ${cleanNum(r.ms_patient_days)}, ${cleanNum(r.ms_observation_days)},
          ${cleanNum(r.race_white)}, ${cleanNum(r.race_black)}, ${cleanNum(r.race_native_american)}, ${cleanNum(r.race_asian)}, ${cleanNum(r.race_pacific_islander)}, ${cleanNum(r.race_unknown)},
          ${cleanNum(r.ethnicity_hispanic)}, ${cleanNum(r.ethnicity_non_hispanic)}, ${cleanNum(r.ethnicity_unknown)},
          ${payerShare?.medicare ?? null}, ${payerShare?.medicaid ?? null}, ${payerShare?.private ?? null}, ${payerShare?.otherPublic ?? null}, ${payerShare?.privatePay ?? null}, ${payerShare?.charity ?? null}
        )
        on conflict (facility_id, year) do update set
          hospital_type=excluded.hospital_type,
          ms_con=excluded.ms_con,
          icu_con=excluded.icu_con,
          ped_con=excluded.ped_con,
          obgyn_con=excluded.obgyn_con,
          ltc_con=excluded.ltc_con,
          ms_admissions=excluded.ms_admissions,
          ms_patient_days=excluded.ms_patient_days,
          ms_observation_days=excluded.ms_observation_days,
          race_white=excluded.race_white,
          race_black=excluded.race_black,
          race_native_american=excluded.race_native_american,
          race_asian=excluded.race_asian,
          race_pacific_islander=excluded.race_pacific_islander,
          race_unknown=excluded.race_unknown,
          ethnicity_hispanic=excluded.ethnicity_hispanic,
          ethnicity_non_hispanic=excluded.ethnicity_non_hispanic,
          ethnicity_unknown=excluded.ethnicity_unknown,
          payer_medicare=excluded.payer_medicare,
          payer_medicaid=excluded.payer_medicaid,
          payer_private=excluded.payer_private,
          payer_other_public=excluded.payer_other_public,
          payer_private_pay=excluded.payer_private_pay,
          payer_charity=excluded.payer_charity,
          updated_at=now()
      `);
      ok++;
    } catch (e: any) {
      bad++;
      console.error("FAIL", r0?.["facility_id"] ?? r0?.["ID #"], e.message ?? e);
    }
  }
  console.log(`Done. OK=${ok} BAD=${bad}`);
  // Aggregate and upsert summaries
  const byHsa = new Map<string, any[]>();
  const byHpa = new Map<string, any[]>();
  for (const r0 of rows) {
    const id = String(r0["facility_id"] ?? r0["ID #"] ?? "");
    if (!id) continue;
    const hsa = (r0["hsa"] ?? r0["HSA"])?.toString() ?? null;
    const hpa = (r0["hpa"] ?? r0["HPA"])?.toString() ?? null;
    if (hsa) byHsa.set(hsa, [...(byHsa.get(hsa) ?? []), r0]);
    if (hpa) byHpa.set(hpa, [...(byHpa.get(hpa) ?? []), r0]);
  }

  function typeEq(row: any, target: string) {
    const t = (row["hospital_type"] ?? row["Hospital Type"] ?? "").toString();
    return t.toLowerCase() === target.toLowerCase();
  }
  function sum(rows: any[], key: string) {
    let s = 0;
    for (const r of rows) {
      const v = cleanNum(r[key] ?? r[key.toUpperCase()] ?? null);
      if (v !== null) s += v;
    }
    return s;
  }

  async function upsertHsa(hsa: string, group: any[]) {
    const total = group.length;
    const critical = group.filter(r => typeEq(r, "Critical Access Hospital")).length;
    const acuteLtc = group.filter(r => typeEq(r, "Acute LTC Hospital")).length;
    const general = group.filter(r => typeEq(r, "General Hospital")).length;
    const psych = group.filter(r => typeEq(r, "Psychiatric Hospital")).length;
    const rehab = group.filter(r => typeEq(r, "Rehabilitation Hospital")).length;
    const childrens = group.filter(r => {
      const t = (r["hospital_type"] ?? r["Hospital Type"] ?? "").toString().toLowerCase();
      return t.includes("children");
    }).length;
    // Race/Ethnicity weighted proportions
    const race = computeRace(group, detectors);
    const eth = computeEthnicity(group, detectors);
    const pay = computePayerGroup(group, payers);

    await db.execute(sql`
      insert into hsa_summary_2024 (
        hsa, total_hospitals, critical_access, acute_ltc, general, psychiatric, rehabilitation, childrens,
        ms_con, icu_con, ped_con, obgyn_con, ltc_con,
        ms_admissions, ms_patient_days, ms_observation_days,
        race_white, race_black, race_native_american, race_asian, race_pacific_islander, race_unknown,
        ethnicity_hispanic, ethnicity_non_hispanic, ethnicity_unknown,
        payer_medicare, payer_medicaid, payer_private, payer_other_public, payer_private_pay, payer_charity
      ) values (
        ${hsa}, ${total}, ${critical}, ${acuteLtc}, ${general}, ${psych}, ${rehab}, ${childrens},
        ${sum(group, "ms_con")}, ${sum(group, "icu_con")}, ${sum(group, "ped_con")}, ${sum(group, "obgyn_con")}, ${sum(group, "ltc_con")},
        ${sum(group, "ms_admissions")}, ${sum(group, "ms_patient_days")}, ${sum(group, "ms_observation_days")},
        ${race.white}, ${race.black}, ${race.native}, ${race.asian}, ${race.pi}, ${race.unknown},
        ${eth.hispanic}, ${eth.nonHispanic}, ${eth.unknown},
        ${pay.medicare}, ${pay.medicaid}, ${pay.private}, ${pay.otherPublic}, ${pay.privatePay}, ${pay.charity}
      )
      on conflict (hsa) do update set
        total_hospitals=excluded.total_hospitals,
        critical_access=excluded.critical_access,
        acute_ltc=excluded.acute_ltc,
        general=excluded.general,
        psychiatric=excluded.psychiatric,
        rehabilitation=excluded.rehabilitation,
        childrens=excluded.childrens,
        ms_con=excluded.ms_con,
        icu_con=excluded.icu_con,
        ped_con=excluded.ped_con,
        obgyn_con=excluded.obgyn_con,
        ltc_con=excluded.ltc_con,
        ms_admissions=excluded.ms_admissions,
        ms_patient_days=excluded.ms_patient_days,
        ms_observation_days=excluded.ms_observation_days,
        race_white=excluded.race_white,
        race_black=excluded.race_black,
        race_native_american=excluded.race_native_american,
        race_asian=excluded.race_asian,
        race_pacific_islander=excluded.race_pacific_islander,
        race_unknown=excluded.race_unknown,
        ethnicity_hispanic=excluded.ethnicity_hispanic,
        ethnicity_non_hispanic=excluded.ethnicity_non_hispanic,
        ethnicity_unknown=excluded.ethnicity_unknown,
        payer_medicare=excluded.payer_medicare,
        payer_medicaid=excluded.payer_medicaid,
        payer_private=excluded.payer_private,
        payer_other_public=excluded.payer_other_public,
        payer_private_pay=excluded.payer_private_pay,
        payer_charity=excluded.payer_charity,
        updated_at=now()
    `);

    // unified table by year
    await db.execute(sql`
      insert into hsa_summary_by_year (
        hsa, year, total_hospitals, critical_access, acute_ltc, general, psychiatric, rehabilitation, childrens,
        ms_con, icu_con, ped_con, obgyn_con, ltc_con,
        ms_admissions, ms_patient_days, ms_observation_days,
        race_white, race_black, race_native_american, race_asian, race_pacific_islander, race_unknown,
        ethnicity_hispanic, ethnicity_non_hispanic, ethnicity_unknown
      ) values (
        ${hsa}, 2024, ${total}, ${critical}, ${acuteLtc}, ${general}, ${psych}, ${rehab}, ${childrens},
        ${sum(group, "ms_con")}, ${sum(group, "icu_con")}, ${sum(group, "ped_con")}, ${sum(group, "obgyn_con")}, ${sum(group, "ltc_con")},
        ${sum(group, "ms_admissions")}, ${sum(group, "ms_patient_days")}, ${sum(group, "ms_observation_days")},
        ${race.white}, ${race.black}, ${race.native}, ${race.asian}, ${race.pi}, ${race.unknown},
        ${eth.hispanic}, ${eth.nonHispanic}, ${eth.unknown}
      )
      on conflict (hsa, year) do update set
        total_hospitals=excluded.total_hospitals,
        critical_access=excluded.critical_access,
        acute_ltc=excluded.acute_ltc,
        general=excluded.general,
        psychiatric=excluded.psychiatric,
        rehabilitation=excluded.rehabilitation,
        childrens=excluded.childrens,
        ms_con=excluded.ms_con,
        icu_con=excluded.icu_con,
        ped_con=excluded.ped_con,
        obgyn_con=excluded.obgyn_con,
        ltc_con=excluded.ltc_con,
        ms_admissions=excluded.ms_admissions,
        ms_patient_days=excluded.ms_patient_days,
        ms_observation_days=excluded.ms_observation_days,
        race_white=excluded.race_white,
        race_black=excluded.race_black,
        race_native_american=excluded.race_native_american,
        race_asian=excluded.race_asian,
        race_pacific_islander=excluded.race_pacific_islander,
        race_unknown=excluded.race_unknown,
        ethnicity_hispanic=excluded.ethnicity_hispanic,
        ethnicity_non_hispanic=excluded.ethnicity_non_hispanic,
        ethnicity_unknown=excluded.ethnicity_unknown,
        updated_at=now()
    `);
  }

  async function upsertHpa(hpa: string, group: any[]) {
    const total = group.length;
    const critical = group.filter(r => typeEq(r, "Critical Access Hospital")).length;
    const acuteLtc = group.filter(r => typeEq(r, "Acute LTC Hospital")).length;
    const general = group.filter(r => typeEq(r, "General Hospital")).length;
    const psych = group.filter(r => typeEq(r, "Psychiatric Hospital")).length;
    const rehab = group.filter(r => typeEq(r, "Rehabilitation Hospital")).length;
    const childrens = group.filter(r => {
      const t = (r["hospital_type"] ?? r["Hospital Type"] ?? "").toString().toLowerCase();
      return t.includes("children");
    }).length;
    const race = computeRace(group, detectors);
    const eth = computeEthnicity(group, detectors);
    const pay = computePayerGroup(group, payers);
    await db.execute(sql`
      insert into hpa_summary_2024 (
        hpa, total_hospitals, critical_access, acute_ltc, general, psychiatric, rehabilitation, childrens,
        ms_con, icu_con, ped_con, obgyn_con, ltc_con,
        ms_admissions, ms_patient_days, ms_observation_days,
        race_white, race_black, race_native_american, race_asian, race_pacific_islander, race_unknown,
        ethnicity_hispanic, ethnicity_non_hispanic, ethnicity_unknown,
        payer_medicare, payer_medicaid, payer_private, payer_other_public, payer_private_pay, payer_charity
      ) values (
        ${hpa}, ${total}, ${critical}, ${acuteLtc}, ${general}, ${psych}, ${rehab}, ${childrens},
        ${sum(group, "ms_con")}, ${sum(group, "icu_con")}, ${sum(group, "ped_con")}, ${sum(group, "obgyn_con")}, ${sum(group, "ltc_con")},
        ${sum(group, "ms_admissions")}, ${sum(group, "ms_patient_days")}, ${sum(group, "ms_observation_days")},
        ${race.white}, ${race.black}, ${race.native}, ${race.asian}, ${race.pi}, ${race.unknown},
        ${eth.hispanic}, ${eth.nonHispanic}, ${eth.unknown},
        ${pay.medicare}, ${pay.medicaid}, ${pay.private}, ${pay.otherPublic}, ${pay.privatePay}, ${pay.charity}
      )
      on conflict (hpa) do update set
        total_hospitals=excluded.total_hospitals,
        critical_access=excluded.critical_access,
        acute_ltc=excluded.acute_ltc,
        general=excluded.general,
        psychiatric=excluded.psychiatric,
        rehabilitation=excluded.rehabilitation,
        childrens=excluded.childrens,
        ms_con=excluded.ms_con,
        icu_con=excluded.icu_con,
        ped_con=excluded.ped_con,
        obgyn_con=excluded.obgyn_con,
        ltc_con=excluded.ltc_con,
        ms_admissions=excluded.ms_admissions,
        ms_patient_days=excluded.ms_patient_days,
        ms_observation_days=excluded.ms_observation_days,
        race_white=excluded.race_white,
        race_black=excluded.race_black,
        race_native_american=excluded.race_native_american,
        race_asian=excluded.race_asian,
        race_pacific_islander=excluded.race_pacific_islander,
        race_unknown=excluded.race_unknown,
        ethnicity_hispanic=excluded.ethnicity_hispanic,
        ethnicity_non_hispanic=excluded.ethnicity_non_hispanic,
        ethnicity_unknown=excluded.ethnicity_unknown,
        payer_medicare=excluded.payer_medicare,
        payer_medicaid=excluded.payer_medicaid,
        payer_private=excluded.payer_private,
        payer_other_public=excluded.payer_other_public,
        payer_private_pay=excluded.payer_private_pay,
        payer_charity=excluded.payer_charity,
        updated_at=now()
    `);

    // unified table by year
    await db.execute(sql`
      insert into hpa_summary_by_year (
        hpa, year, total_hospitals, critical_access, acute_ltc, general, psychiatric, rehabilitation, childrens,
        ms_con, icu_con, ped_con, obgyn_con, ltc_con,
        ms_admissions, ms_patient_days, ms_observation_days,
        race_white, race_black, race_native_american, race_asian, race_pacific_islander, race_unknown,
        ethnicity_hispanic, ethnicity_non_hispanic, ethnicity_unknown
      ) values (
        ${hpa}, 2024, ${total}, ${critical}, ${acuteLtc}, ${general}, ${psych}, ${rehab}, ${childrens},
        ${sum(group, "ms_con")}, ${sum(group, "icu_con")}, ${sum(group, "ped_con")}, ${sum(group, "obgyn_con")}, ${sum(group, "ltc_con")},
        ${sum(group, "ms_admissions")}, ${sum(group, "ms_patient_days")}, ${sum(group, "ms_observation_days")},
        ${race.white}, ${race.black}, ${race.native}, ${race.asian}, ${race.pi}, ${race.unknown},
        ${eth.hispanic}, ${eth.nonHispanic}, ${eth.unknown}
      )
      on conflict (hpa, year) do update set
        total_hospitals=excluded.total_hospitals,
        critical_access=excluded.critical_access,
        acute_ltc=excluded.acute_ltc,
        general=excluded.general,
        psychiatric=excluded.psychiatric,
        rehabilitation=excluded.rehabilitation,
        childrens=excluded.childrens,
        ms_con=excluded.ms_con,
        icu_con=excluded.icu_con,
        ped_con=excluded.ped_con,
        obgyn_con=excluded.obgyn_con,
        ltc_con=excluded.ltc_con,
        ms_admissions=excluded.ms_admissions,
        ms_patient_days=excluded.ms_patient_days,
        ms_observation_days=excluded.ms_observation_days,
        race_white=excluded.race_white,
        race_black=excluded.race_black,
        race_native_american=excluded.race_native_american,
        race_asian=excluded.race_asian,
        race_pacific_islander=excluded.race_pacific_islander,
        race_unknown=excluded.race_unknown,
        ethnicity_hispanic=excluded.ethnicity_hispanic,
        ethnicity_non_hispanic=excluded.ethnicity_non_hispanic,
        ethnicity_unknown=excluded.ethnicity_unknown,
        updated_at=now()
    `);
  }

  for (const [k, v] of Array.from(byHsa.entries())) { await upsertHsa(k, v); }
  for (const [k, v] of Array.from(byHpa.entries())) { await upsertHpa(k, v); }
  console.log(`Summaries updated: HSA=${byHsa.size} HPA=${byHpa.size}`);
}

// Helpers for race and ethnicity weighting
function num(v: any) {
  const n = Number(String(v ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function pick(row: any, names: string[]) {
  for (const n of names) {
    const v = row[n] ?? row[n.toUpperCase?.()] ?? row[n.replaceAll(" ", "_")] ?? row[n.replaceAll(" ", "").toLowerCase?.()];
    const x = num(v);
    if (x !== null) return x;
  }
  return null;
}

function weightOf(row: any) {
  return pick(row, ["ms_admissions", "MS Total Admissions"]) ?? pick(row, ["ms_patient_days", "MS Total PD"]) ?? null;
}

function computeWeightedMean(group: any[], valuePicker: (r:any)=>number|null) {
  let nume = 0, deno = 0, cnt = 0, sumv = 0;
  for (const r of group) {
    const v = valuePicker(r); if (v === null) continue;
    const w = weightOf(r);
    if (w !== null) { nume += v * w; deno += w; }
    cnt++; sumv += v;
  }
  if (deno > 0) return nume / deno;
  if (cnt > 0) return sumv / cnt;
  return null;
}

type Detectors = {
  admissions: Record<string, string[]>;
  patientDays: Record<string, string[]>;
};

function detectColumns(rows: any[]): Detectors {
  const keys = new Set<string>();
  for (const r of rows) for (const k of Object.keys(r)) keys.add(k);
  const all = Array.from(keys);
  const catKeys: Record<string, string[]> = {
    white: ["white"],
    black: ["black", "african"],
    native: ["american indian", "native", "ai/an", "ai an", "ai_an"],
    asian: ["asian"],
    pacific: ["pacific", "hawaiian"],
    unknown: ["unknown", "other"],
    hispanic: ["hispanic"],
    nonHispanic: ["not hispanic", "non-hispanic", "non hispanic"],
    ethUnknown: ["unknown"],
  };
  const isAdmissions = (k: string) => /admissions?/i.test(k);
  const isPatientDays = (k: string) => /(patient\s*days|inpatient\s*days)/i.test(k);
  function find(cols: string[], raceTokens: string[]) {
    return cols.filter(c => raceTokens.some(t => c.toLowerCase().includes(t)));
  }
  const admissions: Record<string, string[]> = {
    white: find(all, catKeys.white).filter(isAdmissions),
    black: find(all, catKeys.black).filter(isAdmissions),
    native: find(all, catKeys.native).filter(isAdmissions),
    asian: find(all, catKeys.asian).filter(isAdmissions),
    pacific: find(all, catKeys.pacific).filter(isAdmissions),
    unknown: find(all, catKeys.unknown).filter(isAdmissions),
    hispanic: find(all, catKeys.hispanic).filter(isAdmissions),
    nonHispanic: find(all, catKeys.nonHispanic).filter(isAdmissions),
    ethUnknown: find(all, catKeys.ethUnknown).filter(isAdmissions),
  } as any;
  const patientDays: Record<string, string[]> = {
    white: find(all, catKeys.white).filter(isPatientDays),
    black: find(all, catKeys.black).filter(isPatientDays),
    native: find(all, catKeys.native).filter(isPatientDays),
    asian: find(all, catKeys.asian).filter(isPatientDays),
    pacific: find(all, catKeys.pacific).filter(isPatientDays),
    unknown: find(all, catKeys.unknown).filter(isPatientDays),
    hispanic: find(all, catKeys.hispanic).filter(isPatientDays),
    nonHispanic: find(all, catKeys.nonHispanic).filter(isPatientDays),
    ethUnknown: find(all, catKeys.ethUnknown).filter(isPatientDays),
  } as any;
  return { admissions, patientDays };
}

function sumRow(row: any, cols: string[]) {
  let s = 0; let seen = 0;
  for (const c of cols) {
    if (!(c in row)) continue;
    const v = num(row[c]);
    if (v !== null) { s += v; seen++; }
  }
  return { sum: s, seen };
}

function sumGroup(group: any[], cols: string[]) {
  let s = 0; let seen = 0;
  for (const r of group) { const { sum, seen: sn } = sumRow(r, cols); s += sum; seen += sn; }
  return { sum: s, seen };
}

function computeRace(group: any[], detectors: Detectors) {
  // Prefer admissions if present; else patient days; else fallback
  const use = Object.values(detectors.admissions).some(v => v.length) ? detectors.admissions : detectors.patientDays;
  if (Object.values(use).every(v => v.length === 0)) {
    // fallback to old weighted approach
    const white = computeWeightedMean(group, r => pick(r, ["race_white", "White"])) ?? null;
    const black = computeWeightedMean(group, r => pick(r, ["race_black", "Black", "Black/African American"])) ?? null;
    const native = computeWeightedMean(group, r => pick(r, ["race_native_american", "AI/AN", "American Indian"])) ?? null;
    const asian = computeWeightedMean(group, r => pick(r, ["race_asian", "Asian"])) ?? null;
    const pi = computeWeightedMean(group, r => pick(r, ["race_pacific_islander", "NH/PI"])) ?? null;
    const unknown = computeWeightedMean(group, r => pick(r, ["race_unknown", "Unknown"])) ?? null;
    return { white, black, native, asian, pi, unknown };
  }
  const cats = ["white","black","native","asian","pacific","unknown"] as const;
  const totals: Record<string, number> = {};
  let grand = 0;
  for (const c of cats) {
    const { sum } = sumGroup(group, use[c] || []);
    totals[c] = sum;
    grand += sum;
  }
  if (grand <= 0) return { white: null, black: null, native: null, asian: null, pi: null, unknown: null };
  return {
    white: totals.white / grand,
    black: totals.black / grand,
    native: totals.native / grand,
    asian: totals.asian / grand,
    pi: totals.pacific / grand,
    unknown: totals.unknown / grand,
  };
}

function computeEthnicity(group: any[], detectors: Detectors) {
  const use = Object.values(detectors.admissions).some(v => v.length) ? detectors.admissions : detectors.patientDays;
  if ((use.hispanic?.length ?? 0) + (use.nonHispanic?.length ?? 0) + (use.ethUnknown?.length ?? 0) === 0) {
    const hispanic = computeWeightedMean(group, r => pick(r, ["ethnicity_hispanic", "Hispanic/Latino"])) ?? null;
    const nonHispanic = computeWeightedMean(group, r => pick(r, ["ethnicity_non_hispanic", "Not Hispanic/Latino"])) ?? null;
    const unknown = computeWeightedMean(group, r => pick(r, ["ethnicity_unknown", "Unknown Ethnicity"])) ?? null;
    return { hispanic, nonHispanic, unknown };
  }
  const his = sumGroup(group, use.hispanic || []).sum;
  const non = sumGroup(group, use.nonHispanic || []).sum;
  const unk = sumGroup(group, use.ethUnknown || []).sum;
  const grand = his + non + unk;
  if (grand <= 0) return { hispanic: null, nonHispanic: null, unknown: null };
  return { hispanic: his / grand, nonHispanic: non / grand, unknown: unk / grand };
}

// Payer detection/aggregation
type PayerDetectors = {
  admissions: Record<string, string[]>;
  patientDays: Record<string, string[]>;
}

function detectPayers(rows: any[]): PayerDetectors {
  const keys = new Set<string>();
  for (const r of rows) for (const k of Object.keys(r)) keys.add(k);
  const all = Array.from(keys);
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
  function find(cols: string[], tokens: string[]) {
    return cols.filter(c => tokens.some(t => c.toLowerCase().includes(t)));
  }
  const admissions: any = {};
  const patientDays: any = {};
  for (const k of Object.keys(cats)) {
    admissions[k] = find(all, cats[k]).filter(isAdmissions);
    patientDays[k] = find(all, cats[k]).filter(isPatientDays);
  }
  return { admissions, patientDays };
}

function computePayerRowShare(row: any, pdet: PayerDetectors) {
  // sum row counts by category, prefer admissions
  const use = Object.values(pdet.admissions).some(v => v.length) ? pdet.admissions : pdet.patientDays;
  const cats = ["medicare","medicaid","private","otherPublic","privatePay","charity"] as const;
  const sums: Record<string, number> = {};
  let total = 0;
  for (const c of cats) { const { sum } = sumRow(row, use[c] || []); sums[c] = sum; total += sum; }
  if (total <= 0) return null;
  const r: any = {};
  for (const c of cats) r[c] = sums[c] / total;
  return r as { medicare:number; medicaid:number; private:number; otherPublic:number; privatePay:number; charity:number };
}

function computePayerGroup(group: any[], pdet: PayerDetectors) {
  const use = Object.values(pdet.admissions).some(v => v.length) ? pdet.admissions : pdet.patientDays;
  const cats = ["medicare","medicaid","private","otherPublic","privatePay","charity"] as const;
  const totals: Record<string, number> = {};
  let grand = 0;
  for (const c of cats) {
    const { sum } = sumGroup(group, use[c] || []);
    totals[c] = sum; grand += sum;
  }
  if (grand <= 0) return { medicare: null, medicaid: null, private: null, otherPublic: null, privatePay: null, charity: null };
  return {
    medicare: totals.medicare / grand,
    medicaid: totals.medicaid / grand,
    private: totals.private / grand,
    otherPublic: totals.otherPublic / grand,
    privatePay: totals.privatePay / grand,
    charity: totals.charity / grand,
  };
}

main().catch(e => { console.error(e); process.exit(1); });
