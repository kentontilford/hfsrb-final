#!/usr/bin/env -S node --enable-source-maps
import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";
import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

/** Adjust only if your JSON shape differs */
const Payload = z.object({
  facility_id: z.string().min(3),
  type: z.literal("ESRD"),
  name: z.string().min(1),
  county: z.string().optional().nullable(),
  hsa: z.string().optional().nullable(),
  hpa: z.string().optional().nullable(),
  address: z.any().optional().nullable(),
  stations: z.coerce.number().int().nonnegative().nullable().optional(),
  shifts: z.coerce.number().int().nonnegative().nullable().optional(),
  patients_total: z.coerce.number().int().nonnegative().nullable().optional(),
  incenter_treatments: z.coerce.number().int().nonnegative().nullable().optional(),
  fte_total: z.coerce.number().nullable().optional(),
  payer_medicare: z.coerce.number().nullable().optional(),
  payer_medicaid: z.coerce.number().nullable().optional(),
  payer_private: z.coerce.number().nullable().optional(),
  revenue_total: z.coerce.number().nullable().optional(),
  race_white: z.coerce.number().nullable().optional(),
  race_black: z.coerce.number().nullable().optional(),
  race_asian: z.coerce.number().nullable().optional(),
  race_hispanic: z.coerce.number().nullable().optional(),
}).strict();

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

  let ok = 0, bad = 0;
  for (const f of files) {
    try {
      const raw = await fs.readFile(f, "utf8");
      const j = JSON.parse(raw);
      const r = Payload.parse(j.payload ?? j);

      // facility upsert
      await db.execute(sql`
        insert into facility (id,type,name,county,hsa,hpa,address,active)
        values (${r.facility_id}, 'ESRD', ${r.name.trim()}, ${r.county ?? null}, ${r.hsa ?? null}, ${r.hpa ?? null}, ${r.address ?? null}, true)
        on conflict (id) do update
        set name=excluded.name, county=excluded.county, hsa=excluded.hsa, hpa=excluded.hpa, address=excluded.address, active=true
      `);

      // survey upsert
      await db.execute(sql`
        insert into survey_esrd_2023 (
          facility_id, year, stations, shifts, patients_total, incenter_treatments, fte_total,
          payer_medicare, payer_medicaid, payer_private, revenue_total,
          race_white, race_black, race_asian, race_hispanic
        ) values (
          ${r.facility_id}, 2023, ${clean(r.stations)}, ${clean(r.shifts)}, ${clean(r.patients_total)}, ${clean(r.incenter_treatments)}, ${clean(r.fte_total)},
          ${clean(r.payer_medicare)}, ${clean(r.payer_medicaid)}, ${clean(r.payer_private)}, ${clean(r.revenue_total)},
          ${clean(r.race_white)}, ${clean(r.race_black)}, ${clean(r.race_asian)}, ${clean(r.race_hispanic)}
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
          updated_at=now()
      `);

      ok++;
    } catch (e: any) {
      bad++;
      console.error("FAIL", f, e.message ?? e);
    }
  }
  console.log(`Done. OK=${ok} BAD=${bad}`);
}

main().catch(e => { console.error(e); process.exit(1); });
