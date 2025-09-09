import { headers } from "next/headers";
import dynamic from "next/dynamic";
type Props = { params: { id: string }, searchParams?: { year?: string } };

async function getFacility(id: string, year?: string) {
  const qs = new URLSearchParams(); if (year) qs.set('year', year);
  const hdrs = headers();
  const host = hdrs.get('x-forwarded-host') || hdrs.get('host') || 'localhost:3000';
  const proto = hdrs.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const base = process.env.NEXT_PUBLIC_BASE_URL || `${proto}://${host}`;
  const res = await fetch(`${base}/api/facilities/${encodeURIComponent(id)}?${qs.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load facility");
  return res.json();
}

export default async function FacilityDetail({ params, searchParams }: Props) {
  const year = searchParams?.year || '2024';
  const f = await getFacility(params.id, year);
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">{f.name}</h1>
      <form method="get" className="flex gap-2 items-center">
        <label className="text-sm">Year
          <input name="year" className="border rounded px-2 py-1 ml-2 w-24" defaultValue={year} />
        </label>
        <button className="bg-blue-600 text-white px-3 py-1 rounded">Apply</button>
      </form>
      <div>
        <a className="inline-block bg-blue-600 text-white px-3 py-1 rounded" href={`/facility/${encodeURIComponent(f.id)}/profile`}>Print View</a>
        <a className="inline-block bg-blue-600 text-white px-3 py-1 rounded ml-2" href={`/api/facilities/${encodeURIComponent(f.id)}/profile?format=pdf`}>Download PDF</a>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <section className="border rounded p-3">
          <h2 className="font-semibold mb-2">General</h2>
          <div>Facility ID: {f.id}</div>
          <div>County: {f.county ?? ""}</div>
          <div>HSA: {f.hsa ?? ""}</div>
          <div>HPA: {f.hpa ?? ""}</div>
          <div>Type: {f.hospitalType ?? ""}</div>
        </section>
        <section className="border rounded p-3">
          <h2 className="font-semibold mb-2">Authorized Beds</h2>
          <div>MS-CON: {f.msCon ?? ""}</div>
          <div>ICU-CON: {f.icuCon ?? ""}</div>
          <div>PED-CON: {f.pedCon ?? ""}</div>
          <div>OBGYN-CON: {f.obgynCon ?? ""}</div>
          <div>LTC-CON: {f.ltcCon ?? ""}</div>
        </section>
      </div>
      <section className="border rounded p-3">
        <h2 className="font-semibold mb-2">Utilization</h2>
        <div>MS Admissions: {f.msAdmissions ?? ""}</div>
        <div>MS Patient Days: {f.msPatientDays ?? ""}</div>
        <div>MS Observation Days: {f.msObservationDays ?? ""}</div>
      </section>
      <section className="border rounded p-3">
        <h2 className="font-semibold mb-2">Payer Mix</h2>
        { dynamic(() => import("@/components/summary/PayerChart"), { ssr: false })({ s: f }) }
      </section>
      <section className="border rounded p-3">
        { dynamic(() => import("@/components/facility/BedInventory"), { ssr: false })({ facilityId: params.id }) }
      </section>
    </div>
  );
}
