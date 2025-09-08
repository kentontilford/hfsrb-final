import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { requireUser } from "@/lib/auth";

type Params = { params: { id: string } };

// Latest authorized beds per bed_type for a facility
export async function GET(_req: Request, ctx: Params) {
  const id = ctx.params.id;
  try {
    const rows = await db.execute(sql`
      select distinct on (bed_type) bed_type, authorised_beds, effective_date, entered_at
      from bed_inventory
      where facility_id = ${id}
      order by bed_type, effective_date desc, entered_at desc
    `);
    return NextResponse.json(rows.rows ?? rows);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

const BedPayload = z.object({
  bed_type: z.string().min(2),
  authorised_beds: z.coerce.number().int().nonnegative(),
  effective_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).strict();

export async function POST(req: Request, ctx: Params) {
  const id = ctx.params.id;
  try {
    const user = await requireUser(req);
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const body = await req.json();
    const data = BedPayload.parse(body);
    const today = new Date();
    const eff = new Date(data.effective_date + 'T00:00:00Z');
    if (eff.getTime() > today.getTime() + 24*3600*1000) {
      return NextResponse.json({ error: "effective_date cannot be in the future" }, { status: 400 });
    }
    await db.execute(sql`
      insert into bed_inventory (facility_id, bed_type, authorised_beds, effective_date)
      values (${id}, ${data.bed_type}, ${data.authorised_beds}, ${data.effective_date})
    `);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const msg = e?.issues ? JSON.stringify(e.issues) : (e.message ?? String(e));
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
