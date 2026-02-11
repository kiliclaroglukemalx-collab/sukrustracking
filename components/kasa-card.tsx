"use client";

import type { KasaCardData } from "@/lib/excel-processor";

const METHOD_COLORS: Record<string, string> = {
  Nakit: "#22d3ee",
  "Kredi Karti": "#a78bfa",
  "Banka Karti": "#60a5fa",
  "Havale/EFT": "#34d399",
  "Yemek Karti": "#fb923c",
  "Online Odeme": "#f472b6",
  Multinet: "#fbbf24",
  Sodexo: "#f87171",
  Ticket: "#c084fc",
  Metropol: "#38bdf8",
  Setcard: "#4ade80",
  iyzico: "#818cf8",
  PayPal: "#2dd4bf",
  Param: "#e879f9",
  Paycell: "#fb7185",
  Hopi: "#a3e635",
  Tosla: "#fcd34d",
  Papara: "#7c3aed",
  Cuzdan: "#67e8f9",
  "Acik Hesap": "#fdba74",
  "Fis/Cek": "#86efac",
  "Garanti Pay": "#93c5fd",
  "QR Odeme": "#d8b4fe",
  Puan: "#fca5a1",
};

// Fallback palette for dynamically added methods
const FALLBACK_PALETTE = [
  "#06b6d4",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#3b82f6",
  "#14b8a6",
];

function getMethodColor(name: string): string {
  if (METHOD_COLORS[name]) return METHOD_COLORS[name];
  // Hash-based fallback
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return FALLBACK_PALETTE[Math.abs(hash) % FALLBACK_PALETTE.length];
}

function formatAmount(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface KasaCardProps {
  data: KasaCardData;
}

export function KasaCard({ data }: KasaCardProps) {
  const isPositive = data.kalanKasa >= 0;
  const nameColor = getMethodColor(data.odemeTuruAdi);

  return (
    <div
      className="card-float relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-white/[0.06]"
      style={{
        background:
          "linear-gradient(145deg, #141414 0%, #0a0a0a 50%, #050505 100%)",
      }}
    >
      {/* Top edge highlight */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.08) 50%, transparent 90%)",
        }}
      />

      {/* Payment method name */}
      <span
        className="relative z-10 mb-1 font-sans text-[11px] font-black uppercase tracking-[0.2em] lg:text-xs xl:text-[13px]"
        style={{
          color: nameColor,
          textShadow: `0 0 20px ${nameColor}44`,
        }}
      >
        {data.odemeTuruAdi}
      </span>

      {/* Amount */}
      <span
        className={`relative z-10 font-mono text-lg font-black tabular-nums tracking-tight sm:text-xl md:text-2xl lg:text-3xl ${
          isPositive ? "text-white" : "text-red-400"
        }`}
        style={{
          textShadow: isPositive
            ? "0 0 30px rgba(255,255,255,0.12), 0 2px 4px rgba(0,0,0,0.5)"
            : "0 0 30px rgba(248,113,113,0.2)",
        }}
      >
        {"₺"}
        {formatAmount(data.kalanKasa)}
      </span>
    </div>
  );
}
