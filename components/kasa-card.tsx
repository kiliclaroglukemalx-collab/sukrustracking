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
      className="relative flex flex-col items-center justify-center overflow-hidden rounded-lg"
      style={{
        background: screenshotMode
          ? "radial-gradient(ellipse at center, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 50%, transparent 100%)"
          : "radial-gradient(ellipse at center, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 40%, rgba(0,0,0,0.0) 100%)",
      }}
    >
      {/* Faint border that fades at edges */}
      <div
        className="pointer-events-none absolute inset-0 rounded-lg"
        style={{
          border: "1px solid transparent",
          borderImage:
            "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 50%, transparent 100%) 1",
          mask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
          WebkitMask:
            "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
        }}
      />

      {/* Payment method name - large and prominent */}
      <span
        className={`mb-1 font-sans font-bold uppercase tracking-[0.15em] text-white/90 ${
          screenshotMode
            ? "text-[11px] lg:text-xs"
            : "text-[10px] lg:text-[11px]"
        }`}
        style={{
          textShadow: "0 1px 3px rgba(0,0,0,0.6)",
        }}
      >
        {data.odemeTuruAdi}
      </span>

      {/* Amount - the hero number */}
      <span
        className={`text-glow-strong font-mono font-black tabular-nums tracking-tight ${
          isPositive ? "text-white" : "text-red-400"
        } ${
          screenshotMode
            ? "text-lg sm:text-xl md:text-2xl lg:text-3xl"
            : "text-base sm:text-lg md:text-xl lg:text-2xl"
        }`}
      >
        {"₺"}
        {formatAmount(data.kalanKasa)}
      </span>
    </div>
  );
}
