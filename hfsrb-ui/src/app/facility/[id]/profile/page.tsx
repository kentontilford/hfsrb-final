import Link from "next/link";
import { headers } from "next/headers";

async function getFacility(id: string) {
  const hdrs = headers();
  const host = hdrs.get('x-forwarded-host') || hdrs.get('host') || 'localhost:3000';
  const proto = hdrs.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const base = process.env.NEXT_PUBLIC_BASE_URL || `${proto}://${host}`;
  const res = await fetch(`${base}/api/facilities/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load facility");
  return res.json();
}

export default async function FacilityProfilePage({ params, searchParams }: { params: { id: string }, searchParams: { [k: string]: string | string[] | undefined } }) {
  const f = await getFacility(params.id);
  const print = searchParams.print === '1' || searchParams.print === 'true';
  return (
    <html>
      <head>
        <title>{f.name} – Facility Profile</title>
        <style>{`
          @page { size: Letter; margin: 0.75in; }
          body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }
          .section { margin-bottom: 16px; }
          .title { font-weight: 700; font-size: 18px; margin-bottom: 8px; }
          .kv { display: grid; grid-template-columns: 1fr 2fr; gap: 6px 12px; font-size: 12px; }
          .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          .muted { color: #6b7280; }
          .heading { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
          .subheading { color: #374151; }
          .btn { display: inline-block; background: #2563eb; color: white; padding: 8px 12px; border-radius: 6px; text-decoration: none; }
          @media print { .noprint { display: none; } }
        `}</style>
      </head>
      <body>
        <div className="page">
          <header className="section">
            <div className="heading">{f.name}</div>
            <div className="muted subheading">Facility Profile (2024)</div>
          </header>
          <div className="section">
            <div className="grid">
              <div className="card">
                <div className="title">Ownership, Management, and General</div>
                <div className="kv">
                  <div>Facility ID</div><div>{f.id}</div>
                  <div>Type</div><div>{f.hospitalType ?? ''}</div>
                  <div>County</div><div>{f.county ?? ''}</div>
                  <div>HSA / HPA</div><div>{f.hsa ?? ''} / {f.hpa ?? ''}</div>
                </div>
              </div>
              <div className="card">
                <div className="title">Authorized Beds</div>
                <div className="kv">
                  <div>MS-CON</div><div>{f.msCon ?? '-'}</div>
                  <div>ICU-CON</div><div>{f.icuCon ?? '-'}</div>
                  <div>PED-CON</div><div>{f.pedCon ?? '-'}</div>
                  <div>OBGYN-CON</div><div>{f.obgynCon ?? '-'}</div>
                  <div>LTC-CON</div><div>{f.ltcCon ?? '-'}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="section">
            <div className="card">
              <div className="title">Utilization (Medical/Surgical)</div>
              <div className="kv">
                <div>Admissions</div><div>{f.msAdmissions ?? '-'}</div>
                <div>Patient Days</div><div>{f.msPatientDays ?? '-'}</div>
                <div>Observation Days</div><div>{f.msObservationDays ?? '-'}</div>
                <div>Avg Daily Census</div><div>{f.msPatientDays ? (f.msPatientDays / 365).toFixed(1) : '-'}</div>
                <div>Occupancy Rate</div><div>{(f.msPatientDays && f.msCon) ? `${Math.round(((f.msPatientDays/365)/f.msCon)*100)}%` : '-'}</div>
              </div>
            </div>
          </div>
          {!print && (
            <div className="section noprint" style={{ display: 'flex', gap: 12 }}>
              <Link className="btn" href={`/api/facilities/${encodeURIComponent(f.id)}/profile?format=pdf`}>Download PDF</Link>
              <a className="btn" href="#" onClick={(e) => { e.preventDefault(); window.print(); }}>Print</a>
            </div>
          )}
        </div>
      </body>
    </html>
  );
}
