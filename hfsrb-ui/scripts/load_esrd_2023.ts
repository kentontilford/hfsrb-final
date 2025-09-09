#!/usr/bin/env -S node --enable-source-maps
import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";
import { Pool } from "pg";

// Minimal validation of normalized row after mapping
const Row = z.object({
  facility_id: z.string().min(2),
  name: z.string().min(1),
  stations: z.number().nullable().optional(),
  shifts: z.number().nullable().optional(),
  patients_total: z.number().nullable().optional(),
  incenter_treatments: z.number().nullable().optional(),
  fte_total: z.number().nullable().optional(),
  payer_medicare: z.number().nullable().optional(),
  payer_medicaid: z.number().nullable().optional(),
  payer_private: z.number().nullable().optional(),
  revenue_total: z.number().nullable().optional(),
  race_white: z.number().nullable().optional(),
  race_black: z.number().nullable().optional(),
  race_asian: z.number().nullable().optional(),
  race_hispanic: z.number().nullable().optional(),
});

function clean(v: unknown) {
  if (v === "" || v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const num = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(num) ? num : null;
}

async function listFiles(dir: string, out: string[] = []) {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await listFiles(p, out);
    else if (e.isFile() && e.name === "schema_payload.json") out.push(p);
  }
  return out;
}

async function main() {
  // Folder layout: /home/kenton/hfsrb-final/data/2023/ESRD/**/schema_payload.json
  const ROOT = path.resolve(__dirname, "..", "..");
  const DATA_DIR = path.join(ROOT, "data", "2023", "ESRD");

  // Quick existence check
  await fs.access(DATA_DIR).catch(() => {
    console.error(`Missing data dir: ${DATA_DIR}`);
    process.exit(2);
  });

  const files = await listFiles(DATA_DIR);
  console.log(`Found ${files.length} ESRD schema files`);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try { await pool.query('select 1'); } catch (e: any) { console.error('DB check failed', e?.message ?? e); process.exit(2); }

  let ok = 0, bad = 0;
  for (const f of files) {
    try {
      const raw = await fs.readFile(f, "utf8");
      const j = JSON.parse(raw);
      const meta = j.meta || {};
      const p = j.payload || j;
      const facility_id: string = p.facility_id ?? meta.facility_id;
      const name: string = (p.facility_name ?? meta.facility_name ?? "").toString();
      const shifts = [p.shifts_mon, p.shifts_tue, p.shifts_wed, p.shifts_thu, p.shifts_fri, p.shifts_sat, p.shifts_sun]
        .map(clean).filter((v)=>v!==null) as number[];
      const norm = Row.parse({
        facility_id,
        name,
        stations: clean(p.stations_oct_setup_staffed),
        shifts: shifts.length ? shifts.reduce((a,b)=>a+(b||0), 0) : null,
        patients_total: clean(p.patients_unduplicated),
        incenter_treatments: clean(p.treatments_incenter_2023),
        fte_total: clean(p.fte_total),
        payer_medicare: clean(p.pat_medicare),
        payer_medicaid: clean(p.pat_medicaid),
        payer_private: clean(p.pat_private_insurance),
        revenue_total: clean(p.rev_total),
        race_white: clean(p.race_white),
        race_black: clean(p.race_black),
        race_asian: clean(p.race_asian),
        race_hispanic: clean(p.eth_hispanic),
      });

      // facility upsert (omit address to avoid jsonb casting issues)
      await pool.query(
        `insert into facility (id,type,name,county,hsa,hpa,address,active)
         values ($1,'ESRD',$2,$3,$4,$5,$6,true)
         on conflict (id) do update set
           name=excluded.name,
           county=excluded.county,
           hsa=excluded.hsa,
           hpa=excluded.hpa,
           address=excluded.address,
           active=true`,
        [norm.facility_id, norm.name, null, null, null, null]
      );

      // survey upsert
      await pool.query(
        `insert into survey_esrd_2023 (
           facility_id, year, stations, shifts, patients_total, incenter_treatments, fte_total,
           payer_medicare, payer_medicaid, payer_private, revenue_total,
           race_white, race_black, race_asian, race_hispanic
         ) values (
           $1, 2023, $2, $3, $4, $5, $6,
           $7, $8, $9, $10,
           $11, $12, $13, $14
         )
         on conflict (facility_id, year) do update set
           stations=excluded.stations,
           shifts=excluded.shifts,
           patients_total=excluded.patients_total,
           incenter_treatments=excluded.incenter_treatments,
           fte_total=excluded.fte_total,
           payer_medicare=excluded.payer_medicare,
           payer_medicaid=excluded.payer_medicaid,
           payer_private=excluded.payer_private,
           revenue_total=excluded.revenue_total,
           race_white=excluded.race_white,
           race_black=excluded.race_black,
           race_asian=excluded.race_asian,
           race_hispanic=excluded.race_hispanic,
           updated_at=now()`,
        [
          norm.facility_id, norm.stations ?? null, norm.shifts ?? null, norm.patients_total ?? null,
          norm.incenter_treatments ?? null, norm.fte_total ?? null,
          norm.payer_medicare ?? null, norm.payer_medicaid ?? null, norm.payer_private ?? null, norm.revenue_total ?? null,
          norm.race_white ?? null, norm.race_black ?? null, norm.race_asian ?? null, norm.race_hispanic ?? null,
        ]
      );

      ok++;
    } catch (e: any) {
      bad++;
      console.error("FAIL", f, e.message ?? e);
    }
  }
  console.log(`Done. OK=${ok} BAD=${bad}`);
  try { await pool.end(); } catch {}
}

main().catch(e => { console.error(e); process.exit(1); });
