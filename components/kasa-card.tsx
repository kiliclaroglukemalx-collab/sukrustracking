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
      className={`relative flex flex-col items-center justify-center overflow-hidden rounded-2xl transition-transform hover:-translate-y-0.5 ${
        screenshotMode ? "card-float-screenshot rounded-xl" : "card-float"
      }`}
      style={{
        background:
          "radial-gradient(ellipse at center, #111111 0%, #0c0c0c 40%, #080808 70%, transparent 100%)",
      }}
    >
      {/* Outer gradient mask that fades edges into the white background */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          background:
            "linear-gradient(to bottom, transparent 60%, rgba(255,255,255,0.03) 100%)",
        }}
      />

      {/* Subtle inner border glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 20px rgba(255,255,255,0.02)",
        }}
      />

      {/* Payment method name - prominent, colored */}
      <span
        className={`relative z-10 mb-1.5 font-sans font-extrabold uppercase tracking-[0.18em] text-cyan-400 ${
          screenshotMode
            ? "text-[11px] lg:text-xs xl:text-[13px]"
            : "text-[10px] md:text-[11px] lg:text-xs xl:text-[13px]"
        }`}
      >
        {data.odemeTuruAdi}
      </span>

      {/* Amount - the hero number */}
      <span
        className={`relative z-10 font-mono font-black tabular-nums tracking-tight ${
          isPositive ? "text-white" : "text-red-400"
        } ${
          screenshotMode
            ? "text-lg sm:text-xl md:text-2xl lg:text-3xl"
            : "text-base sm:text-lg md:text-xl lg:text-2xl"
        }`}
        style={{
          textShadow: "0 0 20px rgba(255,255,255,0.15)",
        }}
      >
        {"₺"}
        {formatAmount(data.kalanKasa)}
      </span>
    </div>
  );
}
