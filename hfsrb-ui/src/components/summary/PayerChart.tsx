"use client";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend, Title);

const labels = ["Medicare","Medicaid","Private","Other Public","Private Pay","Charity Care"];
const keys = ["payerMedicare","payerMedicaid","payerPrivate","payerOtherPublic","payerPrivatePay","payerCharity"] as const;
const colors = ["#2563eb","#059669","#6b7280","#f59e0b","#ef4444","#8b5cf6"];

export default function PayerChart({ s, title = 'Payer Mix (%)' }: { s: any; title?: string }) {
  const data = keys.map(k => (Number(s?.[k]) || 0) * 100);
  return (
    <Doughnut data={{ labels, datasets: [{ data, backgroundColor: colors }] }} options={{ plugins: { legend: { position: 'bottom' }, title: { display: true, text: title }, tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed.toFixed(1)}%` } } } }} />
  );
}

