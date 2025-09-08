import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

type Params = { params: { id: string } };

export async function GET(_req: Request, ctx: Params) {
  const id = ctx.params.id;
  try {
    const rows = await db.execute(sql`
      select bed_type, authorised_beds, effective_date, entered_at
      from bed_inventory
      where facility_id = ${id}
      order by bed_type, effective_date desc, entered_at desc
    `);
    return NextResponse.json(rows.rows ?? rows);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

