#!/usr/bin/env -S node --enable-source-maps
import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';
import { Pool } from 'pg';

/**
 * Load 2024 Hospital profiles from data/2024/Hospital/<facility>/schema_payload.json
 * Usage: pnpm load:hospital2024:json
 */

const Payload = z.object({
  facility_id: z.string().min(1),
  facility_name: z.string().min(1).optional(),
  county: z.string().optional().nullable(),
  hsa: z.string().optional().nullable(),
  hpa: z.string().optional().nullable(),
  address_street: z.string().optional().nullable(),
  address_city: z.string().optional().nullable(),
  address_zip: z.string().optional().nullable(),
  hospital_type: z.string().optional().nullable(),
  // Source keys we will map (all optional)
  med_surg_beds_oct1: z.any().optional(),
  icu_beds_oct1: z.any().optional(),
  peds_beds_oct1: z.any().optional(),
  obgyn_beds_oct1: z.any().optional(),
  med_surg_admissions: z.any().optional(),
  med_surg_days_total: z.any().optional(),
  med_surg_observation_days: z.any().optional(),
  race_inp_white: z.any().optional(),
  race_inp_black: z.any().optional(),
  race_inp_ai_an: z.any().optional(),
  race_inp_asian: z.any().optional(),
  race_inp_nh_pi: z.any().optional(),
  race_inp_unknown: z.any().optional(),
  eth_inp_hispanic: z.any().optional(),
  eth_inp_not_hispanic: z.any().optional(),
  eth_inp_unknown: z.any().optional(),
}).passthrough().transform((p) => ({
  ...p,
  name: p.facility_name,
  address: (p.address_street || p.address_city || p.address_zip)
    ? { street: p.address_street ?? undefined, city: p.address_city ?? undefined, zip: p.address_zip ?? undefined, state: 'IL' }
    : undefined,
}));

async function listSchemaFiles(base: string) {
  const root = path.resolve(base);
  const out: string[] = [];
  async function walk(dir: string) {
    for (const e of await fs.readdir(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) await walk(p);
      else if (e.isFile() && e.name === 'schema_payload.json') out.push(p);
    }
  }
  await walk(root);
  return out;
}

function cleanNum(v: any) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

