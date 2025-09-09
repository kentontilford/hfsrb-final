import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const ping = await db.execute(sql`select 1 as ok`);
    const cnt = await db.execute(sql`select count(*)::int as n from facility`);
    return NextResponse.json({ ok: true, ping: (ping as any)?.rows?.[0]?.ok ?? 1, facilities: (cnt as any)?.rows?.[0]?.n ?? 0 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}

