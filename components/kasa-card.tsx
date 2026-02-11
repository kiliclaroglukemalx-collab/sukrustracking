"use client";

import type { KasaCardData } from "@/lib/excel-processor";

const NAME_COLOR = "#E5A230";

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

      {/* Payment method name - top, large, word-wrap allowed */}
      <span
        className="relative z-10 text-balance font-sans text-sm font-black uppercase leading-tight tracking-[0.15em] md:text-base lg:text-lg"
        style={{
          color: NAME_COLOR,
          textShadow: `0 0 24px ${NAME_COLOR}55`,
        }}
      >
        {data.odemeTuruAdi}
      </span>

      {/* Spacer pushes amount to bottom-center area */}
      <div className="flex flex-1 items-center justify-center">
        <span
          className={`relative z-10 font-mono text-2xl font-black tabular-nums tracking-tight sm:text-3xl md:text-3xl lg:text-4xl ${
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
