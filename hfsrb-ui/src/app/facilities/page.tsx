import Link from "next/link";

async function getFacilities(params: { hsa?: string; q?: string; hospital_type?: string; year?: string }) {
  const qs = new URLSearchParams();
  if (params.hsa) qs.set("hsa", params.hsa);
  if (params.q) qs.set("q", params.q);
  if (params.hospital_type) qs.set("hospital_type", params.hospital_type);
  if (params.year) qs.set("year", params.year);
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/facilities?${qs.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load facilities");
  return res.json();
}

export default async function FacilitiesPage({ searchParams }: { searchParams: { hsa?: string; q?: string; hospital_type?: string; year?: string } }) {
  const rows = await getFacilities(searchParams);
  const currentHsa = searchParams.hsa || "";
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Illinois Hospital Profiles</h1>
      <form className="flex gap-2 mb-4" method="get">
        <select name="hsa" defaultValue={currentHsa} className="border rounded px-2 py-1">
          <option value="">All HSAs</option>
          {Array.from({ length: 11 }).map((_, i) => (
            <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
          ))}
        </select>
        <input name="year" placeholder="2024" className="border rounded px-2 py-1 w-24" defaultValue={searchParams.year || '2024'} />
        <input name="q" placeholder="Search facility" className="border rounded px-2 py-1" defaultValue={searchParams.q || ""} />
        <button className="bg-blue-600 text-white px-3 py-1 rounded" type="submit">Filter</button>
      </form>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="text-left p-2 border">Name</th>
            <th className="text-left p-2 border">HSA</th>
            <th className="text-left p-2 border">HPA</th>
            <th className="text-left p-2 border">Type</th>
            <th className="text-left p-2 border">View</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((f: any) => (
            <tr key={f.id}>
              <td className="p-2 border">{f.name}</td>
              <td className="p-2 border">{f.hsa ?? ""}</td>
              <td className="p-2 border">{f.hpa ?? ""}</td>
              <td className="p-2 border">{f.hospitalType ?? ""}</td>
              <td className="p-2 border"><Link className="text-blue-700 underline" href={`/facility/${encodeURIComponent(f.id)}`}>Details</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
