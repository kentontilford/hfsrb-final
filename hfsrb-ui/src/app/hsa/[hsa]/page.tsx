type Props = { params: { hsa: string } };

import { headers } from "next/headers";

async function getSummary(hsa: string, year?: string) {
  const qs = new URLSearchParams(); if (year) qs.set('year', year);
  const hdrs = headers();
  const host = hdrs.get('x-forwarded-host') || hdrs.get('host') || 'localhost:3000';
  const proto = hdrs.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const base = process.env.NEXT_PUBLIC_BASE_URL || `${proto}://${host}`;
  const res = await fetch(`${base}/api/hsa/${encodeURIComponent(hsa)}?${qs.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load HSA summary");
  return res.json();
}

import dynamic from "next/dynamic";
const AuthorizedBedsChart = dynamic(() => import("@/components/summary/AuthorizedBedsChart"), { ssr: false });
const OccupancyGauge = dynamic(() => import("@/components/summary/OccupancyGauge"), { ssr: false });
const RaceChart = dynamic(() => import("@/components/summary/RaceChart"), { ssr: false });
const EthnicityChart = dynamic(() => import("@/components/summary/EthnicityChart"), { ssr: false });
const PayerChart = dynamic(() => import("@/components/summary/PayerChart"), { ssr: false });

export default async function HSAPage({ params, searchParams }: { params: { hsa: string }, searchParams?: { year?: string } }) {
  const year = searchParams?.year || '2024';
  const s = await getSummary(params.hsa, year);
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">HSA {params.hsa} Summary (2024)</h1>
      <form method="get" className="flex gap-2 items-center">
        <label className="text-sm">Year
          <input name="year" className="border rounded px-2 py-1 ml-2 w-24" defaultValue={year} />
        </label>
        <button className="bg-blue-600 text-white px-3 py-1 rounded">Apply</button>
      </form>
      <div>
        <a className="inline-block bg-blue-600 text-white px-3 py-1 rounded" href={`/api/hsa/${encodeURIComponent(params.hsa)}/profile`}>Download PDF</a>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <section className="border rounded p-3">
          <h2 className="font-semibold mb-2">Facility Counts</h2>
          <div>Total Hospitals: {s.totalHospitals ?? ""}</div>
          <div>Critical Access: {s.criticalAccess ?? ""}</div>
          <div>General: {s.general ?? ""}</div>
          <div>Psychiatric: {s.psychiatric ?? ""}</div>
          <div>Rehabilitation: {s.rehabilitation ?? ""}</div>
          <div>Children's: {s.childrens ?? ""}</div>
        </section>
        <section className="border rounded p-3">
          <h2 className="font-semibold mb-2">Authorized Beds</h2>
          <AuthorizedBedsChart s={s} />
          <div className="mt-4"><OccupancyGauge s={s} /></div>
        </section>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <section className="border rounded p-3">
          <RaceChart s={s} />
        </section>
        <section className="border rounded p-3">
          <EthnicityChart s={s} />
        </section>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <section className="border rounded p-3">
          <PayerChart s={s} title="Payer Mix (HSA %)" />
        </section>
      </div>
    </div>
  );
}
