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
  screenshotMode?: boolean;
}

function getRoundedHour(): string {
  const now = new Date();
  const mins = now.getMinutes();
  const h = mins >= 30 ? now.getHours() + 1 : now.getHours();
  const hour = h % 24;
  return `${hour.toString().padStart(2, "0")}:00`;
}

export function TopBar({ data, screenshotMode }: TopBarProps) {
  const toplamYatirim = data.reduce((sum, d) => sum + d.toplamBorc, 0);
  const toplamCekim = data.reduce((sum, d) => sum + d.toplamKredi, 0);
  const toplamKomisyon = data.reduce((sum, d) => sum + d.komisyon, 0);

  if (screenshotMode) {
    const roundedHour = getRoundedHour();
    return (
      <div className="flex flex-col items-center gap-1.5 pb-1">
        {/* Large centered hour title */}
        <h1 className="text-glow-strong font-mono text-2xl font-black tracking-wider text-foreground md:text-3xl">
          {roundedHour}{" "}
          <span className="font-sans text-xl font-bold tracking-[0.2em] uppercase md:text-2xl">
            Saatlik Kasasi
          </span>
        </h1>

        {/* Three metrics side by side */}
        <div className="flex items-center gap-8">
          <ScreenshotMetric
            label="Toplam Yatirim"
            value={toplamYatirim}
            color="text-foreground"
          />
          <div className="h-4 w-px bg-foreground/10" />
          <ScreenshotMetric
            label="Toplam Komisyon"
            value={toplamKomisyon}
            color="text-amber-600"
          />
          <div className="h-4 w-px bg-foreground/10" />
          <ScreenshotMetric
            label="Toplam Cekim"
            value={toplamCekim}
            color="text-red-500"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between pr-10">
      {/* Left: Title + Timestamp */}
      <div className="flex flex-col gap-0.5">
        <h1 className="text-glow text-sm font-bold tracking-[0.3em] uppercase text-foreground md:text-base">
          Saatlik Kasa
        </h1>
        <LiveClock />
      </div>

      {/* Right: Three metrics inline */}
      <div className="flex items-center gap-4 md:gap-6">
        <MetricPill
          label="Toplam Yatirim"
          value={toplamYatirim}
          color="text-foreground"
        />
        <div className="h-5 w-px bg-foreground/10" />
        <MetricPill
          label="Toplam Cekim"
          value={toplamCekim}
          color="text-red-500"
        />
        <div className="h-5 w-px bg-foreground/10" />
        <MetricPill
          label="Genel Toplam"
          value={
            toplamYatirim -
            toplamCekim -
            data.reduce((s, d) => s + d.komisyon, 0)
          }
          color="text-emerald-600"
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
      <span className="text-[8px] font-medium uppercase tracking-[0.15em] text-foreground/35 lg:text-[9px]">
        {label}
      </span>
      <span
        className={`font-mono text-xs font-bold tabular-nums ${color} lg:text-sm`}
      >
        {"₺"}
        {formatCurrency(value)}
      </span>
    </div>
  );
}

function ScreenshotMetric({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-foreground/40 md:text-[10px]">
        {label}
      </span>
      <span
        className={`font-mono text-sm font-bold tabular-nums md:text-base ${color}`}
      >
        {"₺"}
        {formatCurrency(value)}
      </span>
    </div>
  );
}
