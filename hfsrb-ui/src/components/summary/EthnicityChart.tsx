"use client";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend, Title);

export default function EthnicityChart({ s }: { s: any }) {
  const his = (s?.ethnicityHispanic ?? 0) * 100;
  const non = (s?.ethnicityNonHispanic ?? 0) * 100;
  const unk = (s?.ethnicityUnknown ?? 0) * 100;
  return (
    <Doughnut
      data={{ labels: ["Hispanic/Latino", "Not Hispanic/Latino", "Unknown"], datasets: [{ data: [his, non, unk], backgroundColor: ["#ef4444", "#3b82f6", "#9ca3af"] }] }}
      options={{ plugins: { legend: { position: 'bottom' }, title: { display: true, text: 'Ethnicity Composition (%)' }, tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed.toFixed(1)}%` } } } }}
    />
  );
}

