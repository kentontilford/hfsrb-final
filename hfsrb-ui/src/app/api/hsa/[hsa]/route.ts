import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { hsaSummary2024 } from "@/db/schema";

type Params = { params: { hsa: string } };

export async function GET(_req: Request, ctx: Params) {
  const code = ctx.params.hsa;
  try {
    const rows = await db.select().from(hsaSummary2024).where(eq(hsaSummary2024.hsa, code)).limit(1);
    const row = rows[0];
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

