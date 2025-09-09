import { NextResponse } from "next/server";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
export const runtime = 'nodejs';

type Params = { params: { id: string } };

export async function GET(req: Request, ctx: Params) {
  const { searchParams, origin } = new URL(req.url);
  const fmt = (searchParams.get("format") || "pdf").toLowerCase();
  if (fmt !== "pdf") {
    return NextResponse.json({ error: "Only format=pdf is supported" }, { status: 400 });
  }
  const base = origin;
  const url = `${base}/facility/${encodeURIComponent(ctx.params.id)}/profile?print=1`;
  try {
    const executablePath = await chromium.executablePath();
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      headless: true,
      executablePath,
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({ format: "Letter", printBackground: true, margin: { top: "0.5in", bottom: "0.5in", left: "0.5in", right: "0.5in" } });
    await browser.close();
    // Normalize Buffer -> ArrayBuffer for web Response types
    const u8 = pdf instanceof Uint8Array ? pdf : new Uint8Array(pdf as any);
    const ab = u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
    return new NextResponse(ab as any, {
      status: 200,
      headers: new Headers({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=facility_${ctx.params.id}.pdf`
      })
    });
  } catch (e: any) {
    console.error(`/api/facilities/${ctx.params.id}/profile error:`, e);
    return NextResponse.json({ error: e.message ?? String(e), stack: e?.stack }, { status: 500 });
  }
}
