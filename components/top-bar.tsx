"use client";

import { useState, useEffect } from "react";
import type { KasaCardData } from "@/lib/excel-processor";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getRoundedHour(): string {
  const now = new Date();
  const mins = now.getMinutes();
  const h = mins >= 30 ? now.getHours() + 1 : now.getHours();
  const hour = h % 24;
  return `${hour.toString().padStart(2, "0")}:00`;
}

interface TopBarProps {
  data: KasaCardData[];
}

export function TopBar({ data }: TopBarProps) {
  const [roundedHour, setRoundedHour] = useState(getRoundedHour);

  useEffect(() => {
    const timer = setInterval(() => setRoundedHour(getRoundedHour()), 30000);
    return () => clearInterval(timer);
  }, []);

  const toplamYatirim = data.reduce((sum, d) => sum + d.toplamBorc, 0);
  const toplamCekim = data.reduce((sum, d) => sum + d.toplamKredi, 0);
  const toplamKomisyon = data.reduce((sum, d) => sum + d.komisyon, 0);

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Large centered hour title */}
      <h1 className="flex items-baseline gap-3 font-mono text-2xl font-black tracking-wider text-neutral-900 md:text-3xl lg:text-4xl">
        <span>{roundedHour}</span>
        <span className="font-sans text-xl font-bold tracking-[0.25em] uppercase md:text-2xl lg:text-3xl">
          Saatlik Kasasi
        </span>
      </h1>

      {/* Three metrics side by side */}
      <div className="flex items-center gap-6 md:gap-8">
        <Metric label="Toplam Yatirim" value={toplamYatirim} color="text-neutral-800" />
        <div className="h-4 w-px bg-neutral-200" />
        <Metric label="Toplam Komisyon" value={toplamKomisyon} color="text-amber-600" />
        <div className="h-4 w-px bg-neutral-200" />
        <Metric label="Toplam Cekim" value={toplamCekim} color="text-red-600" />
      </div>
    </div>
  );
}

function Metric({
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
      <span className="text-[8px] font-medium uppercase tracking-[0.2em] text-neutral-400 md:text-[9px]">
        {label}
      </span>
      <span className={`font-mono text-xs font-bold tabular-nums md:text-sm ${color}`}>
        {"₺"}{formatCurrency(value)}
      </span>
    </div>
  );
}
