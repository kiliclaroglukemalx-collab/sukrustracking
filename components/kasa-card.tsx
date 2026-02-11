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
  index: number;
}

export function KasaCard({ data, index }: KasaCardProps) {
  const isNegative = data.kalanKasa < 0;

  // Split name: main part vs parenthetical
  const parenIdx = data.odemeTuruAdi.indexOf("(");
  const mainName =
    parenIdx > -1
      ? data.odemeTuruAdi.slice(0, parenIdx).trim()
      : data.odemeTuruAdi;
  const subName =
    parenIdx > -1 ? data.odemeTuruAdi.slice(parenIdx).trim() : null;

  return (
    <div className="card-float flex flex-col overflow-hidden rounded-xl">
      {/* Top half - light, method name */}
      <div className="flex flex-1 flex-col justify-center bg-neutral-100 px-3 py-2">
        <span className="text-xs font-extrabold uppercase leading-tight tracking-[0.12em] text-neutral-900 text-balance md:text-sm lg:text-base">
          {mainName}
        </span>
        {subName && (
          <span className="mt-0.5 block truncate text-[8px] font-semibold uppercase tracking-wider text-neutral-400 md:text-[9px]">
            {subName}
          </span>
        )}
      </div>

      {/* Bottom half - dark, amount */}
      <div className="flex flex-1 items-center justify-center bg-neutral-950 px-3 py-2.5">
        <span
          className={`font-mono text-xl font-black tabular-nums tracking-tight sm:text-2xl lg:text-3xl ${
            isNegative ? "text-red-500" : "text-white"
          }`}
          style={{
            textShadow: isNegative
              ? "0 0 24px rgba(239,68,68,0.3)"
              : "0 0 20px rgba(255,255,255,0.1)",
          }}
        >
          {"₺"}
          {formatAmount(data.kalanKasa)}
        </span>
      </div>
    </div>
  );
}
