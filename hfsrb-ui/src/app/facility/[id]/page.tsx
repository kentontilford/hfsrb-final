type Props = { params: { id: string } };

async function getFacility(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/facilities/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load facility");
  return res.json();
}

export default async function FacilityDetail({ params }: Props) {
  const f = await getFacility(params.id);
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">{f.name}</h1>
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
        {/* Bed Inventory UI */}
        {/* @ts-expect-error Async Server/Client interop for dynamic import */}
        { (await import("@/components/facility/BedInventory")).default({ facilityId: params.id }) }
      </section>
    </div>
  );
}
