import { NextResponse } from "next/server";
import { and, desc, eq, ilike, like, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { facility, hospitalProfile2024 } from "@/db/schema";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const hsa = searchParams.get("hsa") ?? undefined;
  const hpa = searchParams.get("hpa") ?? undefined;
  const type = searchParams.get("hospital_type") ?? undefined;
  const q = searchParams.get("q") ?? undefined;

  try {
    const conditions = [eq(facility.type, 'Hospital')] as any[];
    if (hsa) conditions.push(eq(facility.hsa, hsa));
    if (hpa) conditions.push(eq(facility.hpa, hpa));
    if (type) conditions.push(eq(hospitalProfile2024.hospitalType, type));
    if (q) conditions.push(ilike(facility.name, `%${q}%`));

    const rows = await db
      .select({
        id: facility.id,
        name: facility.name,
        hsa: facility.hsa,
        hpa: facility.hpa,
        hospitalType: hospitalProfile2024.hospitalType,
      })
      .from(facility)
      .leftJoin(hospitalProfile2024, eq(hospitalProfile2024.facilityId, facility.id))
      .where(and(...conditions))
      .orderBy(facility.name);

    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}
