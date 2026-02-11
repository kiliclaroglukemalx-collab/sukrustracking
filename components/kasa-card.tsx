"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { KasaCardData } from "@/lib/excel-processor";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface KasaCardProps {
  data: KasaCardData;
}

export function KasaCard({ data }: KasaCardProps) {
  const isPositive = data.kalanKasa > 0;
  const isNegative = data.kalanKasa < 0;

  return (
    <div className="group relative flex flex-col justify-between rounded-md border border-white/[0.08] bg-black/60 px-2.5 py-2 backdrop-blur-md transition-all hover:border-white/20 hover:bg-black/70">
      {/* Payment Type Name */}
      <h3 className="mb-1.5 truncate text-[10px] font-bold uppercase tracking-wider text-white/70">
        {data.odemeTuruAdi}
      </h3>

      {/* Compact Financial Details */}
      <div className="flex flex-col gap-0.5 text-[9px]">
        <div className="flex items-center justify-between">
          <span className="text-white/40">Borc</span>
          <span className="font-mono font-medium text-white/80">
            {formatCurrency(data.toplamBorc)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-white/40">
            Kom. %{data.komisyonOrani}
          </span>
          <span className="font-mono font-medium text-red-400/80">
            -{formatCurrency(data.komisyon)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-white/40">Kredi</span>
          <span className="font-mono font-medium text-red-400/80">
            -{formatCurrency(data.toplamKredi)}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="my-1 border-t border-white/[0.08]" />

      {/* Kalan Kasa - Main Result */}
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-semibold text-white/60">KALAN</span>
        <div className="flex items-center gap-1">
          {isPositive ? (
            <TrendingUp className="h-2.5 w-2.5 text-emerald-400" />
          ) : isNegative ? (
            <TrendingDown className="h-2.5 w-2.5 text-red-400" />
          ) : (
            <Minus className="h-2.5 w-2.5 text-white/40" />
          )}
          <span
            className={`font-mono text-xs font-bold ${
              isPositive
                ? "text-emerald-400"
                : isNegative
                  ? "text-red-400"
                  : "text-white"
            }`}
          >
            {formatCurrency(data.kalanKasa)}
          </span>
        </div>
      </div>
    </div>
  );
}
