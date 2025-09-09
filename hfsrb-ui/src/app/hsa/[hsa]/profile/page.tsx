import { headers } from "next/headers";

async function getSummary(hsa: string) {
  const hdrs = headers();
  const host = hdrs.get('x-forwarded-host') || hdrs.get('host') || 'localhost:3000';
  const proto = hdrs.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const base = process.env.NEXT_PUBLIC_BASE_URL || `${proto}://${host}`;
  const res = await fetch(`${base}/api/hsa/${encodeURIComponent(hsa)}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load HSA summary");
  return res.json();
}

export default async function HSAPrint({ params }: { params: { hsa: string } }) {
  const s = await getSummary(params.hsa);
  return (
    <html><head><title>HSA {params.hsa} – Summary</title>
      <style>{`
        @page { size: Letter; margin: 0.75in; }
        body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }
        .title { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
        .kv { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; font-size: 12px; }
      `}</style>
    </head><body>
      <div className="page">
        <div className="title">HSA {params.hsa} Summary (2024)</div>
        <div className="grid">
          <div className="card">
            <div className="kv">
              <div>Total Hospitals</div><div>{s.totalHospitals ?? '-'}</div>
              <div>Critical Access</div><div>{s.criticalAccess ?? '-'}</div>
              <div>General</div><div>{s.general ?? '-'}</div>
              <div>Psychiatric</div><div>{s.psychiatric ?? '-'}</div>
              <div>Rehabilitation</div><div>{s.rehabilitation ?? '-'}</div>
              <div>Children's</div><div>{s.childrens ?? '-'}</div>
            </div>
          </div>
          <div className="card">
            <div className="kv">
              <div>MS-CON</div><div>{s.msCon ?? '-'}</div>
              <div>ICU-CON</div><div>{s.icuCon ?? '-'}</div>
              <div>PED-CON</div><div>{s.pedCon ?? '-'}</div>
              <div>OBGYN-CON</div><div>{s.obgynCon ?? '-'}</div>
              <div>LTC-CON</div><div>{s.ltcCon ?? '-'}</div>
            </div>
          </div>
        </div>
      </div>
    </body></html>
  );
}
