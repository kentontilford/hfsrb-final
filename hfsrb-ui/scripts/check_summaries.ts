#!/usr/bin/env -S node --enable-source-maps
import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  const hsa1 = await db.execute(sql`select * from hsa_summary_2024 where hsa='1'`);
  const sample = (hsa1 as any).rows?.[0] ?? (hsa1 as any)[0];
  console.log("HSA 1:", sample || "(none)");
  const counts = await db.execute(sql`select count(*) as facilities from facility where type='Hospital'`);
  console.log("Facilities (Hospital):", (counts as any).rows?.[0]?.facilities ?? (counts as any)[0]?.facilities);
}

main().catch(e => { console.error(e); process.exit(1); });

