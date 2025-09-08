"use client";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend);

function pct(msPatientDays?: number, msCon?: number) {
  if (!msPatientDays || !msCon || msCon <= 0) return 0;
  const adc = msPatientDays / 365;
  return Math.max(0, Math.min(1, adc / msCon));
}

export default function OccupancyGauge({ s }: { s: any }) {
  const p = pct(s.msPatientDays, s.msCon);
  const data = {
    labels: ["Occupied", "Available"],
    datasets: [{ data: [p * 100, (1 - p) * 100], backgroundColor: ["#16a34a", "#d1d5db"] }]
  };
  return (<div style={{ width: 240 }}>
    <Doughnut data={data} options={{ plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed.toFixed(1)}%` } }, title: { display: true, text: "MS Occupancy (approx)" } } }} />
  </div>);
}

