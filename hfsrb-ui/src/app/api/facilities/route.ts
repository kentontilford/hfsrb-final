import { NextResponse } from "next/server";
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { and, eq, ilike } from "drizzle-orm";
import { db } from "@/lib/db";
import { facility, hospitalProfileByYear } from "@/db/schema";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const hsa = searchParams.get("hsa") ?? undefined;
  const hpa = searchParams.get("hpa") ?? undefined;
  const type = searchParams.get("hospital_type") ?? undefined;
  const q = searchParams.get("q") ?? undefined;
  const year = Number(searchParams.get("year") ?? 2024);

  try {
    const conditions = [eq(facility.type, 'Hospital')] as any[];
    if (hsa) conditions.push(eq(facility.hsa, hsa));
    if (hpa) conditions.push(eq(facility.hpa, hpa));
    if (type) conditions.push(eq(hospitalProfileByYear.hospitalType, type));
    if (q) conditions.push(ilike(facility.name, `%${q}%`));

    const rows = await db
      .select({
        id: facility.id,
        name: facility.name,
        hsa: facility.hsa,
        hpa: facility.hpa,
        hospitalType: hospitalProfileByYear.hospitalType,
      })
      .from(facility)
      .leftJoin(hospitalProfileByYear, and(eq(hospitalProfileByYear.facilityId, facility.id), eq(hospitalProfileByYear.year, year)))
      .where(and(...conditions))
      .orderBy(facility.name);

    return NextResponse.json(rows);
  } catch (e: any) {
    console.error("/api/facilities error:", e);
    return NextResponse.json({ error: e.message ?? String(e), stack: e?.stack }, { status: 500 });
  }
}
