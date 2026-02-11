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
    <div className="flex items-start justify-between pr-10">
      {/* Left: Title + Timestamp */}
      <div className="flex flex-col gap-0.5">
        <h1 className="text-glow text-sm font-bold tracking-[0.3em] uppercase text-white md:text-base">
          Saatlik Kasa
        </h1>
        <LiveClock />
      </div>

      {/* Right: Three metrics inline */}
      <div className="flex items-center gap-4 md:gap-6">
        <MetricPill label="Toplam Yatirim" value={toplamYatirim} color="text-white" />
        <div className="h-5 w-px bg-white/[0.08]" />
        <MetricPill label="Toplam Cekim" value={toplamCekim} color="text-red-400" />
        <div className="h-5 w-px bg-white/[0.08]" />
        <MetricPill
          label="Genel Toplam"
          value={genelToplam}
          color={genelToplam >= 0 ? "text-emerald-400" : "text-red-400"}
        />
      </div>
    </div>
  );
}

function MetricPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex flex-col items-end gap-px">
      <span className="text-[8px] font-medium uppercase tracking-[0.15em] text-white/30 lg:text-[9px]">
        {label}
      </span>
      <span className={`font-mono text-xs font-bold tabular-nums ${color} lg:text-sm`}>
        {"₺"}{formatCurrency(value)}
      </span>
    </div>
  );
}