async function main() {
  const ROOT = path.resolve(__dirname, '..', '..');
  const DATA_DIR = path.join(ROOT, 'data', '2024', 'Hospital');
  await fs.access(DATA_DIR).catch(() => { console.error(`Missing ${DATA_DIR}`); process.exit(2); });
  const files = await listSchemaFiles(DATA_DIR);
  console.log(`Found ${files.length} hospital schema files`);
  // DB pool (direct pg)
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try { await pool.query('select 1 as ok'); } catch (e: any) { console.error('DB check failed', e?.message ?? e); process.exit(2); }

  let ok = 0, bad = 0;
  for (const f of files) {
    try {
      const raw = JSON.parse(await fs.readFile(f, 'utf8'));
      const payload = raw.payload || raw;
      const meta = raw.meta || {};
      // Normalize into the expected shape before validation
      const src = {
        ...payload,
        facility_id: payload.facility_id ?? meta.facility_id,
        facility_name: payload.facility_name ?? meta.facility_name,
        address_street: payload.address_street ?? payload.address_line1,
      };
      const r = Payload.parse(src);

      // map to our columns
      const ms_con = cleanNum((r as any).med_surg_beds_oct1);
      const icu_con = cleanNum((r as any).icu_beds_oct1);
      const ped_con = cleanNum((r as any).peds_beds_oct1);
      const obgyn_con = cleanNum((r as any).obgyn_beds_oct1);
      const ms_adm = cleanNum((r as any).med_surg_admissions);
      const ms_days = cleanNum((r as any).med_surg_days_total);
      const ms_obs = cleanNum((r as any).med_surg_observation_days);
      const race_white = cleanNum((r as any).race_inp_white);
      const race_black = cleanNum((r as any).race_inp_black);
      const race_native_american = cleanNum((r as any).race_inp_ai_an);
      const race_asian = cleanNum((r as any).race_inp_asian);
      const race_pacific_islander = cleanNum((r as any).race_inp_nh_pi);
      const race_unknown = cleanNum((r as any).race_inp_unknown);
      const ethnicity_hispanic = cleanNum((r as any).eth_inp_hispanic);
      const ethnicity_non_hispanic = cleanNum((r as any).eth_inp_not_hispanic);
      const ethnicity_unknown = cleanNum((r as any).eth_inp_unknown);

      // facility upsert
      const name = r.name || 'Hospital';
      // Some Postgres drivers need explicit jsonb casting; to avoid type issues, omit address for now
      const addressJson = null; // r.address ? JSON.stringify(r.address) : null;
      await pool.query(
        `insert into facility (id,type,name,county,hsa,hpa,address,active)
         values ($1,'Hospital',$2,$3,$4,$5,$6,true)
         on conflict (id) do update set
           name=excluded.name,
           county=excluded.county,
           hsa=excluded.hsa,
           hpa=excluded.hpa,
           address=excluded.address,
           active=true`,
        [r.facility_id, name, r.county ?? null, r.hsa ?? null, r.hpa ?? null, addressJson]
      );

      // profile upsert (2024)
      await pool.query(
        `insert into hospital_profile_2024 (
           facility_id, year, hospital_type,
           ms_con, icu_con, ped_con, obgyn_con, ltc_con,
           ms_admissions, ms_patient_days, ms_observation_days,
           race_white, race_black, race_native_american, race_asian, race_pacific_islander, race_unknown,
           ethnicity_hispanic, ethnicity_non_hispanic, ethnicity_unknown,
           payer_medicare, payer_medicaid, payer_private, payer_other_public, payer_private_pay, payer_charity
         ) values (
           $1, 2024, $2,
           $3, $4, $5, $6, $7,
           $8, $9, $10,
           $11, $12, $13, $14, $15, $16,
           $17, $18, $19,
           $20, $21, $22, $23, $24, $25
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
           updated_at=now()`,
        [
          r.facility_id, r.hospital_type ?? null,
          ms_con, icu_con, ped_con, obgyn_con, null,
          ms_adm, ms_days, ms_obs,
          race_white, race_black, race_native_american, race_asian, race_pacific_islander, race_unknown,
          ethnicity_hispanic, ethnicity_non_hispanic, ethnicity_unknown,
          null, null, null, null, null, null,
        ]
      );

      // by-year upsert
      await pool.query(
        `insert into hospital_profile_by_year (
           facility_id, year, hospital_type,
           ms_con, icu_con, ped_con, obgyn_con, ltc_con,
           ms_admissions, ms_patient_days, ms_observation_days,
           race_white, race_black, race_native_american, race_asian, race_pacific_islander, race_unknown,
           ethnicity_hispanic, ethnicity_non_hispanic, ethnicity_unknown,
           payer_medicare, payer_medicaid, payer_private, payer_other_public, payer_private_pay, payer_charity
         ) values (
           $1, 2024, $2,
           $3, $4, $5, $6, $7,
           $8, $9, $10,
           $11, $12, $13, $14, $15, $16,
           $17, $18, $19,
           $20, $21, $22, $23, $24, $25
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
           updated_at=now()`,
        [
          r.facility_id, r.hospital_type ?? null,
          ms_con, icu_con, ped_con, obgyn_con, null,
          ms_adm, ms_days, ms_obs,
          race_white, race_black, race_native_american, race_asian, race_pacific_islander, race_unknown,
          ethnicity_hispanic, ethnicity_non_hispanic, ethnicity_unknown,
          null, null, null, null, null, null,
        ]
      );

      ok++;
    } catch (e: any) {
      bad++;
      console.error('FAIL', f, e?.message ?? String(e));
      try { console.error('DETAIL', JSON.stringify(e, Object.getOwnPropertyNames(e)).slice(0, 500)); } catch {}
    }
  }
  console.log(`Done. OK=${ok} BAD=${bad}`);
  try { await pool.end(); } catch {}
}

main().catch((e) => { console.error(e); process.exit(1); });
