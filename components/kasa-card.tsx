"use client";

import type { KasaCardData } from "@/lib/excel-processor";

const METHOD_COLORS: Record<string, string> = {
  "Nakit": "#22d3ee",
  "Kredi Kartı": "#a78bfa",
  "Banka Kartı": "#60a5fa",
  "Havale/EFT": "#34d399",
  "Yemek Kartı": "#fb923c",
  "Online Ödeme": "#f472b6",
  "Multinet": "#fbbf24",
  "Sodexo": "#f87171",
  "Ticket": "#c084fc",
  "Metropol": "#38bdf8",
  "Setcard": "#4ade80",
  "İyzico": "#818cf8",
  "PayPal": "#2dd4bf",
  "Param": "#e879f9",
  "Paycell": "#fb7185",
  "Hopi": "#a3e635",
  "Tosla": "#fcd34d",
  "Papara": "#7c3aed",
  "Cüzdan": "#67e8f9",
  "Açık Hesap": "#fdba74",
  "Fiş/Çek": "#86efac",
  "Garanti Pay": "#93c5fd",
  "QR Ödeme": "#d8b4fe",
  "Puan": "#fca5a1",
};

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
  screenshotMode?: boolean;
}

export function KasaCard({ data, screenshotMode }: KasaCardProps) {
  const isPositive = data.kalanKasa >= 0;
  const nameColor = METHOD_COLORS[data.odemeTuruAdi] || "#94a3b8";

  return (
    <div
      className={`relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/[0.06] ${
        screenshotMode ? "card-float-screenshot rounded-xl" : "card-float"
      }`}
      style={{
        background: "linear-gradient(145deg, #141414 0%, #0a0a0a 50%, #050505 100%)",
      }}
    >
      {/* Top edge highlight */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.08) 50%, transparent 90%)",
        }}
      />

      {/* Payment method name */}
      <span
        className={`relative z-10 mb-1.5 font-sans font-black uppercase tracking-[0.2em] ${
          screenshotMode
            ? "text-[11px] lg:text-xs xl:text-[13px]"
            : "text-[10px] md:text-[11px] lg:text-xs xl:text-[13px]"
        }`}
        style={{
          color: nameColor,
          textShadow: `0 0 20px ${nameColor}44`,
        }}
      >
        {data.odemeTuruAdi}
      </span>

      {/* Amount */}
      <span
        className={`relative z-10 font-mono font-black tabular-nums tracking-tight ${
          isPositive ? "text-white" : "text-red-400"
        } ${
          screenshotMode
            ? "text-lg sm:text-xl md:text-2xl lg:text-3xl"
            : "text-base sm:text-lg md:text-xl lg:text-2xl"
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
