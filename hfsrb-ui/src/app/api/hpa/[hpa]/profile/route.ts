import { NextResponse } from "next/server";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
export const runtime = 'nodejs';

export async function GET(req: Request, ctx: { params: { hpa: string } }) {
  const { origin } = new URL(req.url);
  const url = `${origin}/hpa/${encodeURIComponent(ctx.params.hpa)}/profile`;
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
    const u8 = pdf instanceof Uint8Array ? pdf : new Uint8Array(pdf as any);
    const ab = u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
    return new NextResponse(ab as any, { status: 200, headers: new Headers({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename=hpa_${ctx.params.hpa}.pdf` }) });
  } catch (e: any) {
    console.error(`/api/hpa/${ctx.params.hpa}/profile error:`, e);
    return NextResponse.json({ error: e.message ?? String(e), stack: e?.stack }, { status: 500 });
  }
}
