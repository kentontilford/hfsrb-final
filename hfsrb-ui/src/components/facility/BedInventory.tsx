"use client";
import { useEffect, useState } from "react";

type Entry = { bed_type: string; authorised_beds: number; effective_date: string; entered_at?: string };

export default function BedInventory({ facilityId }: { facilityId: string }) {
  const [latest, setLatest] = useState<Entry[]>([]);
  const [history, setHistory] = useState<Entry[]>([]);
  const [form, setForm] = useState({ bed_type: "MS-CON", authorised_beds: "", effective_date: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [a, b] = await Promise.all([
      fetch(`/api/facilities/${encodeURIComponent(facilityId)}/beds`).then(r => r.json()),
      fetch(`/api/facilities/${encodeURIComponent(facilityId)}/beds/history`).then(r => r.json()),
    ]);
    setLatest(a);
    setHistory(b);
  }

  useEffect(() => { load(); }, [facilityId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(null);
    try {
      const res = await fetch(`/api/facilities/${encodeURIComponent(facilityId)}/beds`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
          bed_type: form.bed_type,
          authorised_beds: Number(form.authorised_beds),
          effective_date: form.effective_date,
        })
      });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || `HTTP ${res.status}`); }
      setForm({ bed_type: form.bed_type, authorised_beds: "", effective_date: form.effective_date });
      await load();
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">Bed Inventory</h2>
      <table className="w-full text-sm border-collapse">
        <thead><tr className="bg-gray-100"><th className="p-2 border">Type</th><th className="p-2 border">Authorized</th><th className="p-2 border">Effective</th></tr></thead>
        <tbody>
          {latest.map((e: any) => (
            <tr key={e.bed_type}><td className="p-2 border">{e.bed_type}</td><td className="p-2 border">{e.authorised_beds}</td><td className="p-2 border">{e.effective_date?.slice(0,10)}</td></tr>
          ))}
          {latest.length === 0 && <tr><td colSpan={3} className="p-2 border text-gray-500">No entries.</td></tr>}
        </tbody>
      </table>
      <details>
        <summary className="cursor-pointer">View change log</summary>
        <table className="w-full text-sm border-collapse mt-2">
          <thead><tr className="bg-gray-50"><th className="p-2 border">Type</th><th className="p-2 border">Authorized</th><th className="p-2 border">Effective</th><th className="p-2 border">Entered</th></tr></thead>
          <tbody>
            {history.map((e: any, i: number) => (
              <tr key={i}><td className="p-2 border">{e.bed_type}</td><td className="p-2 border">{e.authorised_beds}</td><td className="p-2 border">{e.effective_date?.slice(0,10)}</td><td className="p-2 border">{e.entered_at?.slice?.(0,19)?.replace('T',' ') ?? ''}</td></tr>
            ))}
            {history.length === 0 && <tr><td colSpan={4} className="p-2 border text-gray-500">No history.</td></tr>}
          </tbody>
        </table>
      </details>
      <form onSubmit={submit} className="border rounded p-3 space-y-2">
        <div className="font-semibold">Add Change</div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="flex flex-wrap gap-2">
          <select className="border rounded px-2 py-1" value={form.bed_type} onChange={e => setForm({ ...form, bed_type: e.target.value })}>
            {['MS-CON','ICU-CON','PED-CON','OBGYN-CON','LTC-CON','NICU-CON','REHAB-CON','PSYCH-CON'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input className="border rounded px-2 py-1" type="number" min="0" placeholder="Authorized beds" value={form.authorised_beds} onChange={e => setForm({ ...form, authorised_beds: e.target.value })} />
          <input className="border rounded px-2 py-1" type="date" value={form.effective_date} onChange={e => setForm({ ...form, effective_date: e.target.value })} />
          <button disabled={saving} className="bg-blue-600 text-white px-3 py-1 rounded" type="submit">{saving ? 'Saving…' : 'Add'}</button>
        </div>
      </form>
    </div>
  );
}

