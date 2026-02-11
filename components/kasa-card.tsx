"use client";

import type { KasaCardData } from "@/lib/excel-processor";

function formatAmount(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
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

  return (
    <div className="flex flex-col items-center justify-center rounded border border-white/[0.07] bg-zinc-900/50 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-zinc-900/70">
      {/* Payment type name - top */}
      <span className="mb-1 text-[9px] font-semibold uppercase tracking-[0.15em] text-white/50 lg:text-[10px]">
        {data.odemeTuruAdi}
      </span>

      {/* Amount - centered, big, bright */}
      <span
        className={`font-mono text-sm font-bold tracking-tight md:text-base lg:text-lg ${
          isPositive ? "text-white" : "text-red-400"
        }`}
      >
        {"₺"}
        {formatAmount(data.kalanKasa)}
      </span>
    </div>
  );
}
