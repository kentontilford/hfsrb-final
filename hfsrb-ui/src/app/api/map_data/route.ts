import { NextResponse } from "next/server";
import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { facility, hospitalProfile2024 } from "@/db/schema";

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const x = sinDLat * sinDLat + sinDLng * sinDLng * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const hsa = searchParams.get("hsa") ?? undefined;
  const hpa = searchParams.get("hpa") ?? undefined;
  const originLat = searchParams.get("origin_lat");
  const originLng = searchParams.get("origin_lng");
  const maxKm = searchParams.get("max_distance_km");

  try {
    const conditions = [eq(facility.type, 'Hospital'), isNotNull(facility.lat), isNotNull(facility.lng)] as any[];
    if (hsa) conditions.push(eq(facility.hsa, hsa));
    if (hpa) conditions.push(eq(facility.hpa, hpa));

    const rows = await db
      .select({
        id: facility.id,
        name: facility.name,
        hsa: facility.hsa,
        hpa: facility.hpa,
        lat: facility.lat,
        lng: facility.lng,
        msCon: hospitalProfile2024.msCon,
        icuCon: hospitalProfile2024.icuCon,
      })
      .from(facility)
      .leftJoin(hospitalProfile2024, eq(hospitalProfile2024.facilityId, facility.id))
      .where(and(...conditions));

    let filtered = rows;
    if (originLat && originLng && maxKm) {
      const o = { lat: Number(originLat), lng: Number(originLng) };
      const max = Number(maxKm);
      filtered = rows.filter(r => {
        const lat = Number(r.lat);
        const lng = Number(r.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
        const d = haversineKm(o, { lat, lng });
        return d <= max;
      });
    }

    const features = filtered.map((r: any) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [Number(r.lng), Number(r.lat)] },
      properties: {
        id: r.id,
        name: r.name,
        hsa: r.hsa,
        hpa: r.hpa,
        msCon: r.msCon,
        icuCon: r.icuCon,
      },
    }));

    return NextResponse.json({ type: "FeatureCollection", features });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

