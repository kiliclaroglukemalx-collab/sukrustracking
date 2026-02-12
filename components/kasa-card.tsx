"use client";

import type { KasaCardData } from "@/lib/excel-processor";

function formatAmount(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Pick a font size class based on how many digits the formatted string has
function amountSizeClass(formatted: string): string {
  const len = formatted.length; // includes dots and minus
  if (len >= 10) return "text-sm sm:text-base lg:text-lg";
  if (len >= 8) return "text-base sm:text-lg lg:text-xl";
  if (len >= 6) return "text-lg sm:text-xl lg:text-2xl";
  return "text-xl sm:text-2xl lg:text-3xl";
}

interface KasaCardProps {
  data: KasaCardData;
  index: number;
}

export function KasaCard({ data }: KasaCardProps) {
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
    <div
      className="card-float flex flex-col overflow-hidden rounded-xl border border-neutral-500/50"
      style={{
        background: "linear-gradient(180deg, #f0f0f0 0%, #e5e5e5 38%, #404040 50%, #0a0a0a 62%, #0a0a0a 100%)",
      }}
    >
      {/* Top half - method name */}
      <div className="flex flex-1 flex-col justify-center px-3 py-2">
        <span className="text-xs font-extrabold uppercase leading-tight tracking-[0.12em] text-neutral-900 text-balance md:text-sm lg:text-base">
          {mainName}
        </span>
        {subName && (
          <span className="mt-0.5 block truncate text-[8px] font-semibold uppercase tracking-wider text-neutral-500 md:text-[9px]">
            {subName}
          </span>
        )}
      </div>

      {/* Bottom half - amount + komisyon */}
      <div className="flex flex-1 flex-col items-center justify-center px-2 py-2">
        {(() => {
          const formatted = formatAmount(data.kalanKasa);
          const sizeClass = amountSizeClass(formatted);
          return (
            <span
              className={`font-mono font-black tabular-nums tracking-tight ${sizeClass} ${
                isNegative ? "text-red-500" : "text-white"
              }`}
              style={{
                textShadow: isNegative
                  ? "0 0 24px rgba(239,68,68,0.3)"
                  : "0 0 20px rgba(255,255,255,0.1)",
              }}
            >
              {"₺"}
              {formatted}
            </span>
          );
        })()}
        {/* Accent underline */}
        <div
          className="mt-1.5 h-[2px] w-3/5 rounded-full"
          style={{
            background: isNegative
              ? "linear-gradient(90deg, transparent, rgba(239,68,68,0.5), transparent)"
              : "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
          }}
        />
      </div>
    </div>
  );
}
