import { NextResponse } from "next/server";
import { chromium } from "playwright";

export async function GET(req: Request, ctx: { params: { hsa: string } }) {
  const { origin } = new URL(req.url);
  const url = `${origin}/hsa/${encodeURIComponent(ctx.params.hsa)}/profile`;
  try {
    const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle" });
    const pdf = await page.pdf({ format: "Letter", printBackground: true, margin: { top: "0.5in", bottom: "0.5in", left: "0.5in", right: "0.5in" } });
    await browser.close();
    return new NextResponse(pdf, { status: 200, headers: new Headers({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename=hsa_${ctx.params.hsa}.pdf` }) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

