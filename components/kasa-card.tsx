"use client";

import type { KasaCardData } from "@/lib/excel-processor";

const METHOD_COLORS = [
  "#22d3ee", "#a78bfa", "#f97316", "#34d399", "#f472b6",
  "#facc15", "#60a5fa", "#e879f9", "#fb923c", "#4ade80",
  "#c084fc", "#38bdf8", "#fbbf24", "#f87171", "#2dd4bf",
  "#a3e635", "#818cf8", "#fb7185", "#67e8f9", "#d946ef",
  "#fca5a1", "#86efac", "#fde047", "#93c5fd",
];

const NAME_COLOR = "#ffffff"; // Declare NAME_COLOR variable

function getMethodColor(index: number): string {
  return METHOD_COLORS[index % METHOD_COLORS.length];
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
  index: number;
}

export function KasaCard({ data, index }: KasaCardProps) {
  const nameColor = getMethodColor(index);
  const isNegative = data.kalanKasa < 0;

  return (
    <div
      className="card-float relative flex flex-col overflow-hidden rounded-xl border border-white/[0.06] px-3 py-2.5"
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

      {/* Payment method name - top, word-wrap allowed */}
      <span
        className="relative z-10 text-balance font-sans text-xs font-extrabold uppercase leading-tight tracking-[0.14em] md:text-sm lg:text-base"
        style={{
          color: nameColor,
          textShadow: `0 0 20px ${nameColor}44`,
        }}
      >
        {data.odemeTuruAdi}
      </span>

      {/* Amount centered */}
      <div className="flex flex-1 items-center justify-center">
        <span
          className={`relative z-10 font-mono text-xl font-black tabular-nums tracking-tight sm:text-2xl lg:text-3xl ${
            isNegative ? "text-red-500" : "text-white"
          }`}
          style={{
            textShadow: isNegative
              ? "0 0 30px rgba(239,68,68,0.25)"
              : "0 0 30px rgba(255,255,255,0.12), 0 2px 4px rgba(0,0,0,0.5)",
          }}
        >
          {"₺"}
          {formatAmount(data.kalanKasa)}
        </span>
      </div>
    </div>
  );
}
