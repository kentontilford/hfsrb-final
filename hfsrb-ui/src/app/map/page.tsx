"use client";
import { useEffect, useRef } from "react";

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src; s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

function loadCss(href: string) {
  const l = document.createElement("link");
  l.rel = "stylesheet"; l.href = href;
  document.head.appendChild(l);
}

export default function MapPage() {
  const ref = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    loadCss("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
    loadCss("https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css");
    loadCss("https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css");
    loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js").then(async () => {
      await loadScript("https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js");
      await loadScript("https://unpkg.com/leaflet-easyprint@2.1.9/dist/bundle.js");
      const L = (window as any).L;
      const map = L.map(ref.current!).setView([40.0, -89.0], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      let cluster = (L as any).markerClusterGroup();
      let layer: any = null;

      async function loadWithParams(params = new URLSearchParams()) {
        const res = await fetch('/api/map_data?' + params.toString());
        const gj = await res.json();
        if (layer) { map.removeLayer(layer); cluster.clearLayers(); }
        layer = L.geoJSON(gj, {
          pointToLayer: (f: any, latlng: any) => L.marker(latlng),
          onEachFeature: (f: any, layer: any) => {
            layer.bindPopup(`<strong>${f.properties.name}</strong><br/>HSA ${f.properties.hsa ?? ''}`);
          }
        });
        cluster.addLayer(layer);
        cluster.addTo(map);
        try { if (layer.getBounds && layer.getBounds().isValid()) map.fitBounds(layer.getBounds()); } catch {}
      }

      // Easy print
      (L as any).easyPrint({ exportOnly: true, title: 'Download map', filename: 'hospitals_map' }).addTo(map);

      await loadWithParams();

      // Wire form submit if present
      formRef.current?.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(formRef.current!);
        const qs = new URLSearchParams();
        const hsa = (fd.get('hsa') as string) || '';
        const hpa = (fd.get('hpa') as string) || '';
        const lat = (fd.get('origin_lat') as string) || '';
        const lng = (fd.get('origin_lng') as string) || '';
        const max = (fd.get('max_distance_km') as string) || '';
        if (hsa) qs.set('hsa', hsa);
        if (hpa) qs.set('hpa', hpa);
        if (lat && lng && max) { qs.set('origin_lat', lat); qs.set('origin_lng', lng); qs.set('max_distance_km', max); }
        loadWithParams(qs);
      });
    }).catch(console.error);
  }, []);

  return (
    <div className="p-6 space-y-3">
      <h1 className="text-2xl font-semibold">Hospitals Map</h1>
      <form ref={formRef} className="flex flex-wrap gap-2 items-end">
        <label className="text-sm">HSA
          <select name="hsa" className="border rounded px-2 py-1 ml-2">
            <option value="">All</option>
            {Array.from({ length: 11 }).map((_, i) => <option key={i+1} value={String(i+1)}>{i+1}</option>)}
          </select>
        </label>
        <label className="text-sm">HPA <input name="hpa" placeholder="A-01" className="border rounded px-2 py-1 ml-2 w-28" /></label>
        <label className="text-sm">Origin Lat <input name="origin_lat" placeholder="41.88" className="border rounded px-2 py-1 ml-2 w-28" /></label>
        <label className="text-sm">Origin Lng <input name="origin_lng" placeholder="-87.63" className="border rounded px-2 py-1 ml-2 w-28" /></label>
        <label className="text-sm">Max km <input name="max_distance_km" placeholder="25" className="border rounded px-2 py-1 ml-2 w-24" /></label>
        <button className="bg-blue-600 text-white px-3 py-1 rounded">Apply</button>
      </form>
      <div ref={ref} style={{ height: 600 }} className="w-full border rounded" />
    </div>
  );
}
