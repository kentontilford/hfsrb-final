import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { hsaSummaryByYear, hsaSummary2024 } from "@/db/schema";

type Params = { params: { hsa: string } };

export async function GET(req: Request, ctx: Params) {
  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year") ?? 2024);
  const code = ctx.params.hsa;
  try {
    // Prefer unified table by year
    const byYear = await db.select().from(hsaSummaryByYear).where(and(eq(hsaSummaryByYear.hsa, code), eq(hsaSummaryByYear.year, year))).limit(1);
    if (byYear[0]) return NextResponse.json(byYear[0]);
    // Fallback to legacy 2024 table
    const rows = await db.select().from(hsaSummary2024).where(eq(hsaSummary2024.hsa, code)).limit(1);
    const row = rows[0];
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}
