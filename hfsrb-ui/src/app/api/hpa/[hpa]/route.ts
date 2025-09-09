import { NextResponse } from "next/server";
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { hpaSummaryByYear, hpaSummary2024 } from "@/db/schema";

type Params = { params: { hpa: string } };

export async function GET(req: Request, ctx: Params) {
  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year") ?? 2024);
  const code = ctx.params.hpa;
  try {
    const byYear = await db.select().from(hpaSummaryByYear).where(and(eq(hpaSummaryByYear.hpa, code), eq(hpaSummaryByYear.year, year))).limit(1);
    if (byYear[0]) return NextResponse.json(byYear[0]);
    const rows = await db.select().from(hpaSummary2024).where(eq(hpaSummary2024.hpa, code)).limit(1);
    const row = rows[0];
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (e: any) {
    console.error(`/api/hpa/${ctx.params.hpa} error:`, e);
    return NextResponse.json({ error: e.message ?? String(e), stack: e?.stack }, { status: 500 });
  }
}
