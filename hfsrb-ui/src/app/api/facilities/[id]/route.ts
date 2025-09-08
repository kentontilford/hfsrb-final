import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { facility, hospitalProfileByYear, hospitalProfile2024 } from "@/db/schema";

type Params = { params: { id: string } };

export async function GET(req: Request, ctx: Params) {
  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year") ?? 2024);
  const id = ctx.params.id;
  try {
    const rows = await db
      .select({
        id: facility.id,
        name: facility.name,
        county: facility.county,
        hsa: facility.hsa,
        hpa: facility.hpa,
        address: facility.address,
        hospitalType: hospitalProfileByYear.hospitalType,
        msCon: hospitalProfileByYear.msCon,
        icuCon: hospitalProfileByYear.icuCon,
        pedCon: hospitalProfileByYear.pedCon,
        obgynCon: hospitalProfileByYear.obgynCon,
        ltcCon: hospitalProfileByYear.ltcCon,
        msAdmissions: hospitalProfileByYear.msAdmissions,
        msPatientDays: hospitalProfileByYear.msPatientDays,
        msObservationDays: hospitalProfileByYear.msObservationDays,
        raceWhite: hospitalProfileByYear.raceWhite,
        raceBlack: hospitalProfileByYear.raceBlack,
        raceNativeAmerican: hospitalProfileByYear.raceNativeAmerican,
        raceAsian: hospitalProfileByYear.raceAsian,
        racePacificIslander: hospitalProfileByYear.racePacificIslander,
        raceUnknown: hospitalProfileByYear.raceUnknown,
        ethnicityHispanic: hospitalProfileByYear.ethnicityHispanic,
        ethnicityNonHispanic: hospitalProfileByYear.ethnicityNonHispanic,
        ethnicityUnknown: hospitalProfileByYear.ethnicityUnknown,
      })
      .from(facility)
      .leftJoin(hospitalProfileByYear, and(eq(hospitalProfileByYear.facilityId, facility.id), eq(hospitalProfileByYear.year, year)))
      .where(eq(facility.id, id))
      .limit(1);

    let row = rows[0];
    // Fallback to legacy 2024 join if unified is missing
    if (!row || (!row.hospitalType && !row.msCon)) {
      const legacy = await db
        .select({
          id: facility.id,
          name: facility.name,
          county: facility.county,
          hsa: facility.hsa,
          hpa: facility.hpa,
          address: facility.address,
          hospitalType: hospitalProfile2024.hospitalType,
          msCon: hospitalProfile2024.msCon,
          icuCon: hospitalProfile2024.icuCon,
          pedCon: hospitalProfile2024.pedCon,
          obgynCon: hospitalProfile2024.obgynCon,
          ltcCon: hospitalProfile2024.ltcCon,
          msAdmissions: hospitalProfile2024.msAdmissions,
          msPatientDays: hospitalProfile2024.msPatientDays,
          msObservationDays: hospitalProfile2024.msObservationDays,
          raceWhite: hospitalProfile2024.raceWhite,
          raceBlack: hospitalProfile2024.raceBlack,
          raceNativeAmerican: hospitalProfile2024.raceNativeAmerican,
          raceAsian: hospitalProfile2024.raceAsian,
          racePacificIslander: hospitalProfile2024.racePacificIslander,
          raceUnknown: hospitalProfile2024.raceUnknown,
          ethnicityHispanic: hospitalProfile2024.ethnicityHispanic,
          ethnicityNonHispanic: hospitalProfile2024.ethnicityNonHispanic,
          ethnicityUnknown: hospitalProfile2024.ethnicityUnknown,
        })
        .from(facility)
        .leftJoin(hospitalProfile2024, eq(hospitalProfile2024.facilityId, facility.id))
        .where(eq(facility.id, id))
        .limit(1);
      row = legacy[0];
    }
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}
