"use client";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend, Title);

const order = ["raceWhite", "raceBlack", "raceNativeAmerican", "raceAsian", "racePacificIslander", "raceUnknown"] as const;
const labels = ["White", "Black", "AI/AN", "Asian", "NH/PI", "Unknown"];
const colors = ["#60a5fa", "#f59e0b", "#84cc16", "#10b981", "#a78bfa", "#9ca3af"];

export default function RaceChart({ s }: { s: any }) {
  const data = order.map((k) => (s?.[k] ?? 0) * 100);
  return (
    <Doughnut
      data={{ labels, datasets: [{ data, backgroundColor: colors }] }}
      options={{ plugins: { legend: { position: 'bottom' }, title: { display: true, text: 'Race Composition (%)' }, tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed.toFixed(1)}%` } } } }}
    />
  );
}

