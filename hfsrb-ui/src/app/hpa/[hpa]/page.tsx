type Props = { params: { hpa: string } };

async function getSummary(hpa: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/hpa/${encodeURIComponent(hpa)}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load HPA summary");
  return res.json();
}

import dynamic from "next/dynamic";
const AuthorizedBedsChart = dynamic(() => import("@/components/summary/AuthorizedBedsChart"), { ssr: false });
const OccupancyGauge = dynamic(() => import("@/components/summary/OccupancyGauge"), { ssr: false });
const RaceChart = dynamic(() => import("@/components/summary/RaceChart"), { ssr: false });
const EthnicityChart = dynamic(() => import("@/components/summary/EthnicityChart"), { ssr: false });

export default async function HPAPage({ params }: Props) {
  const s = await getSummary(params.hpa);
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">HPA {params.hpa} Summary (2024)</h1>
      <div>
        <a className="inline-block bg-blue-600 text-white px-3 py-1 rounded" href={`/api/hpa/${encodeURIComponent(params.hpa)}/profile`}>Download PDF</a>
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
    </div>
  );
}
