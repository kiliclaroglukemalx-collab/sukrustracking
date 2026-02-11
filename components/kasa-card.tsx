"use client";

import type { KasaCardData } from "@/lib/excel-processor";

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

  return (
    <div
      className={`group relative flex flex-col items-center justify-center overflow-hidden rounded-lg border transition-all duration-300 ${
        screenshotMode
          ? "border-white/[0.08] bg-white/[0.04]"
          : "card-glow border-white/[0.06] bg-white/[0.03] backdrop-blur-md hover:card-glow-hover hover:border-white/[0.12] hover:bg-white/[0.06]"
      }`}
    >
      {/* Subtle top gradient line */}
      <div
        className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent ${
          screenshotMode ? "opacity-50" : "opacity-100"
        }`}
      />

      {/* Payment method name */}
      <span className="mb-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/40 lg:text-[10px]">
        {data.odemeTuruAdi}
      </span>

      {/* Amount - the hero */}
      <span
        className={`text-glow-strong font-mono text-base font-black tabular-nums tracking-tight sm:text-lg md:text-xl lg:text-2xl ${
          isPositive ? "text-white" : "text-red-400"
        }`}
      >
        {"₺"}
        {formatAmount(data.kalanKasa)}
      </span>
    </div>
  );
}
