"use client";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AuthorizedBedsChart({ s }: { s: any }) {
  const labels = ["MS", "ICU", "PED", "OBGYN", "LTC"];
  const data = [s.msCon ?? 0, s.icuCon ?? 0, s.pedCon ?? 0, s.obgynCon ?? 0, s.ltcCon ?? 0];
  return (
    <Bar
      data={{ labels, datasets: [{ label: "Authorized Beds", data, backgroundColor: "#2563eb" }] }}
      options={{ responsive: true, plugins: { legend: { display: false }, title: { display: true, text: "Authorized Beds by Category" } }, scales: { y: { title: { display: true, text: "Beds" } } } }}
    />
  );
}

