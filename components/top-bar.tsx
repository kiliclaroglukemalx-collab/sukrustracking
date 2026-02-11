"use client";

import { LiveClock } from "@/components/live-clock";
import type { KasaCardData } from "@/lib/excel-processor";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface TopBarProps {
  data: KasaCardData[];
}

export function TopBar({ data }: TopBarProps) {
  const toplamYatirim = data.reduce((sum, d) => sum + d.toplamBorc, 0);
  const toplamCekim = data.reduce((sum, d) => sum + d.toplamKredi, 0);
  const genelToplam = data.reduce((sum, d) => sum + d.kalanKasa, 0);

  return (
    <div className="flex items-center justify-between pr-12">
      {/* Left: Title + Clock */}
      <div className="flex items-center gap-4">
        <h1 className="text-xs font-bold tracking-[0.25em] uppercase text-white md:text-sm">
          Saatlik Kasa
        </h1>
        <div className="hidden h-4 w-px bg-white/15 sm:block" />
        <div className="hidden sm:block">
          <LiveClock />
        </div>
      </div>

      {/* Right: Summary totals */}
      <div className="flex items-center gap-5 md:gap-8">
        <div className="flex flex-col items-end">
          <span className="text-[8px] font-medium uppercase tracking-widest text-white/35 lg:text-[9px]">
            Toplam Yatirim
          </span>
          <span className="font-mono text-xs font-bold text-white lg:text-sm">
            {"₺"}{formatCurrency(toplamYatirim)}
          </span>
        </div>

        <div className="h-6 w-px bg-white/10" />

        <div className="flex flex-col items-end">
          <span className="text-[8px] font-medium uppercase tracking-widest text-white/35 lg:text-[9px]">
            Toplam Cekim
          </span>
          <span className="font-mono text-xs font-bold text-red-400 lg:text-sm">
            {"₺"}{formatCurrency(toplamCekim)}
          </span>
        </div>

        <div className="h-6 w-px bg-white/10" />

        <div className="flex flex-col items-end">
          <span className="text-[8px] font-medium uppercase tracking-widest text-white/35 lg:text-[9px]">
            Genel Toplam
          </span>
          <span
            className={`font-mono text-xs font-bold lg:text-sm ${
              genelToplam >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {"₺"}{formatCurrency(genelToplam)}
          </span>
        </div>
      </div>
    </div>
  );
}
