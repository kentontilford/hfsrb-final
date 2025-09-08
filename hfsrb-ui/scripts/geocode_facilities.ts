#!/usr/bin/env -S node --enable-source-maps
import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

const UA = process.env.GEOCODER_USER_AGENT || "hfsrb-ui/0.1 (IL Hospital Profiles)";
const EMAIL = process.env.GEOCODER_EMAIL || ""; // optional for Nominatim
const RATE_MS = Number(process.env.GEOCODER_RATE_MS || 1200); // min 1.2s per request
const LIMIT = Number(process.env.GEOCODER_LIMIT || 200);

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  // Select facilities missing lat/lng
  const res = await db.execute(sql`
    select id, name, county, address
    from facility
    where type = 'Hospital' and (lat is null or lng is null)
    order by id
    limit ${LIMIT}
  `);
  const rows = (res as any).rows ?? res;
  console.log(`To geocode: ${rows.length}`);

  let ok = 0, bad = 0;
  for (const r of rows) {
    try {
      const addr = r.address ?? null;
      const street = addr?.street ?? "";
      const city = addr?.city ?? "";
      const zip = addr?.zip ?? "";
      const q = [r.name, street, city, zip, "Illinois"].filter(Boolean).join(", ");
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("limit", "1");
      url.searchParams.set("q", q);
      if (EMAIL) url.searchParams.set("email", EMAIL);

      const resp = await fetch(url.toString(), {
        headers: { "User-Agent": UA },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data: any[] = await resp.json();
      const hit = data[0];
      if (!hit) { console.warn("No result for", r.id, q); bad++; await sleep(RATE_MS); continue; }
      const lat = Number(hit.lat);
      const lon = Number(hit.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) { bad++; await sleep(RATE_MS); continue; }
      await db.execute(sql`update facility set lat=${lat}, lng=${lon} where id=${r.id}`);
      ok++;
      await sleep(RATE_MS);
    } catch (e: any) {
      bad++;
      console.error("FAIL", r.id, e.message ?? e);
      await sleep(RATE_MS);
    }
  }
  console.log(`Geocoding done. OK=${ok} BAD=${bad}`);
}

main().catch(e => { console.error(e); process.exit(1); });

